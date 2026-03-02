import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Chip, Grid, MenuItem, Select, FormControl, InputLabel, Box, Typography, Divider,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Link as LinkIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { useStaffServices, useStaff, useServices } from '../store';

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>{label}</Typography>
        {children}
    </Box>
);

const StaffServices = () => {
    const [staffServices, setStaffServices] = useStaffServices();
    const [staff] = useStaff();
    const [services] = useServices();
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: { staff_id: '', service_id: '' },
    });

    const handleOpen = (ss = null) => {
        setEditId(ss?.id || null);
        reset(ss ? { staff_id: ss.staff_id || '', service_id: ss.service_id || '' }
            : { staff_id: '', service_id: '' });
        setOpen(true);
    };

    const onSubmit = (data) => {
        const now = new Date().toISOString();
        if (editId) {
            setStaffServices(staffServices.map(ss => ss.id === editId ? { ...ss, ...data, updated_at: now } : ss));
        } else {
            // Avoid duplicates
            const exists = staffServices.find(ss => ss.staff_id === data.staff_id && ss.service_id === data.service_id);
            if (exists) return;
            setStaffServices([...staffServices, { ...data, id: Date.now().toString(), created_at: now, updated_at: now }]);
        }
        setOpen(false);
    };

    return (
        <PageTransition>
            <PageHeader title="Staff Services" subtitle="Manage which staff members can perform which services." onAddClick={() => handleOpen()} buttonText="Assign Service" />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Staff Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staffServices.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                <LinkIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />No staff-service assignments yet.
                            </TableCell></TableRow>
                        )}
                        {staffServices.map(ss => {
                            const staffMember = staff.find(s => s.id === ss.staff_id);
                            const service = services.find(s => s.id === ss.service_id);
                            return (
                                <TableRow key={ss.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{staffMember?.staff_name || '—'}</TableCell>
                                    <TableCell>{service?.service_name || '—'}</TableCell>
                                    <TableCell>{ss.created_at ? new Date(ss.created_at).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(ss)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => setStaffServices(staffServices.filter(x => x.id !== ss.id))} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <FormDrawer open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Assignment' : 'Assign Service to Staff'} subtitle="Link a staff member to a service they can perform." onSave={handleSubmit(onSubmit)} saveLabel={editId ? 'Update' : 'Assign'}>
                <FieldSection label="Staff & Service">
                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Controller name="staff_id" control={control} rules={{ required: true }}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Staff Member *</InputLabel>
                                        <Select {...field} label="Staff Member *">
                                            {staff.map(s => <MenuItem key={s.id} value={s.id}>{s.staff_name} — {s.role}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="service_id" control={control} rules={{ required: true }}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Service *</InputLabel>
                                        <Select {...field} label="Service *">
                                            {services.map(s => <MenuItem key={s.id} value={s.id}>{s.service_name} ({s.duration_minutes} min)</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )} />
                        </Grid>
                    </Grid>
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />
                <FieldSection label="Status">
                    <Controller name="status" control={control}
                        render={({ field }) => (
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select {...field} label="Status">
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        )} />
                </FieldSection>
            </FormDrawer>
        </PageTransition>
    );
};

export default StaffServices;
