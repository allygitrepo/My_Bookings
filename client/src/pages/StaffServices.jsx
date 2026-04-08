import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Chip, Grid, MenuItem, Select, FormControl, InputLabel, Box, Typography, Divider, TablePagination,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Link as LinkIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getStaffServices, createStaffService, updateStaffService, deleteStaffService } from '../api/staffService.api';
import { getStaff } from '../api/staff.api';
import { getServices } from '../api/service.api';
import toast from 'react-hot-toast';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>{label}</Typography>
        {children}
    </Box>
);

const StaffServices = () => {
    const [staffServices, setStaffServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ssRes, staffRes, svcRes] = await Promise.all([
                getStaffServices(), getStaff(), getServices()
            ]);
            if (ssRes.success) setStaffServices(ssRes.data);
            if (staffRes.success) setStaff(staffRes.data);
            if (svcRes.success) setServices(svcRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: { staff_id: '', service_id: '' },
    });

    const handleOpen = (ss = null) => {
        setEditId(ss?.id || null);
        reset(ss ? { staff_id: ss.staff_id || '', service_id: ss.service_id || '' }
            : { staff_id: '', service_id: '' });
        setOpen(true);
    };

    const onSubmit = async (data) => {
        if (isSubmitting) return;

        // Avoid duplicates client-side
        const exists = staffServices.find(ss => ss.staff_id === data.staff_id && ss.service_id === data.service_id);
        if (exists) {
            toast.error('This assignment already exists');
            return;
        }

        setIsSubmitting(true);
        setOpen(false);
        showGlobalLoader(editId ? 'Updating assignment...' : 'Assigning service...');

        try {
            if (editId) {
                const response = await updateStaffService(editId, data);
                if (response.success) {
                    toast.success('Assignment updated');
                    fetchData();
                }
            } else {
                const response = await createStaffService(data);
                if (response.success) {
                    toast.success('Service assigned to staff');
                    fetchData();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
            hideGlobalLoader();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this assignment?')) {
            try {
                const response = await deleteStaffService(id);
                if (response.success) {
                    toast.success('Assignment removed');
                    fetchData();
                }
            } catch (error) {
                toast.error('Failed to remove assignment');
            }
        }
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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Loading assignments...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : staffServices.length === 0 ? (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                <LinkIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />No staff-service assignments yet.
                            </TableCell></TableRow>
                        ) : staffServices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(ss => {
                            const staffMember = staff.find(s => s.id === ss.staff_id);
                            const service = services.find(s => s.id === ss.service_id);
                            return (
                                <TableRow key={ss.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{staffMember?.staff_name || '—'}</TableCell>
                                    <TableCell>{service?.service_name || '—'}</TableCell>
                                    <TableCell>{ss.created_at ? new Date(ss.created_at).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(ss)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDelete(ss.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
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
                count={staffServices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
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
                title={editId ? 'Edit Assignment' : 'Assign Service to Staff'} 
                subtitle="Link a staff member to a service they can perform." 
                onSave={handleSubmit(onSubmit)} 
                isLoading={isSubmitting}
                saveLabel={editId ? (isSubmitting ? 'Updating...' : 'Update') : (isSubmitting ? 'Assigning...' : 'Assign')}
            >
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
            </FormDrawer>
        </PageTransition>
    );
};

export default StaffServices;
