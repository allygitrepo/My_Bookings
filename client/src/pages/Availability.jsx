import React, { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Button,
    IconButton,
    Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useStaffAvailability, useStaff } from '../store';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

const Availability = () => {
    const [globalAvailability, setGlobalAvailability] = useStaffAvailability();
    const [staffList] = useStaff();
    const [selectedStaff, setSelectedStaff] = useState('');

    // Local state for the currently selected staff member's schedule
    const [schedule, setSchedule] = useState({});

    const handleStaffChange = (e) => {
        const staffId = e.target.value;
        setSelectedStaff(staffId);

        // Load existing schedule or default to empty days
        if (globalAvailability[staffId]) {
            setSchedule(globalAvailability[staffId]);
        } else {
            const defaultSchedule = {};
            DAYS_OF_WEEK.forEach((day) => {
                defaultSchedule[day] = [{ startTime: '09:00', endTime: '17:00' }];
            });
            setSchedule(defaultSchedule);
        }
    };

    const handleAddTimeRange = (day) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: [...(prev[day] || []), { startTime: '09:00', endTime: '17:00' }],
        }));
    };

    const handleRemoveTimeRange = (day, index) => {
        setSchedule((prev) => {
            const newDaySchedule = [...prev[day]];
            newDaySchedule.splice(index, 1);
            return { ...prev, [day]: newDaySchedule };
        });
    };

    const handleTimeChange = (day, index, field, value) => {
        setSchedule((prev) => {
            const newDaySchedule = [...prev[day]];
            newDaySchedule[index][field] = value;
            return { ...prev, [day]: newDaySchedule };
        });
    };

    const handleSave = () => {
        if (!selectedStaff) return;
        setGlobalAvailability({
            ...globalAvailability,
            [selectedStaff]: schedule,
        });
        toast.success('Availability saved successfully!');
    };

    return (
        <>
            <PageHeader
                title="Staff Availability"
                subtitle="Manage working hours and shifts for your team."
            />

            <Card sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Select Staff Member
                        </Typography>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Staff Member</InputLabel>
                            <Select
                                value={selectedStaff}
                                label="Staff Member"
                                onChange={handleStaffChange}
                            >
                                {staffList.length === 0 && <MenuItem value=""><em>No Staff Found</em></MenuItem>}
                                {staffList.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {!selectedStaff ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    minHeight: 200,
                                    bgcolor: 'background.default',
                                    borderRadius: 2,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography color="text.secondary">
                                    Please select a staff member to view and edit their availability.
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6">Weekly Schedule</Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                {DAYS_OF_WEEK.map((day) => (
                                    <Box key={day} sx={{ mb: 4 }}>
                                        <Grid container alignItems="center" spacing={2}>
                                            <Grid item xs={12} sm={3}>
                                                <Typography sx={{ fontWeight: 600 }}>{day}</Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={9}>
                                                {(schedule[day] || []).map((range, index) => (
                                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                        <input
                                                            type="time"
                                                            value={range.startTime}
                                                            onChange={(e) => handleTimeChange(day, index, 'startTime', e.target.value)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #c4c4c4',
                                                                outline: 'none',
                                                                fontFamily: 'inherit',
                                                            }}
                                                        />
                                                        <Typography color="text.secondary">to</Typography>
                                                        <input
                                                            type="time"
                                                            value={range.endTime}
                                                            onChange={(e) => handleTimeChange(day, index, 'endTime', e.target.value)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #c4c4c4',
                                                                outline: 'none',
                                                                fontFamily: 'inherit',
                                                            }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveTimeRange(day, index)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddTimeRange(day)}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Add Time
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        {day !== 'Sunday' && <Divider sx={{ mt: 2, borderStyle: 'dashed' }} />}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Card>
        </>
    );
};

export default Availability;
