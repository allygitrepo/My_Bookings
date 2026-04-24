import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    IconButton, Button, Tooltip, CircularProgress, Divider,
    Grid, TextField, InputAdornment, Card, CardContent,
    Switch, FormControlLabel, TablePagination
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    CheckCircle as EnableIcon,
    Block as DisableIcon,
    Money as PriceIcon,
    Timer as DurationIcon,
    Security as RestrictionIcon,
    Percent as PercentIcon,
    Terminal as ApiIcon,
    Language as WebIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import toast from 'react-hot-toast';

const PortalPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        amount: 0,
        duration_days: 30,
        portal_payment_charges: 0,
        max_businesses: 1,
        max_locations: 1,
        max_staff: 1,
        max_services: 5,
        max_bookings: 100,
        allow_api: false,
        allow_website_builder: false,
        is_one_time: false
    });

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/packages');
            if (response.data.success) {
                setPackages(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch packages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleEdit = (pkg) => {
        setFormData({
            name: pkg.name,
            amount: pkg.amount,
            duration_days: pkg.duration_days,
            portal_payment_charges: pkg.portal_payment_charges,
            max_businesses: pkg.max_businesses,
            max_locations: pkg.max_locations,
            max_staff: pkg.max_staff,
            max_services: pkg.max_services,
            max_bookings: pkg.max_bookings,
            allow_api: pkg.allow_api,
            allow_website_builder: pkg.allow_website_builder,
            is_one_time: pkg.is_one_time
        });
        setEditingId(pkg.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this package? This action cannot be undone.')) return;

        try {
            const response = await axiosInstance.delete(`/packages/${id}`);
            if (response.data.success) {
                toast.success('Package deleted successfully');
                fetchPackages();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete package');
        }
    };

    const handleToggleStatus = async (pkg) => {
        try {
            const response = await axiosInstance.put(`/packages/${pkg.id}`, { status: !pkg.status });
            if (response.data.success) {
                toast.success(`Package ${pkg.status ? 'disabled' : 'enabled'} successfully`);
                fetchPackages();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) return toast.error('Package name is required');
        if (formData.amount < 0) return toast.error('Amount cannot be negative');
        if (formData.duration_days < 1) return toast.error('Duration must be at least 1 day');
        if (formData.portal_payment_charges < 0) return toast.error('Charges cannot be negative');

        // Usage restrictions must be >= -1
        const restrictions = ['max_businesses', 'max_locations', 'max_staff', 'max_services', 'max_bookings'];
        for (const key of restrictions) {
            if (formData[key] < -1) {
                return toast.error(`${key.replace('max_', '').replace('_', ' ')} limit cannot be less than -1`);
            }
        }

        setProcessing(true);
        try {
            let response;
            if (editingId) {
                response = await axiosInstance.put(`/packages/${editingId}`, formData);
            } else {
                response = await axiosInstance.post('/packages', formData);
            }

            if (response.data.success) {
                toast.success(`Package ${editingId ? 'updated' : 'created'} successfully`);
                resetForm();
                fetchPackages();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            amount: 0,
            duration_days: 30,
            portal_payment_charges: 0,
            max_businesses: 1,
            max_locations: 1,
            max_staff: 1,
            max_services: 5,
            max_bookings: 100,
            allow_api: false,
            allow_website_builder: false,
            is_one_time: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <PageTransition>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Service Packages</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Configure subscription tiers and system restrictions.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={showForm ? null : <AddIcon />}
                    onClick={() => showForm ? resetForm() : setShowForm(true)}
                    sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 700, height: 36, px: 3 }}
                >
                    {showForm ? 'Cancel & Close' : 'Add New Package'}
                </Button>
            </Box>

            {showForm && (
                <Card sx={{ mb: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>
                            {editingId ? 'Edit Package' : 'Create New Package'}
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Grid container spacing={4}>
                                {/* Basic Information Section */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="primary" fontWeight={800} sx={{ textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                                        Basic Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth label="Package Name"
                                                placeholder="e.g. Professional Plan"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth label="Amount (₹)"
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                                inputProps={{ min: 0 }}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth label="Duration (Days)"
                                                type="number"
                                                value={formData.duration_days}
                                                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                                InputProps={{ endAdornment: <InputAdornment position="end">Days</InputAdornment> }}
                                                inputProps={{ min: 1 }}
                                                required
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Platform Settings Section */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="primary" fontWeight={800} sx={{ textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                                        Platform Settings
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth label="Portal Payment Charges (%)"
                                                type="number"
                                                value={formData.portal_payment_charges}
                                                onChange={(e) => setFormData({ ...formData, portal_payment_charges: parseFloat(e.target.value) })}
                                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                inputProps={{ min: 0, max: 100 }}
                                                helperText="Transaction fee charged by portal per booking"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Usage Restrictions Section */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="primary" fontWeight={800} sx={{ textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                                        Usage Restrictions
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <TextField
                                                fullWidth label="Max Businesses" type="number"
                                                value={formData.max_businesses}
                                                onChange={(e) => setFormData({ ...formData, max_businesses: parseInt(e.target.value) })}
                                                inputProps={{ min: -1 }}
                                                helperText="-1 for Unlimited"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <TextField
                                                fullWidth label="Max Locations" type="number"
                                                value={formData.max_locations}
                                                onChange={(e) => setFormData({ ...formData, max_locations: parseInt(e.target.value) })}
                                                inputProps={{ min: -1 }}
                                                helperText="-1 for Unlimited"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <TextField
                                                fullWidth label="Max Staff" type="number"
                                                value={formData.max_staff}
                                                onChange={(e) => setFormData({ ...formData, max_staff: parseInt(e.target.value) })}
                                                inputProps={{ min: -1 }}
                                                helperText="-1 for Unlimited"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <TextField
                                                fullWidth label="Max Services" type="number"
                                                value={formData.max_services}
                                                onChange={(e) => setFormData({ ...formData, max_services: parseInt(e.target.value) })}
                                                inputProps={{ min: -1 }}
                                                helperText="-1 for Unlimited"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <TextField
                                                fullWidth label="Max Bookings" type="number"
                                                value={formData.max_bookings}
                                                onChange={(e) => setFormData({ ...formData, max_bookings: parseInt(e.target.value) })}
                                                inputProps={{ min: -1 }}
                                                helperText="-1 for Unlimited"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {/* Feature Permissions Section */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="primary" fontWeight={800} sx={{ textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                                        Feature Permissions
                                    </Typography>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={4}>
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                <FormControlLabel
                                                    sx={{ width: '100%', m: 0 }}
                                                    control={
                                                        <Switch
                                                            checked={formData.is_one_time}
                                                            onChange={(e) => setFormData({ ...formData, is_one_time: e.target.checked })}
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ ml: 1 }}>
                                                            <Typography variant="body2" fontWeight={800}>One-Time Package</Typography>
                                                            <Typography variant="caption" color="text.secondary">Package can only be purchased once</Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Paper>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                <FormControlLabel
                                                    sx={{ width: '100%', m: 0 }}
                                                    control={
                                                        <Switch
                                                            checked={formData.allow_website_builder}
                                                            onChange={(e) => setFormData({ ...formData, allow_website_builder: e.target.checked })}
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ ml: 1 }}>
                                                            <Typography variant="body2" fontWeight={800}>Website Builder</Typography>
                                                            <Typography variant="caption" color="text.secondary">Access to premium public website customization</Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12} sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 1.5,
                                    mt: 2,
                                    flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                    <Button
                                        onClick={resetForm}
                                        variant="outlined"
                                        color="inherit"
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            borderRadius: '100px',
                                            order: { xs: 2, sm: 1 },
                                            textTransform: 'none',
                                            height: 36,
                                            px: 3,
                                            width: { xs: '100%', sm: 'auto' }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="small"
                                        disabled={processing}
                                        sx={{
                                            fontWeight: 700,
                                            borderRadius: '100px',
                                            order: { xs: 1, sm: 2 },
                                            textTransform: 'none',
                                            height: 36,
                                            px: 4,
                                            width: { xs: '100%', sm: 'auto' }
                                        }}
                                    >
                                        {processing ? 'Processing...' : editingId ? 'Update Package' : 'Create Package'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Card sx={{ mb: 4 }}>
                <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Package Details</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Pricing</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Restrictions</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : packages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                                    No packages created yet.
                                </TableCell>
                            </TableRow>
                        ) : packages.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pkg) => (
                            <TableRow key={pkg.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={800}>{pkg.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PriceIcon fontSize="small" color="action" />
                                        <Typography variant="body2" fontWeight={700}>₹{parseFloat(pkg.amount).toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <DurationIcon fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">{pkg.duration_days} Days</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={
                                        <Box p={1}>
                                            <Typography variant="caption" display="block">Businesses: {pkg.max_businesses === -1 ? 'Unlimited' : pkg.max_businesses}</Typography>
                                            <Typography variant="caption" display="block">Locations: {pkg.max_locations === -1 ? 'Unlimited' : pkg.max_locations}</Typography>
                                            <Typography variant="caption" display="block">Staff: {pkg.max_staff === -1 ? 'Unlimited' : pkg.max_staff}</Typography>
                                            <Typography variant="caption" display="block">Services: {pkg.max_services === -1 ? 'Unlimited' : pkg.max_services}</Typography>
                                            <Typography variant="caption" display="block">Bookings: {pkg.max_bookings === -1 ? 'Unlimited' : pkg.max_bookings}</Typography>
                                            <Divider sx={{ my: 1, opacity: 0.1 }} />
                                            <Typography variant="caption" display="block" color="primary.light">One-Time Only: {pkg.is_one_time ? 'Yes' : 'No'}</Typography>
                                        </Box>
                                    }>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                                            <RestrictionIcon fontSize="small" color="action" />
                                            <Typography variant="body2" fontWeight={600}>View Limits</Typography>
                                        </Box>
                                    </Tooltip>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        {pkg.allow_website_builder && (
                                            <Tooltip title="Website Builder Enabled">
                                                <WebIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                            </Tooltip>
                                        )}
                                        {pkg.is_one_time && (
                                            <Tooltip title="One-Time Package">
                                                <Chip label="1-TIME" size="small" color="warning" sx={{ fontSize: '0.6rem', height: 18, fontWeight: 900 }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        <PercentIcon sx={{ fontSize: '0.8rem' }} /> {pkg.portal_payment_charges}% Charges
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={pkg.status ? 'Enabled' : 'Disabled'}
                                        size="small"
                                        color={pkg.status ? 'success' : 'default'}
                                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Tooltip title={pkg.status ? 'Disable' : 'Enable'}>
                                            <IconButton onClick={() => handleToggleStatus(pkg)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                                {pkg.status ? <DisableIcon fontSize="small" color="error" /> : <EnableIcon fontSize="small" color="success" />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <IconButton onClick={() => handleEdit(pkg)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                                <EditIcon fontSize="small" color="primary" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton onClick={() => handleDelete(pkg.id)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={packages.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>
        </PageTransition>
    );
};

export default PortalPackages;
