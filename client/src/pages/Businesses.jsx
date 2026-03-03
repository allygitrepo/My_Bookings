import React, { useState, useEffect } from 'react';
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
import { getBusinesses, createBusiness, updateBusiness, deleteBusiness } from '../api/business.api';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

const INDUSTRY_OPTIONS = [
    'Healthcare / Hospital',
    'Corporate',
    'Salon / Beauty',
    'Gym / Fitness',
    'Spa / Wellness',
    'Education / Coaching',
    'Professional Services',
    'Other'
];

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const Businesses = () => {
    const { searchQuery } = useSearch();
    const [businesses, setBusinesses] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const filteredBusinesses = businesses.filter(biz =>
        biz.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.business_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.upi_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { business_name: '', business_type: '', email: '', phone: '', upi_id: '' },
    });

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const response = await getBusinesses();
            if (response.success) {
                setBusinesses(response.data);
            }
        } catch (error) {
            toast.error('Failed to fetch businesses');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBusinesses();
    }, []);

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

    const onSubmit = async (data) => {
        try {
            if (editId) {
                const response = await updateBusiness(editId, data);
                if (response.success) {
                    toast.success('Business updated successfully');
                    fetchBusinesses();
                }
            } else {
                // Ensure user_id is included for creation
                const payload = {
                    ...data,
                    user_id: currentUser?.id
                };
                const response = await createBusiness(payload);
                if (response.success) {
                    toast.success('Business created successfully');
                    fetchBusinesses();
                }
            }
            setOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this business?')) {
            try {
                const response = await deleteBusiness(id);
                if (response.success) {
                    toast.success('Business deleted successfully');
                    fetchBusinesses();
                }
            } catch (error) {
                toast.error('Failed to delete business');
            }
        }
    };

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
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Business Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>UPI ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Loading businesses...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredBusinesses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    {searchQuery ? 'No businesses match your search.' : (
                                        <>
                                            <BusinessIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                                            No businesses added yet. Click "Add Business" to get started.
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredBusinesses.map((biz, index) => (
                            <TableRow key={biz.id} hover>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
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
                            <Controller name="business_type" control={control} rules={{ required: 'Business type is required' }}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.business_type} variant="outlined">
                                        <InputLabel id="business-type-label">Business Type *</InputLabel>
                                        <Select
                                            {...field}
                                            labelId="business-type-label"
                                            label="Business Type *"
                                        >
                                            {INDUSTRY_OPTIONS.map(opt => (
                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                            ))}
                                        </Select>
                                        {errors.business_type && (
                                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                                {errors.business_type.message}
                                            </Typography>
                                        )}
                                    </FormControl>
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
