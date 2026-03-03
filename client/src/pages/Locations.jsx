import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Chip, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
    Box, Typography, Divider,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/location.api';
import { getBusinesses } from '../api/business.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>{label}</Typography>
        {children}
    </Box>
);

const Locations = () => {
    const { searchQuery } = useSearch();
    const [locations, setLocations] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const filteredLocations = locations.filter(loc => {
        const bizName = businesses.find(b => b.id === loc.business_id)?.business_name || '';
        return loc.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bizName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.state?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locRes, bizRes] = await Promise.all([getLocations(), getBusinesses()]);
            if (locRes.success) setLocations(locRes.data);
            if (bizRes.success) setBusinesses(bizRes.data);
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
        defaultValues: { business_id: '', location_name: '', address: '', city: '', state: '' },
    });

    const handleOpen = (loc = null) => {
        setEditId(loc?.id || null);
        reset(loc ? { business_id: loc.business_id || '', location_name: loc.location_name || '', address: loc.address || '', city: loc.city || '', state: loc.state || '' }
            : { business_id: businesses[0]?.id || '', location_name: '', address: '', city: '', state: '' });
        setOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editId) {
                const response = await updateLocation(editId, data);
                if (response.success) {
                    toast.success('Location updated successfully');
                    fetchData();
                }
            } else {
                const response = await createLocation(data);
                if (response.success) {
                    toast.success('Location created successfully');
                    fetchData();
                }
            }
            setOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            try {
                const response = await deleteLocation(id);
                if (response.success) {
                    toast.success('Location deleted successfully');
                    fetchData();
                }
            } catch (error) {
                toast.error('Failed to delete location');
            }
        }
    };

    return (
        <PageTransition>
            <PageHeader title="Locations" subtitle="Manage business locations and branches." onAddClick={() => handleOpen()} buttonText="Add Location" />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Location Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Loading locations...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredLocations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    {searchQuery ? 'No locations match your search.' : (
                                        <Box sx={{ opacity: 0.5 }}>
                                            <Typography variant="h6">No locations found</Typography>
                                            <Typography variant="body2">Click "Add Location" to create your first one.</Typography>
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : filteredLocations.map((loc, index) => {
                            const biz = businesses.find(b => b.id === loc.business_id);
                            return (
                                <TableRow key={loc.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{loc.location_name}</TableCell>
                                    <TableCell>{biz?.business_name || '—'}</TableCell>
                                    <TableCell>{loc.address}</TableCell>
                                    <TableCell>{loc.city}</TableCell>
                                    <TableCell>{loc.state}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(loc)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDelete(loc.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <FormDrawer open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Location' : 'Add New Location'} subtitle="Define where your business operates." onSave={handleSubmit(onSubmit)} saveLabel={editId ? 'Update Location' : 'Create Location'}>
                <FieldSection label="Assignment">
                    <Controller name="business_id" control={control} rules={{ required: true }}
                        render={({ field }) => (
                            <FormControl fullWidth error={!!errors.business_id}>
                                <InputLabel>Business *</InputLabel>
                                <Select {...field} label="Business *">
                                    {businesses.length === 0 && <MenuItem value=""><em>No Businesses Found</em></MenuItem>}
                                    {businesses.map(b => <MenuItem key={b.id} value={b.id}>{b.business_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )} />
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />
                <FieldSection label="Location Details">
                    <Controller name="location_name" control={control} rules={{ required: 'Location name is required' }}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label="Location Name *" placeholder="e.g. Main Branch, City Center" error={!!errors.location_name} helperText={errors.location_name?.message} sx={{ mb: 2.5 }} />
                        )} />
                    <Controller name="address" control={control}
                        render={({ field }) => (
                            <TextField {...field} fullWidth label="Address" multiline rows={2} placeholder="Enter full street address" sx={{ mb: 2.5 }} />
                        )} />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Controller name="city" control={control}
                                render={({ field }) => <TextField {...field} fullWidth label="City" placeholder="Mumbai" />} />
                        </Grid>
                        <Grid item xs={6}>
                            <Controller name="state" control={control}
                                render={({ field }) => <TextField {...field} fullWidth label="State" placeholder="Maharashtra" />} />
                        </Grid>
                    </Grid>
                </FieldSection>
            </FormDrawer>
        </PageTransition>
    );
};

export default Locations;
