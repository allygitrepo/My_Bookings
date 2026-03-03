import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
    Box, Typography, Divider, Checkbox, FormControlLabel, Button,
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon,
    Add as AddIcon, Remove as RemoveIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../api/staff.api';
import { getBusinesses } from '../api/business.api';
import { getLocations } from '../api/location.api';
import { getStaffAvailability, createStaffAvailability, updateStaffAvailability, deleteStaffAvailability } from '../api/staffAvailability.api';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const Staff = () => {
    const { searchQuery } = useSearch();
    const [staffList, setStaffList] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const filteredStaff = staffList.filter(s =>
        s.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // availability schedule: { [day]: [{ start_time, end_time }] | null }
    const [schedule, setSchedule] = useState({});
    const [slotErrors, setSlotErrors] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, bizRes, locRes, availRes] = await Promise.all([
                getStaff(), getBusinesses(), getLocations(), getStaffAvailability()
            ]);
            if (staffRes.success) setStaffList(staffRes.data);
            if (bizRes.success) setBusinesses(bizRes.data);
            if (locRes.success) setLocations(locRes.data);
            if (availRes.success) setAvailability(availRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { business_id: '', location_id: '', staff_name: '', role: '', phone: '', slot_duration_minutes: '30' },
    });

    const handleOpen = (s = null) => {
        setEditId(s?.id || null);
        reset(s
            ? { business_id: s.business_id || '', location_id: s.location_id || '', staff_name: s.staff_name || '', role: s.role || '', phone: s.phone || '', slot_duration_minutes: s.slot_duration_minutes || '30' }
            : { business_id: businesses[0]?.id || '', location_id: locations[0]?.id || '', staff_name: '', role: '', phone: '', slot_duration_minutes: '30' }
        );

        // Build schedule from existing availability records for this staff
        if (s) {
            const existing = availability.filter(a => a.staff_id === s.id);
            const sched = {};
            existing.forEach(a => {
                const dayMatch = DAYS.find(d => d.toLowerCase() === a.day_of_week.toLowerCase());
                if (dayMatch) {
                    if (!sched[dayMatch]) sched[dayMatch] = [];
                    sched[dayMatch].push({ start_time: a.start_time, end_time: a.end_time });
                }
            });
            setSchedule(sched);
        } else {
            setSchedule({});
        }
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
        Object.keys(newSchedule).forEach(day => {
            newSchedule[day] = slotsToCopy.map(s => ({ ...s }));
        });
        setSchedule(newSchedule);
        toast.success(`Copied ${sourceDay}'s schedule to all active days`);
    };

    const onSubmit = async (data) => {
        try {
            let staffId;
            if (editId) {
                staffId = editId;
                const response = await updateStaff(editId, data);
                if (response.success) {
                    // Update availability
                    // The backend might handle this differently, but following the original logic's pattern:
                    // Remove old records and add new ones (though a real API might have a bulk sync endpoint)
                    const existingAvails = availability.filter(a => a.staff_id === editId);
                    await Promise.all(existingAvails.map(a => deleteStaffAvailability(a.id)));
                    await createNewAvailabilityRecords(staffId);
                    toast.success('Staff member updated successfully');
                    fetchData();
                }
            } else {
                const response = await createStaff(data);
                if (response.success) {
                    staffId = response.data.id;
                    await createNewAvailabilityRecords(staffId);
                    toast.success('Staff member added successfully');
                    fetchData();
                }
            }
            setOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const createNewAvailabilityRecords = async (staffId) => {
        const records = [];
        Object.entries(schedule).forEach(([day, slots]) => {
            slots.forEach(slot => {
                records.push({
                    staff_id: staffId,
                    day_of_week: day.toLowerCase(),
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                });
            });
        });
        await Promise.all(records.map(r => createStaffAvailability(r)));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                // Also delete their availability
                const staffAvails = availability.filter(a => a.staff_id === id);
                await Promise.all(staffAvails.map(a => deleteStaffAvailability(a.id)));
                const response = await deleteStaff(id);
                if (response.success) {
                    toast.success('Staff member deleted successfully');
                    fetchData();
                }
            } catch (error) {
                toast.error('Failed to delete staff member');
            }
        }
    };

    return (
        <PageTransition>
            <PageHeader title="Staff Members" subtitle="Manage your team and their weekly availability." onAddClick={() => handleOpen()} buttonText="Add Staff" />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Staff Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Slot</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Working Days</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Loading staff members...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    {searchQuery ? 'No staff match your search.' : (
                                        <>
                                            <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                                            No staff added yet. Click "Add Staff" to get started.
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : filteredStaff.map((s, index) => {
                            const biz = businesses.find(b => b.id === s.business_id);
                            const loc = locations.find(l => l.id === s.location_id);
                            const workingDays = [...new Set(availability.filter(a => a.staff_id === s.id).map(a => a.day_of_week.slice(0, 3)))];
                            return (
                                <TableRow key={s.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{s.staff_name}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'inline-block', px: 1.5, py: 0.3, borderRadius: 1, bgcolor: 'primary.50', color: 'primary.main', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {s.role || '—'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{biz?.business_name || '—'}</TableCell>
                                    <TableCell>{loc?.location_name || '—'}</TableCell>
                                    <TableCell>{s.phone}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'inline-block', px: 1.5, py: 0.3, borderRadius: 1, bgcolor: 'info.50', color: 'info.dark', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            {s.slot_duration_minutes || 30} min
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {workingDays.length > 0
                                                ? workingDays.map(d => (
                                                    <Box key={d} sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: 'success.50', color: 'success.dark', fontSize: '0.7rem', fontWeight: 700 }}>{d}</Box>
                                                ))
                                                : <Typography variant="caption" color="text.disabled">Not set</Typography>
                                            }
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(s)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDelete(s.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
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
                title={editId ? 'Edit Staff Member' : 'Add Staff Member'}
                subtitle="Set staff details and their weekly availability schedule."
                onSave={handleSubmit(onSubmit)}
                saveLabel={editId ? 'Update Staff' : 'Add Staff'}
            >
                {/* --- Assignment --- */}
                <FieldSection label="Assignment">
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller name="business_id" control={control} rules={{ required: true }}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Business *</InputLabel>
                                        <Select {...field} label="Business *">
                                            {businesses.map(b => <MenuItem key={b.id} value={b.id}>{b.business_name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="location_id" control={control} rules={{ required: true }}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Location *</InputLabel>
                                        <Select {...field} label="Location *">
                                            {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )} />
                        </Grid>
                    </Grid>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                {/* --- Staff Details --- */}
                <FieldSection label="Staff Details">
                    <Controller name="staff_name" control={control}
                        rules={{
                            required: 'Name is required',
                            pattern: { value: /^[A-Za-z .]+$/, message: 'Name must not contain numbers' }
                        }}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label="Staff Name *" error={!!errors.staff_name} helperText={errors.staff_name?.message} sx={{ mb: 2.5 }} placeholder="e.g. Dr. Agarwal"
                                onChange={(e) => {
                                    // Strip digits on input
                                    field.onChange(e.target.value.replace(/[0-9]/g, ''));
                                }}
                            />
                        )} />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Controller name="role" control={control}
                                render={({ field }) => <TextField {...field} fullWidth label="Role" placeholder="e.g. Doctor" />} />
                        </Grid>
                        <Grid item xs={6}>
                            <Controller name="phone" control={control}
                                rules={{
                                    pattern: { value: /^\d{10}$/, message: 'Phone must be exactly 10 digits' }
                                }}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Phone" placeholder="9876543210"
                                        error={!!errors.phone} helperText={errors.phone?.message}
                                        inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    />
                                )} />
                        </Grid>
                    </Grid>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                {/* --- Availability Schedule --- */}
                <FieldSection label="Weekly Availability">
                    <Typography variant="caption" color="text.secondary" mb={1} display="block">
                        Check the days the staff member works and add time slots for each day.
                    </Typography>


                    {DAYS.map(day => (
                        <Box key={day} sx={{ mb: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!schedule[day]}
                                        onChange={() => toggleDay(day)}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>{day}</Typography>
                                        {schedule[day] && (
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => copyToAll(day)}
                                                sx={{ fontSize: '0.65rem', py: 0 }}
                                            >
                                                Apply to all days
                                            </Button>
                                        )}
                                    </Box>
                                }
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
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => addSlot(day)}
                                        sx={{ fontSize: '0.75rem', ml: 0 }}
                                    >
                                        Add slot
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ))}
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />

                {/* --- Slot Duration --- */}
                <FieldSection label="Booking Slot Duration">
                    <Typography variant="caption" color="text.secondary" mb={2} display="block">
                        Time duration of each bookable slot (e.g. 30 min → 9:00–9:30, 9:30–10:00, …)
                    </Typography>
                    <Controller name="slot_duration_minutes" control={control}
                        render={({ field }) => (
                            <FormControl fullWidth>
                                <InputLabel>Slot Duration</InputLabel>
                                <Select {...field} label="Slot Duration">
                                    <MenuItem value="15">15 minutes</MenuItem>
                                    <MenuItem value="20">20 minutes</MenuItem>
                                    <MenuItem value="30">30 minutes</MenuItem>
                                    <MenuItem value="45">45 minutes</MenuItem>
                                    <MenuItem value="60">1 hour</MenuItem>
                                    <MenuItem value="90">1.5 hours</MenuItem>
                                    <MenuItem value="120">2 hours</MenuItem>
                                </Select>
                            </FormControl>
                        )} />
                </FieldSection>
            </FormDrawer>
        </PageTransition>
    );
};

export default Staff;
