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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useBusinesses } from '../store';

const Businesses = () => {
    const [businesses, setBusinesses] = useBusinesses();
    const [open, setOpen] = useState(false);
    const [currentBusiness, setCurrentBusiness] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        email: '',
        phone: '',
        upiId: '',
    });

    const handleOpen = (business = null) => {
        setCurrentBusiness(business);
        if (business) {
            setFormData(business);
        } else {
            setFormData({ name: '', type: '', email: '', phone: '', upiId: '' });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentBusiness(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!formData.name) return; // Basic validation

        if (currentBusiness) {
            // Update
            setBusinesses(businesses.map(b => b.id === currentBusiness.id ? { ...b, ...formData } : b));
        } else {
            // Create new
            const newBusiness = {
                ...formData,
                id: Date.now().toString(),
                status: 'Active'
            };
            setBusinesses([...businesses, newBusiness]);
        }
        handleClose();
    };

    const handleDelete = (id) => {
        setBusinesses(businesses.filter((b) => b.id !== id));
    };

    return (
        <>
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
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {businesses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    No businesses added yet. Click "Add Business" to get started.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {businesses.map((business) => (
                            <TableRow key={business.id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{business.name}</TableCell>
                                <TableCell>{business.type}</TableCell>
                                <TableCell>{business.phone}</TableCell>
                                <TableCell>{business.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={business.status}
                                        size="small"
                                        color={business.status === 'Active' ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleOpen(business)} color="primary" size="small">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(business.id)} color="error" size="small">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Business Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentBusiness ? 'Edit Business' : 'Add New Business'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Business Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Business Type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                variant="outlined"
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
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="UPI ID"
                                name="upiId"
                                value={formData.upiId}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {currentBusiness ? 'Update' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Businesses;
