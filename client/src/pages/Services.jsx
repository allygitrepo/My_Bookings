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
    OutlinedInput,
    Box,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useServices, useBusinesses, useStaff, useStaffServices } from '../store';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const Services = () => {
    const [servicesList, setServicesList] = useServices();
    const [businesses] = useBusinesses();
    const [staff] = useStaff();
    const [staffServices, setStaffServices] = useStaffServices();

    const [open, setOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);

    const [formData, setFormData] = useState({
        businessId: '',
        name: '',
        duration: '',
        price: '',
        minCharge: '',
        assignedStaff: [] // Array of staff IDs
    });

    const handleOpen = (service = null) => {
        setCurrentService(service);
        if (service) {
            const assigned = staffServices
                .filter(ss => ss.serviceId === service.id)
                .map(ss => ss.staffId);

            setFormData({
                ...service,
                assignedStaff: assigned
            });
        } else {
            setFormData({
                businessId: businesses.length > 0 ? businesses[0].id : '',
                name: '',
                duration: '',
                price: '',
                minCharge: '',
                assignedStaff: []
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentService(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAssignedStaffChange = (event) => {
        const { target: { value } } = event;
        setFormData({
            ...formData,
            assignedStaff: typeof value === 'string' ? value.split(',') : value,
        });
    };

    const handleSave = () => {
        if (!formData.name || !formData.businessId) return;

        let targetServiceId;

        if (currentService) {
            targetServiceId = currentService.id;
            // Update service details
            setServicesList(servicesList.map(s => s.id === targetServiceId ? {
                id: targetServiceId,
                businessId: formData.businessId,
                name: formData.name,
                duration: formData.duration,
                price: formData.price,
                minCharge: formData.minCharge,
            } : s));
        } else {
            // Create new
            targetServiceId = Date.now().toString();
            const newService = {
                id: targetServiceId,
                businessId: formData.businessId,
                name: formData.name,
                duration: formData.duration,
                price: formData.price,
                minCharge: formData.minCharge,
            };
            setServicesList([...servicesList, newService]);
        }

        // Update staff-services mapping
        // Exclude old mappings for this service
        let updatedStaffServices = staffServices.filter(ss => ss.serviceId !== targetServiceId);

        // Add new mappings
        const newMappings = formData.assignedStaff.map(staffId => ({
            staffId,
            serviceId: targetServiceId,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'Active'
        }));

        setStaffServices([...updatedStaffServices, ...newMappings]);
        handleClose();
    };

    const handleDelete = (id) => {
        setServicesList(servicesList.filter((s) => s.id !== id));
        setStaffServices(staffServices.filter(ss => ss.serviceId !== id)); // Cascade delete mappings
    };

    return (
        <>
            <PageHeader
                title="Services"
                subtitle="Define the services you offer and assign staff."
                onAddClick={() => handleOpen()}
                buttonText="Add Service"
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Min Charge</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assigned Staff</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {servicesList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    No services added yet. Click "Add Service" to start offering packages.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {servicesList.map((service) => {
                            const assignedStaffIds = staffServices
                                .filter((ss) => ss.serviceId === service.id)
                                .map((ss) => ss.staffId);
                            const assignedStaffNames = staff
                                .filter((s) => assignedStaffIds.includes(s.id))
                                .map((s) => s.name);

                            return (
                                <TableRow key={service.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{service.name}</TableCell>
                                    <TableCell>{service.duration} mins</TableCell>
                                    <TableCell>${service.price}</TableCell>
                                    <TableCell>${service.minCharge}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {assignedStaffNames.length > 0 ? assignedStaffNames.map((name) => (
                                                <Chip key={name} label={name} size="small" variant="outlined" />
                                            )) : <Typography variant="caption" color="text.secondary">None</Typography>}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(service)} color="primary" size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(service.id)} color="error" size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Service Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
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
                                label="Service Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Duration (mins)"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                variant="outlined"
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Price ($)"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                variant="outlined"
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Min Charge ($)"
                                name="minCharge"
                                value={formData.minCharge}
                                onChange={handleChange}
                                variant="outlined"
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="staff-label">Assigned Staff</InputLabel>
                                <Select
                                    labelId="staff-label"
                                    multiple
                                    value={formData.assignedStaff}
                                    onChange={handleAssignedStaffChange}
                                    input={<OutlinedInput label="Assigned Staff" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={staff.find(s => s.id === value)?.name || 'Unknown'} />
                                            ))}
                                        </Box>
                                    )}
                                    MenuProps={MenuProps}
                                >
                                    {staff.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {currentService ? 'Update' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Services;
