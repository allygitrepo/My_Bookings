import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Chip, TextField, Grid, MenuItem, Select, FormControl,
    InputLabel, Box, Typography, Divider, InputAdornment, Autocomplete, TablePagination, Button,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Build as ServiceIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getServices, createService, updateService, deleteService } from '../api/service.api';
import { getLocations } from '../api/location.api';
import { getServiceLocations, createServiceLocation, deleteServiceLocation } from '../api/serviceLocation.api';
import { getBusinesses } from '../api/business.api';
import { getStaff } from '../api/staff.api';
import { getStaffServices, createStaffService, deleteStaffService } from '../api/staffService.api';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';
import { validateName, blockEmoji } from '../utils/validators';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';

const FieldSection = ({ label, children }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>{label}</Typography>
        {children}
    </Box>
);

const Services = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId } = useBusiness();
    const [servicesList, setServicesList] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [serviceLocations, setServiceLocations] = useState([]);
    const [staff, setStaff] = useState([]);
    const [staffServices, setStaffServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedBusinessId]);

    const filteredServices = servicesList.filter(svc => {
        const matchesBusiness = selectedBusinessId === 'all' || svc.business_id === selectedBusinessId;
        if (!matchesBusiness) return false;

        return svc.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            svc.price?.toString().includes(searchQuery) ||
            svc.duration_minutes?.toString().includes(searchQuery);
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [svcRes, bizRes, locRes, slRes, staffRes, ssRes] = await Promise.all([
                getServices(), getBusinesses(), getLocations(), getServiceLocations(), getStaff(), getStaffServices()
            ]);
            if (svcRes.success) setServicesList(svcRes.data);
            if (bizRes.success) setBusinesses(bizRes.data);
            if (locRes.success) setLocations(locRes.data);
            if (slRes.success) setServiceLocations(slRes.data);
            if (staffRes.success) setStaff(staffRes.data);
            if (ssRes.success) setStaffServices(ssRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: { business_id: '', service_name: '', duration_minutes: '', price: '', minimum_booking_charge: '', assignedStaff: [], assignedLocations: [] },
    });

    const handleOpen = (svc = null) => {
        setEditId(svc?.id || null);
        if (svc) {
            const assignedS = staffServices.filter(ss => ss.service_id === svc.id).map(ss => ss.staff_id);
            const assignedL = serviceLocations.filter(sl => sl.service_id === svc.id).map(sl => sl.location_id);
            reset({
                business_id: svc.business_id || '',
                service_name: svc.service_name || '',
                duration_minutes: svc.duration_minutes || '',
                price: svc.price || '',
                minimum_booking_charge: svc.minimum_booking_charge || '',
                assignedStaff: assignedS,
                assignedLocations: assignedL
            });
        } else {
            const bizId = selectedBusinessId !== 'all' ? selectedBusinessId : (businesses[0]?.id || '');
            const bizLocs = locations.filter(l => !bizId || l.business_id === bizId);
            reset({ 
                business_id: bizId, 
                service_name: '', 
                duration_minutes: '', 
                price: '', 
                minimum_booking_charge: '', 
                assignedStaff: [], 
                assignedLocations: bizLocs.map(l => l.id) 
            }); 
        }
        setOpen(true);
    };

    const onSubmit = async (data) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const { assignedStaff, assignedLocations, ...svcData } = data;
        setOpen(false);
        showGlobalLoader(editId ? 'Updating service...' : 'Creating service...');

        try {
            let targetId;
            if (editId) {
                targetId = editId;
                const response = await updateService(editId, svcData);
                if (response.success) {
                    await Promise.all([
                        updateStaffAssignments(targetId, assignedStaff),
                        updateLocationAssignments(targetId, assignedLocations)
                    ]);
                    toast.success('Service updated successfully');
                    fetchData();
                }
            } else {
                const response = await createService(svcData);
                if (response.success) {
                    targetId = response.data.id;
                    await Promise.all([
                        updateStaffAssignments(targetId, assignedStaff),
                        updateLocationAssignments(targetId, assignedLocations)
                    ]);
                    toast.success('Service created successfully');
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

    const updateStaffAssignments = async (serviceId, assignedStaffIds) => {
        const currentAssigned = staffServices.filter(ss => ss.service_id === serviceId);
        const currentIds = currentAssigned.map(ss => ss.staff_id);
        const toRemove = currentAssigned.filter(ss => !assignedStaffIds.includes(ss.staff_id));
        const toAdd = assignedStaffIds.filter(id => !currentIds.includes(id));
        await Promise.all([
            ...toRemove.map(ss => deleteStaffService(ss.id)),
            ...toAdd.map(staffId => createStaffService({ staff_id: staffId, service_id: serviceId }))
        ]);
    };

    const updateLocationAssignments = async (serviceId, assignedLocationIds) => {
        const currentAssigned = serviceLocations.filter(sl => sl.service_id === serviceId);
        const currentIds = currentAssigned.map(sl => sl.location_id);
        const toRemove = currentAssigned.filter(sl => !assignedLocationIds.includes(sl.location_id));
        const toAdd = assignedLocationIds.filter(id => !currentIds.includes(id));
        await Promise.all([
            ...toRemove.map(sl => deleteServiceLocation(sl.id)),
            ...toAdd.map(locId => createServiceLocation({ service_id: serviceId, location_id: locId }))
        ]);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                // Delete associated staff assignments
                const associatedSS = staffServices.filter(ss => ss.service_id === id);
                await Promise.all(associatedSS.map(ss => deleteStaffService(ss.id)));

                const response = await deleteService(id);
                if (response.success) {
                    toast.success('Service deleted successfully');
                    fetchData();
                }
            } catch (error) {
                toast.error('Failed to delete service');
            }
        }
    };

    return (
        <PageTransition>
            <PageHeader title="Services" subtitle="Define the services you offer and assign staff." onAddClick={() => handleOpen()} buttonText="Add Service" />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Duration (min)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Min. Charge</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Locations</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assigned Staff</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Loading services...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredServices.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                {searchQuery ? 'No services match your search.' : (
                                    <>
                                        <ServiceIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />No services added yet.
                                    </>
                                )}
                            </TableCell></TableRow>
                        ) : null}
                        {filteredServices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((svc, index) => {
                            const assignedIds = staffServices.filter(ss => ss.service_id === svc.id).map(ss => ss.staff_id);
                            const assignedNames = staff.filter(s => assignedIds.includes(s.id)).map(s => s.staff_name);
                            const locIds = serviceLocations.filter(sl => sl.service_id === svc.id).map(sl => sl.location_id);
                            const locNames = locations.filter(l => locIds.includes(l.id)).map(l => l.location_name);
                            return (
                                <TableRow key={svc.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{svc.service_name}</TableCell>
                                    <TableCell>{svc.duration_minutes} min</TableCell>
                                    <TableCell>₹{svc.price}</TableCell>
                                    <TableCell>₹{svc.minimum_booking_charge}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {locNames.length > 0 ? (
                                                locNames.length === locations.length ? <Chip label="All Locations" size="small" color="success" variant="outlined" /> :
                                                    locNames.map(n => <Chip key={n} label={n} size="small" variant="outlined" />)
                                            ) : <Typography variant="caption" color="text.disabled">None</Typography>}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {assignedNames.length > 0 ? assignedNames.map(n => <Chip key={n} label={n} size="small" variant="outlined" />) : <Typography variant="caption" color="text.disabled">None</Typography>}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(svc)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleDelete(svc.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
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
                count={filteredServices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
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
                title={editId ? 'Edit Service' : 'Add New Service'} 
                subtitle="Define a service offering for your business." 
                onSave={handleSubmit(onSubmit)} 
                isLoading={isSubmitting}
                saveLabel={editId ? (isSubmitting ? 'Updating...' : 'Update Service') : (isSubmitting ? 'Creating...' : 'Create Service')}
            >
                <FieldSection label="Assignment">
                    <Controller name="business_id" control={control} rules={{ required: true }}
                        render={({ field }) => (
                            <FormControl fullWidth>
                                <InputLabel>Business *</InputLabel>
                                <Select {...field} label="Business *">
                                    {businesses.map(b => <MenuItem key={b.id} value={b.id}>{b.business_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )} />
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />
                <FieldSection label="Availability Locations">
                    <Controller name="assignedLocations" control={control}
                        render={({ field }) => {
                            const selectedIds = field.value || [];
                            const isAllSelected = selectedIds.length > 0 && selectedIds.length === locations.length;
                            return (
                                <Box>
                                    <Autocomplete
                                        multiple
                                        options={locations}
                                        getOptionLabel={(o) => o.location_name}
                                        isOptionEqualToValue={(o, v) => o.id === v.id}
                                        value={locations.filter(l => selectedIds.includes(l.id))}
                                        onChange={(_, newVal) => field.onChange(newVal.map(l => l.id))}
                                        filterSelectedOptions
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return (
                                                    <Chip key={key} label={option.location_name} size="small" color="secondary" variant="outlined" {...tagProps} />
                                                );
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Locations *"
                                                placeholder={selectedIds.length === 0 ? 'Search and select locations...' : ''}
                                            />
                                        )}
                                    />
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <Button size="small" variant="text" onClick={() => field.onChange(locations.map(l => l.id))} disabled={isAllSelected}>Select All</Button>
                                        <Button size="small" variant="text" color="error" onClick={() => field.onChange([])} disabled={selectedIds.length === 0}>Clear All</Button>
                                    </Box>
                                </Box>
                            );
                        }} />
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />

                <FieldSection label="Service Details">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="service_name" control={control} 
                            rules={{ 
                                validate: {
                                    required: v => v?.trim() ? true : 'Service name is required',
                                    format: v => validateName(v),
                                    emoji: v => blockEmoji(v)
                                }
                            }}
                            render={({ field }) => (
                                <TextField {...field} fullWidth label="Service Name *" error={!!errors.service_name} helperText={errors.service_name?.message} placeholder="e.g. Full Body Checkup" />
                            )} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Controller name="duration_minutes" control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="Duration (minutes)" type="number" placeholder="30" InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} />
                                    )} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Controller name="price" control={control} rules={{ required: 'Price is required', min: { value: 1, message: 'Price must be > 0' } }}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="Price *" type="number" placeholder="500" error={!!errors.price} helperText={errors.price?.message} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                                    )} />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller name="minimum_booking_charge" control={control}
                                    rules={{
                                        validate: v => {
                                            const price = parseFloat(watch('price'));
                                            const charge = parseFloat(v);
                                            if (!v || isNaN(charge)) return true;
                                            if (charge >= price) return 'Booking charge must be less than price';
                                            return true;
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth label="Min. Booking Charge" type="number" placeholder="100" error={!!errors.minimum_booking_charge} helperText={errors.minimum_booking_charge?.message} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                                    )} />
                            </Grid>
                        </Grid>
                    </Box>
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />
                <FieldSection label="Assign Staff">
                    <Controller name="assignedStaff" control={control}
                        render={({ field }) => {
                            const selectedIds = field.value || [];
                            const selectedStaff = staff.filter(s => selectedIds.includes(s.id));
                            const availableOptions = staff.filter(s => !selectedIds.includes(s.id));
                            return (
                                <Autocomplete
                                    multiple
                                    options={availableOptions}
                                    getOptionLabel={(o) => `${o.staff_name}${o.role ? ` — ${o.role}` : ''}`}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={selectedStaff}
                                    onChange={(_, newVal) => field.onChange(newVal.map(s => s.id))}
                                    filterSelectedOptions
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const { key, ...tagProps } = getTagProps({ index });
                                            return (
                                                <Chip key={key} label={option.staff_name} size="small" color="primary" variant="outlined" {...tagProps} />
                                            );
                                        })
                                    }
                                    renderInput={(params) => <TextField {...params} label="Assign Staff" placeholder={selectedIds.length === 0 ? 'Search and select staff...' : ''} />}
                                />
                            );
                        }} />
                </FieldSection>
                <Divider sx={{ my: 2.5 }} />

            </FormDrawer>
        </PageTransition>
    );
};

export default Services;
