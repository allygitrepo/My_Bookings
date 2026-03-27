import React, { useState, useMemo, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, TextField, Grid, MenuItem, Box, Typography, Divider,
    Autocomplete, Chip, TablePagination,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/location.api';
import { getBusinesses } from '../api/business.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';
import locationService from '../utils/locationService';

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
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedState, setSelectedState] = useState(null); // Will store {name, iso2}
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);
    const [filterState, setFilterState] = useState('All');

    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    const filteredLocations = locations.filter(loc => {
        const bizName = businesses.find(b => b.id === loc.business_id)?.business_name || '';
        const matchesSearch = loc.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bizName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.state?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesState = filterState === 'All' || loc.state === filterState;
        
        return matchesSearch && matchesState;
    });

    const fetchStatesData = async () => {
        try {
            const data = await locationService.getStates();
            setStates(data);
        } catch (error) {
            toast.error('Failed to fetch states');
        }
    };

    const fetchCitiesData = async (stateCode) => {
        try {
            const data = await locationService.getCities(stateCode);
            setCities(data);
        } catch (error) {
            toast.error('Failed to fetch cities');
        }
    };

    useEffect(() => {
        fetchStatesData();
    }, []);

    useEffect(() => {
        if (selectedState?.iso2) {
            fetchCitiesData(selectedState.iso2);
        } else {
            setCities([]);
        }
    }, [selectedState]);

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

    React.useEffect(() => { fetchData(); }, []);

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: { business_id: '', location_name: '', address: '', city: '', state: '' },
    });

    const handleOpen = async (loc = null) => {
        setEditId(loc?.id || null);
        
        if (loc) {
            // Find state object to trigger city fetch
            const stateObj = states.find(s => s.name === loc.state);
            setSelectedState(stateObj || null);
            if (stateObj) {
                await fetchCitiesData(stateObj.iso2);
            }
        } else {
            setSelectedState(null);
            setCities([]);
        }

        reset(loc
            ? { business_id: loc.business_id || '', location_name: loc.location_name || '', address: loc.address || '', city: loc.city || '', state: loc.state || '' }
            : { business_id: businesses[0]?.id || '', location_name: '', address: '', city: '', state: '' }
        );
        setOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editId) {
                const response = await updateLocation(editId, data);
                if (response.success) { toast.success('Location updated successfully'); fetchData(); }
            } else {
                const response = await createLocation(data);
                if (response.success) { toast.success('Location created successfully'); fetchData(); }
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
                if (response.success) { toast.success('Location deleted successfully'); fetchData(); }
            } catch (error) {
                toast.error('Failed to delete location');
            }
        }
    };

    return (
        <PageTransition>
            <PageHeader title="Locations" subtitle="Manage business locations and branches." onAddClick={() => handleOpen()} buttonText="Add Location" 
                extraActions={
                    <TextField
                        select
                        size="small"
                        label="Filter by State"
                        value={filterState}
                        onChange={(e) => {
                            setFilterState(e.target.value);
                            setPage(0);
                        }}
                        sx={{ minWidth: 150, bgcolor: 'background.paper' }}
                    >
                        <MenuItem value="All">All States</MenuItem>
                        {[...new Set(locations.map(l => l.state))].filter(Boolean).sort().map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </TextField>
                }
            />
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
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">Loading locations...</Typography></TableCell></TableRow>
                        ) : filteredLocations.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                {searchQuery ? 'No locations match your search.' : (
                                    <Box sx={{ opacity: 0.5 }}>
                                        <Typography variant="h6">No locations found</Typography>
                                        <Typography variant="body2">Click "Add Location" to create your first one.</Typography>
                                    </Box>
                                )}
                            </TableCell></TableRow>
                        ) : filteredLocations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((loc, index) => {
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
            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50]}
                component="div"
                count={filteredLocations.length}
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

            <FormDrawer open={open} onClose={() => setOpen(false)} title={editId ? 'Edit Location' : 'Add New Location'} subtitle="Define where your business operates." onSave={handleSubmit(onSubmit)} saveLabel={editId ? 'Update Location' : 'Create Location'}>
                <FieldSection label="Assignment">
                    <Controller name="business_id" control={control} rules={{ required: 'Business is required' }}
                        render={({ field }) => (
                            <Autocomplete
                                options={businesses}
                                getOptionLabel={(o) => o.business_name || ''}
                                value={businesses.find(b => b.id === field.value) || null}
                                onChange={(_, v) => field.onChange(v?.id || '')}
                                isOptionEqualToValue={(o, v) => o.id === v?.id}
                                renderInput={(params) => (
                                    <TextField {...params} label="Business *" error={!!errors.business_id} helperText={errors.business_id?.message} />
                                )}
                            />
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

                    {/* State — searchable dropdown */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Controller name="state" control={control} rules={{ required: 'State is required' }}
                            render={({ field }) => (
                                <Autocomplete
                                    fullWidth
                                    options={states}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={states.find(s => s.name === field.value) || null}
                                    onChange={(_, v) => {
                                        field.onChange(v?.name || '');
                                        setSelectedState(v || null);
                                        setValue('city', ''); // reset city on state change
                                    }}
                                    isOptionEqualToValue={(option, value) => option.name === value?.name}
                                    renderInput={(params) => (
                                        <TextField {...params} label="State *" error={!!errors.state} helperText={errors.state?.message} />
                                    )}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                width: 'auto',
                                                minWidth: '100%',
                                                '& .MuiAutocomplete-listbox': { maxHeight: 250 }
                                            }
                                        }
                                    }}
                                />
                            )} />
                        
                        <Controller name="city" control={control} rules={{ required: 'City is required' }}
                            render={({ field }) => (
                                <Autocomplete
                                    fullWidth
                                    options={cities}
                                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
                                    value={cities.find(c => (typeof c === 'string' ? c : c.name) === field.value) || null}
                                    onChange={(_, v) => field.onChange(typeof v === 'string' ? v : v?.name || '')}
                                    isOptionEqualToValue={(option, value) => (typeof option === 'string' ? option : option.name) === (typeof value === 'string' ? value : value?.name)}
                                    disabled={!selectedState}
                                    noOptionsText={selectedState ? 'No cities found' : 'Select a state first'}
                                    renderInput={(params) => (
                                        <TextField {...params} label="City *" error={!!errors.city} helperText={errors.city?.message || (!selectedState ? 'Select state first' : '')} />
                                    )}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                width: 'auto',
                                                minWidth: '100%',
                                                '& .MuiAutocomplete-listbox': { maxHeight: 250 }
                                            }
                                        }
                                    }}
                                />
                            )} />
                    </Box>
                </FieldSection>
            </FormDrawer>
        </PageTransition>
    );
};

export default Locations;
