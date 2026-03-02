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
import { useStaff, useBusinesses, useLocations } from '../store';

const Staff = () => {
    const [staffList, setStaffList] = useStaff();
    const [businesses] = useBusinesses();
    const [locations] = useLocations();

    const [open, setOpen] = useState(false);
    const [currentStaff, setCurrentStaff] = useState(null);

    const [formData, setFormData] = useState({
        businessId: '',
        locationId: '',
        name: '',
        role: '',
        phone: '',
    });

    const handleOpen = (staff = null) => {
        setCurrentStaff(staff);
        if (staff) {
            setFormData(staff);
        } else {
            setFormData({
                businessId: businesses.length > 0 ? businesses[0].id : '',
                locationId: locations.length > 0 ? locations[0].id : '',
                name: '',
                role: '',
                phone: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentStaff(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!formData.name || !formData.businessId || !formData.locationId) return;

        if (currentStaff) {
            setStaffList(staffList.map(s => s.id === currentStaff.id ? { ...s, ...formData } : s));
        } else {
            const newStaff = {
                ...formData,
                id: Date.now().toString(),
                status: 'Active'
            };
            setStaffList([...staffList, newStaff]);
        }
        handleClose();
    };

    const handleDelete = (id) => {
        setStaffList(staffList.filter((s) => s.id !== id));
    };

    return (
        <>
            <PageHeader
                title="Staff Members"
                subtitle="Manage your service providers and team members."
                onAddClick={() => handleOpen()}
                buttonText="Add Staff"
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Staff Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staffList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    No staff members added yet. Click "Add Staff" to begin.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {staffList.map((staff) => {
                            const business = businesses.find((b) => b.id === staff.businessId);
                            const location = locations.find((l) => l.id === staff.locationId);
                            return (
                                <TableRow key={staff.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{staff.name}</TableCell>
                                    <TableCell>{business?.name || 'Unknown'}</TableCell>
                                    <TableCell>{location?.name || 'Unknown'}</TableCell>
                                    <TableCell>{staff.role}</TableCell>
                                    <TableCell>{staff.phone}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={staff.status}
                                            size="small"
                                            color={staff.status === 'Active' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpen(staff)} color="primary" size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(staff.id)} color="error" size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Staff Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Business</InputLabel>
                                <Select
                                    label="Business"
                                    name="businessId"
                                    value={formData.businessId}
                                    onChange={handleChange}
                                >
                                    {businesses.length === 0 && <MenuItem value=""><em>None</em></MenuItem>}
                                    {businesses.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Location</InputLabel>
                                <Select
                                    label="Location"
                                    name="locationId"
                                    value={formData.locationId}
                                    onChange={handleChange}
                                >
                                    {locations.length === 0 && <MenuItem value=""><em>None</em></MenuItem>}
                                    {locations.map((l) => (
                                        <MenuItem key={l.id} value={l.id}>
                                            {l.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Staff Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                variant="outlined"
                                placeholder="e.g. Doctor, Trainer"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {currentStaff ? 'Update' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Staff;
