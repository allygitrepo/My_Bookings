import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Box, Typography, Avatar, Chip, IconButton, Button, Divider,
    TextField, FormControlLabel, Checkbox, TablePagination,
} from '@mui/material';
import { Schedule as ScheduleIcon, Edit as EditIcon, Add as AddIcon, Remove as RemoveIcon, Warning as WarningIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getStaffAvailability, bulkCreateStaffAvailability, deleteStaffAvailabilityByStaff } from '../api/staffAvailability.api';
import { getStaff } from '../api/staff.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayColors = {
    Monday: 'primary', Tuesday: 'secondary', Wednesday: 'info',
    Thursday: 'warning', Friday: 'success', Saturday: 'error', Sunday: 'default',
};

const Availability = () => {
    const { searchQuery } = useSearch();
    const [availability, setAvailability] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStaff, setFilterStaff] = useState('all');
    const [open, setOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [saving, setSaving] = useState(false);
    const [slotErrors, setSlotErrors] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, filterStaff]);

    const filteredAvailability = availability.filter(a => {
        const staffName = staffList.find(s => s.id === a.staff_id)?.staff_name || '';
        const matchesSearch = staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.day_of_week.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.start_time.includes(searchQuery) ||
            a.end_time.includes(searchQuery);

        if (filterStaff === 'all') return matchesSearch;
        return a.staff_id === filterStaff && matchesSearch;
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [availRes, staffRes] = await Promise.all([
                getStaffAvailability(), getStaff()
            ]);
            if (availRes.success) setAvailability(availRes.data);
            if (staffRes.success) setStaffList(staffRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (staff) => {
        setSelectedStaff(staff);
        const existing = availability.filter(a => a.staff_id === staff.id);
        const sched = {};
        existing.forEach(a => {
            const dayMatch = DAYS.find(d => d.toLowerCase() === a.day_of_week.toLowerCase());
            if (dayMatch) {
                if (!sched[dayMatch]) sched[dayMatch] = [];
                sched[dayMatch].push({ id: a.id, start_time: a.start_time, end_time: a.end_time });
            }
        });
        setSchedule(sched);
        setOpen(true);
    };

    const toggleDay = (day) => {
        setSchedule(prev => {
            if (prev[day]) {
                const next = { ...prev };
                delete next[day];
                return next;
            }
            return { ...prev, [day]: [{ start_time: '09:00', end_time: '17:00' }] };
        });
    };

    const addSlot = (day) => {
        setSchedule(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), { start_time: '09:00', end_time: '17:00' }],
        }));
    };

    const removeSlot = (day, idx) => {
        setSchedule(prev => {
            const slots = prev[day].filter((_, i) => i !== idx);
            if (slots.length === 0) {
                const next = { ...prev };
                delete next[day];
                return next;
            }
            return { ...prev, [day]: slots };
        });
    };

    const updateSlot = (day, idx, field, value) => {
        setSchedule(prev => {
            const updatedDaySlots = prev[day].map((slot, i) => i === idx ? { ...slot, [field]: value } : slot);
            return { ...prev, [day]: updatedDaySlots };
        });

        // Removed "End time must be after start time" validation to allow overnight shifts
        setSlotErrors(prev => {
            const key = `${day}-${idx}`;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const copyToAll = (sourceDay) => {
        const slotsToCopy = schedule[sourceDay];
        if (!slotsToCopy) return;
        const newSchedule = { ...schedule };
        DAYS.filter(d => !!newSchedule[d]).forEach(day => {
            newSchedule[day] = slotsToCopy.map(s => ({ start_time: s.start_time, end_time: s.end_time }));
        });
        setSchedule(newSchedule);
        toast.success(`Copied ${sourceDay}'s schedule to all active days`);
    };

    const checkOverlap = (s1, s2) => {
        if (!s1.start_time || !s1.end_time || !s2.start_time || !s2.end_time) return false;
        const getIntervals = (s) => {
            if (s.start_time < s.end_time) return [[s.start_time, s.end_time]];
            return [[s.start_time, '23:59'], ['00:00', s.end_time]];
        };
        const i1 = getIntervals(s1);
        const i2 = getIntervals(s2);
        return i1.some(([s1s, s1e]) => i2.some(([s2s, s2e]) => s1s < s2e && s1e > s2s));
    };

    const handleSave = async () => {
        if (saving) return;
        // Validate all time slots for overlaps before saving
        const clashingDays = [];
        
        Object.entries(schedule).forEach(([day, slots]) => {
            const hasClash = slots.some((slot, idx) => slots.some((other, j) => idx !== j && checkOverlap(slot, other)));
            if (hasClash) clashingDays.push(day);
        });

        if (clashingDays.length > 0) {
            toast.error(`Schedule conflict detected on: ${clashingDays.join(', ')}. Please adjust overlapping shifts.`);
            return;
        }

        setSaving(true);
        setOpen(false); // Close immediately
        showGlobalLoader('Updating availability...');

        try {
            // Remove all existing for this staff and re-create in bulk
            await deleteStaffAvailabilityByStaff(selectedStaff.id);

            const records = [];
            Object.entries(schedule).forEach(([day, slots]) => {
                slots.forEach(slot => {
                    records.push({
                        staff_id: selectedStaff.id,
                        day_of_week: day.toLowerCase(),
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                    });
                });
            });
            if (records.length > 0) {
                await bulkCreateStaffAvailability(records);
            }
            toast.success('Availability updated successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to update availability');
        } finally {
            setSaving(false);
            hideGlobalLoader();
        }
    };

    // Sort by staff name, then day order
    const sorted = [...filteredAvailability].sort((a, b) => {
        const sa = staffList.find(s => s.id === a.staff_id)?.staff_name || '';
        const sb = staffList.find(s => s.id === b.staff_id)?.staff_name || '';
        if (sa !== sb) return sa.localeCompare(sb);
        return DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);
    });

    return (
        <PageTransition>
            <PageHeader
                title="Staff Availability"
                subtitle="View working hours for each team member. Edit availability from the Staff page."
            />

            {/* Staff filter chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Filter:</Typography>
                <Chip
                    label="All Staff"
                    size="small"
                    variant={filterStaff === 'all' ? 'filled' : 'outlined'}
                    color={filterStaff === 'all' ? 'primary' : 'default'}
                    onClick={() => setFilterStaff('all')}
                    clickable
                />
                {staffList.map(s => (
                    <Chip
                        key={s.id}
                        label={s.staff_name}
                        size="small"
                        variant={filterStaff === s.id ? 'filled' : 'outlined'}
                        color={filterStaff === s.id ? 'primary' : 'default'}
                        onClick={() => setFilterStaff(s.id)}
                        clickable
                        avatar={<Avatar sx={{ fontSize: '0.65rem' }}>{s.staff_name?.charAt(0)}</Avatar>}
                    />
                ))}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Staff Member</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Day of Week</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary">Loading availability records...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredAvailability.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <ScheduleIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {searchQuery ? 'No availability records match your search.' : 'No availability records yet.'}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">Add availability when creating or editing staff members.</Typography>
                            </TableCell></TableRow>
                        ) : sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((a, idx) => {
                            const staffMember = staffList.find(s => s.id === a.staff_id);
                            const [sh, sm] = (a.start_time || '00:00').split(':').map(Number);
                            const [eh, em] = (a.end_time || '00:00').split(':').map(Number);
                            const durationMin = (eh * 60 + em) - (sh * 60 + sm);
                            const durationLabel = durationMin > 0 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : '—';
                            return (
                                <TableRow key={a.id || idx} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + idx + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                                {staffMember?.staff_name?.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={500}>{staffMember?.staff_name || '—'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={a.day_of_week} size="small" color={dayColors[a.day_of_week] || 'default'} variant="outlined" />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{a.start_time}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{a.end_time}</TableCell>
                                    <TableCell>
                                        <Box sx={{ px: 1.5, py: 0.3, display: 'inline-block', borderRadius: 1, bgcolor: 'success.50', color: 'success.dark', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {durationLabel}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(staffMember)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50]}
                component="div"
                count={sorted.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                    const rpp = parseInt(e.target.value, 10);
                    setRowsPerPage(rpp);
                    localStorage.setItem('rowsPerPage', rpp);
                    setPage(0);
                }}
            />

            <FormDrawer
                open={open}
                onClose={() => setOpen(false)}
                title={`Edit Availability`}
                subtitle={`Set working hours for ${selectedStaff?.staff_name}`}
                onSave={handleSave}
                isLoading={saving}
                saveLabel={saving ? 'Updating...' : 'Update Availability'}
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                        Weekly Schedule
                    </Typography>
                    {DAYS.map(day => {
                        const isDayClashing = schedule[day]?.some((slot, idx) => schedule[day].some((other, j) => idx !== j && checkOverlap(slot, other)));
                        
                        return (
                            <Box key={day} sx={{ 
                                mb: 3, p: 2, borderRadius: 2, border: '1px solid',
                                borderColor: isDayClashing ? 'error.light' : (!!schedule[day] ? 'primary.light' : 'divider'),
                                bgcolor: isDayClashing ? 'error.50' : (!!schedule[day] ? 'primary.50' : 'transparent'),
                                transition: 'all 0.2s'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: !!schedule[day] ? 2 : 0, justifyContent: 'space-between' }}>
                                    <FormControlLabel
                                        label={<Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDayClashing ? 'error.main' : 'inherit' }}>{day}</Typography>}
                                        control={<Checkbox checked={!!schedule[day]} onChange={() => toggleDay(day)} color="primary" />}
                                        sx={{ mr: 0 }}
                                    />
                                    {isDayClashing && (
                                        <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <WarningIcon fontSize="inherit" /> Scheduling Conflict
                                        </Typography>
                                    )}
                                    {schedule[day] && (
                                        <Button size="small" variant="text" onClick={() => copyToAll(day)} sx={{ fontSize: '0.65rem', fontWeight: 700, ml: 'auto' }}>
                                            Apply to all days
                                        </Button>
                                    )}
                                </Box>

                                {schedule[day] && (
                                    <Box sx={{ 
                                        pl: 4, mt: 0.5, p: 1.5, borderRadius: 2, 
                                        bgcolor: 'rgba(255,255,255,0.7)', border: '1px solid', borderColor: 'divider'
                                    }}>
                                        {schedule[day].map((slot, idx) => {
                                            const errKey = `${day}-${idx}`;
                                            const slotErr = slotErrors[errKey];
                                            const isClashing = schedule[day].some((other, j) => idx !== j && checkOverlap(slot, other));
                                            
                                            return (
                                                <Grid container spacing={1} key={idx} sx={{ 
                                                    alignItems: 'center', p: 1, 
                                                    borderRadius: 1.5, bgcolor: 'white', border: '1px solid',
                                                    borderColor: (slotErr || isClashing) ? 'error.light' : 'divider',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    mb: 1
                                                }}>
                                                    <Grid item xs={5.5}>
                                                        <TextField 
                                                            type="time" 
                                                            size="small" 
                                                            fullWidth
                                                            value={slot.start_time} 
                                                            onChange={(e) => updateSlot(day, idx, 'start_time', e.target.value)} 
                                                            InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} 
                                                            label="Start" 
                                                            error={!!slotErr || isClashing}
                                                            sx={{ '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' } }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={5.5}>
                                                        <TextField 
                                                            type="time" 
                                                            size="small" 
                                                            fullWidth
                                                            value={slot.end_time} 
                                                            onChange={(e) => updateSlot(day, idx, 'end_time', e.target.value)} 
                                                            InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} 
                                                            label="End" 
                                                            error={!!slotErr || isClashing}
                                                            sx={{ '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem' } }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <IconButton 
                                                            size="small" 
                                                            color="error" 
                                                            onClick={() => removeSlot(day, idx)} 
                                                            disabled={schedule[day].length === 1}
                                                            sx={{ width: 36, height: 36 }}
                                                        >
                                                            <DeleteIcon fontSize="inherit" sx={{ fontSize: '1.2rem' }} />
                                                        </IconButton>
                                                    </Grid>
                                                    {slotErr && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="caption" color="error" sx={{ fontWeight: 600, ml: 1 }}>{slotErr}</Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            );
                                        })}
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addSlot(day)} sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Add slot</Button>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </FormDrawer>
        </PageTransition>
    );
};

export default Availability;
