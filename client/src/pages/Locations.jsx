import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useLocations, useBusinesses } from '../store';

const Locations = () => {
    const [locations, setLocations] = useLocations();
    const [businesses] = useBusinesses();

    const [open, setOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);

    const [formData, setFormData] = useState({
        businessId: '',
        name: '',
        address: '',
        city: '',
        state: '',
    });

    const handleOpen = (location = null) => {
        setCurrentLocation(location);
        if (location) {
            setFormData(location);
        } else {
            setFormData({
                businessId: businesses.length > 0 ? businesses[0].id : '',
                name: '',
                address: '',
                city: '',
                state: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentLocation(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!formData.name || !formData.businessId) return;

        if (currentLocation) {
            setLocations(locations.map(l => l.id === currentLocation.id ? { ...l, ...formData } : l));
        } else {
            const newLocation = {
                ...formData,
                id: Date.now().toString(),
                status: 'Active'
            };
            setLocations([...locations, newLocation]);
        }
        handleClose();
    };

    const handleDelete = (id) => {
        setLocations(locations.filter((l) => l.id !== id));
    };

    return (
        <>
            <PageHeader
                title="Locations"
                subtitle="Manage business locations and branches."
                onAddClick={() => handleOpen()}
                buttonText="Add Location"
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Location Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {locations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    No locations added yet. Click "Add Location" to start.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {locations.map((location) => {
                            const business = businesses.find((b) => b.id === location.businessId);
                            return (
                                <TableRow key={location.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{location.name}</TableCell>
                                    <TableCell>{business?.name || 'Unknown'}</TableCell>
                                    <TableCell>{location.city}</TableCell>
                                    <TableCell>{location.state}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={location.status}
                                            size="small"
                                            color={location.status === 'Active' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(location)} color="primary" size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(location.id)} color="error" size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Location Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Business</InputLabel>
                                <Select
                                    label="Business"
                                    name="businessId"
                                    value={formData.businessId}
                                    onChange={handleChange}
                                >
                                    {businesses.length === 0 && <MenuItem value=""><em>None Selected</em></MenuItem>}
                                    {businesses.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Location Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                variant="outlined"
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="State"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {currentLocation ? 'Update' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Locations;
