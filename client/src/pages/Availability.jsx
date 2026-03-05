import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Box, Typography, Avatar, Chip, IconButton, Button, Divider,
    TextField, FormControlLabel, Checkbox,
} from '@mui/material';
import { Schedule as ScheduleIcon, Edit as EditIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getStaffAvailability, createStaffAvailability, updateStaffAvailability, deleteStaffAvailability } from '../api/staffAvailability.api';
import { getStaff } from '../api/staff.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

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

        // Validate end_time > start_time
        setSlotErrors(prev => {
            const key = `${day}-${idx}`;
            const slot = schedule[day]?.[idx] || {};
            const start = field === 'start_time' ? value : slot.start_time;
            const end = field === 'end_time' ? value : slot.end_time;
            if (start && end && end <= start) {
                return { ...prev, [key]: 'End time must be after start time' };
            }
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

    const handleSave = async () => {
        // Validate all time slots before saving
        const errors = {};
        Object.entries(schedule).forEach(([day, slots]) => {
            slots.forEach((slot, idx) => {
                if (slot.end_time <= slot.start_time) {
                    errors[`${day}-${idx}`] = 'End time must be after start time';
                }
            });
        });
        if (Object.keys(errors).length > 0) {
            setSlotErrors(errors);
            toast.error('Please fix time errors before saving');
            return;
        }
        setSaving(true);
        try {
            // Remove all existing for this staff and re-create (simplest sync logic)
            const existingAvails = availability.filter(a => a.staff_id === selectedStaff.id);
            await Promise.all(existingAvails.map(a => deleteStaffAvailability(a.id)));

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
            await Promise.all(records.map(r => createStaffAvailability(r)));
            toast.success('Availability updated successfully');
            setOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to update availability');
        } finally {
            setSaving(false);
        }
    };

    // Removal of old filter logic as it integrated into filteredAvailability

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
                        ) : sorted.map((a, idx) => {
                            const staffMember = staffList.find(s => s.id === a.staff_id);
                            const [sh, sm] = (a.start_time || '00:00').split(':').map(Number);
                            const [eh, em] = (a.end_time || '00:00').split(':').map(Number);
                            const durationMin = (eh * 60 + em) - (sh * 60 + sm);
                            const durationLabel = durationMin > 0 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : '—';
                            return (
                                <TableRow key={a.id || idx} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{idx + 1}</TableCell>
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

            <FormDrawer
                open={open}
                onClose={() => setOpen(false)}
                title={`Edit Availability`}
                subtitle={`Set working hours for ${selectedStaff?.staff_name}`}
                onSave={handleSave}
                isLoading={saving}
                saveLabel="Update Availability"
            >
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                        Weekly Schedule
                    </Typography>
                    {DAYS.map(day => (
                        <Box key={day} sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={<Checkbox checked={!!schedule[day]} onChange={() => toggleDay(day)} size="small" />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>{day}</Typography>
                                        {schedule[day] && (
                                            <Button size="small" variant="text" onClick={() => copyToAll(day)} sx={{ fontSize: '0.65rem', py: 0 }}>Apply to all days</Button>
                                        )}
                                    </Box>
                                }
                                sx={{ width: '100%', mr: 0 }}
                            />
                            {schedule[day] && (
                                <Box sx={{ pl: 4, mt: 0.5 }}>
                                    {schedule[day].map((slot, idx) => {
                                        const errKey = `${day}-${idx}`;
                                        const slotErr = slotErrors[errKey];
                                        return (
                                            <Box key={idx} sx={{ mb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TextField type="time" size="small" value={slot.start_time} onChange={(e) => updateSlot(day, idx, 'start_time', e.target.value)} InputLabelProps={{ shrink: true }} label="Start" sx={{ width: 130 }} error={!!slotErr} />
                                                    <Typography variant="caption" color="text.disabled">to</Typography>
                                                    <TextField type="time" size="small" value={slot.end_time} onChange={(e) => updateSlot(day, idx, 'end_time', e.target.value)} InputLabelProps={{ shrink: true }} label="End" sx={{ width: 130 }} error={!!slotErr} />
                                                    <IconButton size="small" color="error" onClick={() => removeSlot(day, idx)} disabled={schedule[day].length === 1}><RemoveIcon fontSize="small" /></IconButton>
                                                </Box>
                                                {slotErr && <Typography variant="caption" color="error" sx={{ pl: 0.5 }}>{slotErr}</Typography>}
                                            </Box>
                                        );
                                    })}
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => addSlot(day)} sx={{ fontSize: '0.75rem' }}>Add slot</Button>
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            </FormDrawer>
        </PageTransition>
    );
};

export default Availability;
