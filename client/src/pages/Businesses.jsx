import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Chip, TextField, Grid, MenuItem, Select,
    FormControl, InputLabel, Switch, FormControlLabel, Box, Typography, Divider,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { useBusinesses } from '../store';

const STATUS_OPTIONS = ['Active', 'Inactive'];

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const Businesses = () => {
    const [businesses, setBusinesses] = useBusinesses();
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { business_name: '', business_type: '', email: '', phone: '', upi_id: '' },
    });

    const handleOpen = (biz = null) => {
        setEditId(biz?.id || null);
        reset(biz ? {
            business_name: biz.business_name || '',
            business_type: biz.business_type || '',
            email: biz.email || '',
            phone: biz.phone || '',
            upi_id: biz.upi_id || '',
        } : { business_name: '', business_type: '', email: '', phone: '', upi_id: '' });
        setOpen(true);
    };

    const onSubmit = (data) => {
        if (editId) {
            setBusinesses(businesses.map(b => b.id === editId ? { ...b, ...data, updated_at: new Date().toISOString() } : b));
        } else {
            setBusinesses([...businesses, { ...data, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
        }
        setOpen(false);
    };

    const handleDelete = (id) => setBusinesses(businesses.filter(b => b.id !== id));

    return (
        <PageTransition>
            <PageHeader
                title="Businesses"
                subtitle="Manage your business profiles and settings."
                onAddClick={() => handleOpen()}
                buttonText="Add Business"
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Business Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>UPI ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {businesses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    <BusinessIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                                    No businesses added yet. Click "Add Business" to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {businesses.map((biz) => (
                            <TableRow key={biz.id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{biz.business_name}</TableCell>
                                <TableCell>{biz.business_type}</TableCell>
                                <TableCell>{biz.phone}</TableCell>
                                <TableCell>{biz.email}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{biz.upi_id || '—'}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(biz)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                    <IconButton onClick={() => handleDelete(biz.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <FormDrawer
                open={open}
                onClose={() => setOpen(false)}
                title={editId ? 'Edit Business' : 'Add New Business'}
                subtitle="Fill in the details below to configure your business profile."
                onSave={handleSubmit(onSubmit)}
                saveLabel={editId ? 'Update Business' : 'Create Business'}
            >
                <FieldSection label="Business Identity">
                    <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                            <Controller name="business_name" control={control} rules={{ required: 'Business name is required' }}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Business Name *" error={!!errors.business_name}
                                        helperText={errors.business_name?.message} placeholder="e.g. Shiv Clinic" />
                                )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="business_type" control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Business Type" placeholder="e.g. Clinic, Salon, Gym, Spa" />
                                )} />
                        </Grid>
                    </Grid>
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />
                <FieldSection label="Contact Information">
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="email" control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Email Address" type="email" placeholder="business@example.com" />
                                )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="phone" control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Phone" placeholder="+91 98765 43210" />
                                )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="upi_id" control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="UPI ID" placeholder="businessname@upi" />
                                )} />
                        </Grid>
                    </Grid>
                </FieldSection>

            </FormDrawer>
        </PageTransition>
    );
};

export default Businesses;
