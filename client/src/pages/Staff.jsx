import React, { useState } from 'react';
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
import { useStaff, useBusinesses, useLocations, useAvailability } from '../store';

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
    const [staffList, setStaffList] = useStaff();
    const [businesses] = useBusinesses();
    const [locations] = useLocations();
    const [availability, setAvailability] = useAvailability();
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // availability schedule: { [day]: [{ start_time, end_time }] | null }
    const [schedule, setSchedule] = useState({});

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
                if (!sched[a.day_of_week]) sched[a.day_of_week] = [];
                sched[a.day_of_week].push({ start_time: a.start_time, end_time: a.end_time });
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
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].map((slot, i) => i === idx ? { ...slot, [field]: value } : slot),
        }));
    };

    const onSubmit = (data) => {
        const now = new Date().toISOString();
        let staffId;

        if (editId) {
            staffId = editId;
            setStaffList(staffList.map(s => s.id === editId ? { ...s, ...data, updated_at: now } : s));
            // Remove old availability records for this staff
            const withoutOld = availability.filter(a => a.staff_id !== editId);
            const newRecords = buildAvailabilityRecords(staffId, now);
            setAvailability([...withoutOld, ...newRecords]);
        } else {
            staffId = Date.now().toString();
            setStaffList([...staffList, { ...data, id: staffId, created_at: now, updated_at: now }]);
            const newRecords = buildAvailabilityRecords(staffId, now);
            setAvailability([...availability, ...newRecords]);
        }
        setOpen(false);
    };

    const buildAvailabilityRecords = (staffId, now) => {
        const records = [];
        Object.entries(schedule).forEach(([day, slots]) => {
            slots.forEach(slot => {
                records.push({
                    id: `${staffId}-${day}-${Date.now()}-${Math.random()}`,
                    staff_id: staffId,
                    day_of_week: day,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    created_at: now,
                    updated_at: now,
                });
            });
        });
        return records;
    };

    const handleDelete = (id) => {
        setStaffList(staffList.filter(s => s.id !== id));
        setAvailability(availability.filter(a => a.staff_id !== id));
    };

    return (
        <PageTransition>
            <PageHeader title="Staff Members" subtitle="Manage your team and their weekly availability." onAddClick={() => handleOpen()} buttonText="Add Staff" />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
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
                        {staffList.length === 0 && (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                                No staff added yet. Click "Add Staff" to get started.
                            </TableCell></TableRow>
                        )}
                        {staffList.map(s => {
                            const biz = businesses.find(b => b.id === s.business_id);
                            const loc = locations.find(l => l.id === s.location_id);
                            const workingDays = [...new Set(availability.filter(a => a.staff_id === s.id).map(a => a.day_of_week.slice(0, 3)))];
                            return (
                                <TableRow key={s.id} hover>
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
                    <Controller name="staff_name" control={control} rules={{ required: 'Name is required' }}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label="Staff Name *" error={!!errors.staff_name} helperText={errors.staff_name?.message} sx={{ mb: 2.5 }} placeholder="e.g. Dr. Agarwal" />
                        )} />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Controller name="role" control={control}
                                render={({ field }) => <TextField {...field} fullWidth label="Role" placeholder="e.g. Doctor" />} />
                        </Grid>
                        <Grid item xs={6}>
                            <Controller name="phone" control={control}
                                render={({ field }) => <TextField {...field} fullWidth label="Phone" placeholder="+91 98765 43210" />} />
                        </Grid>
                    </Grid>
                </FieldSection>

                <Divider sx={{ my: 2.5 }} />

                {/* --- Availability Schedule --- */}
                <FieldSection label="Weekly Availability">
                    <Typography variant="caption" color="text.secondary" mb={2} display="block">
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
                                label={<Typography variant="body2" fontWeight={600}>{day}</Typography>}
                            />

                            {schedule[day] && (
                                <Box sx={{ pl: 4, mt: 0.5 }}>
                                    {schedule[day].map((slot, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <TextField
                                                type="time"
                                                size="small"
                                                value={slot.start_time}
                                                onChange={(e) => updateSlot(day, idx, 'start_time', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                label="Start"
                                                sx={{ width: 130 }}
                                            />
                                            <Typography variant="caption" color="text.disabled">to</Typography>
                                            <TextField
                                                type="time"
                                                size="small"
                                                value={slot.end_time}
                                                onChange={(e) => updateSlot(day, idx, 'end_time', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                label="End"
                                                sx={{ width: 130 }}
                                            />
                                            <IconButton size="small" color="error" onClick={() => removeSlot(day, idx)}
                                                disabled={schedule[day].length === 1}>
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
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
