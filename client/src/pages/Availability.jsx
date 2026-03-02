import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Box, Typography, Avatar, Chip,
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { useAvailability, useStaff } from '../store';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayColors = {
    Monday: 'primary', Tuesday: 'secondary', Wednesday: 'info',
    Thursday: 'warning', Friday: 'success', Saturday: 'error', Sunday: 'default',
};

const Availability = () => {
    const [availability] = useAvailability();
    const [staffList] = useStaff();
    const [filterStaff, setFilterStaff] = useState('all');

    const filtered = filterStaff === 'all' ? availability : availability.filter(a => a.staff_id === filterStaff);

    // Sort by staff name, then day order
    const sorted = [...filtered].sort((a, b) => {
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
                            <TableCell sx={{ fontWeight: 600 }}>Staff Member</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Day of Week</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sorted.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <ScheduleIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">No availability records yet.</Typography>
                                <Typography variant="caption" color="text.disabled">Add availability when creating or editing staff members.</Typography>
                            </TableCell></TableRow>
                        )}
                        {sorted.map((a, idx) => {
                            const staffMember = staffList.find(s => s.id === a.staff_id);
                            const [sh, sm] = (a.start_time || '00:00').split(':').map(Number);
                            const [eh, em] = (a.end_time || '00:00').split(':').map(Number);
                            const durationMin = (eh * 60 + em) - (sh * 60 + sm);
                            const durationLabel = durationMin > 0 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : '—';
                            return (
                                <TableRow key={a.id || idx} hover>
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
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageTransition>
    );
};

export default Availability;
