import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar,
    IconButton, Button, Tooltip, CircularProgress, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import {
    Block as BlockIcon,
    CheckCircle as ActiveIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Info as InfoIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    Language as WebIcon,
    Business as BusinessIcon,
    AccountBalance as BankIcon,
    Person as OwnerIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';

const PortalBusinesses = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Suspension State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState(null);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // View Details State
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingBiz, setViewingBiz] = useState(null);

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/portal/businesses');
            if (response.data.success) {
                setBusinesses(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch businesses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const handleToggleStatus = async (biz) => {
        if (biz.status) {
            setSelectedBiz(biz);
            setReason('');
            setOpenDialog(true);
        } else {
            // Activate immediately
            try {
                const response = await axiosInstance.put(`/portal/business/${biz.id}/manage`, { status: true });
                if (response.data.success) {
                    toast.success('Business activated successfully');
                    fetchBusinesses();
                }
            } catch (error) {
                toast.error('Failed to activate business');
            }
        }
    };

    const confirmSuspension = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setProcessing(true);
        try {
            const response = await axiosInstance.put(`/portal/business/${selectedBiz.id}/manage`, {
                status: false,
                suspended_reason: reason
            });
            if (response.data.success) {
                toast.success('Business suspended successfully');
                setOpenDialog(false);
                fetchBusinesses();
            }
        } catch (error) {
            toast.error('Failed to suspend business');
        } finally {
            setProcessing(false);
        }
    };

    const handleViewDetails = (biz) => {
        setViewingBiz(biz);
        setViewDialogOpen(true);
    };

    return (
        <PageTransition>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Platform Businesses</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Manage all tenants and their operational status.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ActiveIcon />}
                    onClick={fetchBusinesses}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                    Refresh List
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Business Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Owner</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Bookings</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={30} />
                                    <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Fetching all tenants...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : businesses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                                    No businesses found on the platform.
                                </TableCell>
                            </TableRow>
                        ) : businesses.map((biz) => (
                            <TableRow key={biz.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 800 }}>
                                            {biz.business_name?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={800}>{biz.business_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{biz.business_type}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{biz.owner?.name || 'Unknown'}</Typography>
                                    <Typography variant="caption" color="text.secondary">{biz.owner?.email}</Typography>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{formatDate(biz.created_at)}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{biz.bookingCount || 0}</TableCell>
                                <TableCell>
                                    {!biz.status ? (
                                        <Tooltip title={biz.suspended_reason || "Violation of platform policies"} arrow>
                                            <Chip
                                                label="Suspended"
                                                size="small"
                                                color="error"
                                                icon={<InfoIcon style={{ fontSize: '0.9rem' }} />}
                                                sx={{ fontWeight: 700, borderRadius: 1.5, cursor: 'help' }}
                                            />
                                        </Tooltip>
                                    ) : (
                                        <Chip
                                            label="Active"
                                            size="small"
                                            color="success"
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Tooltip title={biz.status ? 'Suspend Business' : 'Activate Business'}>
                                            <IconButton
                                                onClick={() => handleToggleStatus(biz)}
                                                color={biz.status ? 'error' : 'success'}
                                                sx={{ bgcolor: biz.status ? 'error.50' : 'success.50' }}
                                            >
                                                {biz.status ? <BlockIcon /> : <ActiveIcon />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View Details">
                                            <IconButton
                                                onClick={() => handleViewDetails(biz)}
                                                sx={{ bgcolor: 'action.hover' }}
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Business Details Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                    <BusinessIcon color="primary" />
                    Business Information
                    <Chip
                        label={viewingBiz?.status ? 'Active' : 'Suspended'}
                        size="small"
                        color={viewingBiz?.status ? 'success' : 'error'}
                        sx={{ ml: 'auto', fontWeight: 700 }}
                    />
                </DialogTitle>
                <DialogContent dividers>
                    {viewingBiz && (
                        <Grid container spacing={4}>
                            {/* Basic Info */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>General Details</Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <BusinessIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.business_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">Name</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <WebIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.slug}</Typography>
                                            <Typography variant="caption" color="text.secondary">Slug (Public URL)</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <InfoIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.business_type}</Typography>
                                            <Typography variant="caption" color="text.secondary">Category</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Owner Info */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>Owner Details</Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <OwnerIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.owner?.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">Owner Name</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <EmailIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.owner?.email}</Typography>
                                            <Typography variant="caption" color="text.secondary">Owner Email</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Contact & Address */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>Contact & Location</Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <PhoneIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.phone || 'N/A'}</Typography>
                                            <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <LocationIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {viewingBiz.address ? `${viewingBiz.address}, ${viewingBiz.city || ''}, ${viewingBiz.state || ''}` : 'No address provided'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Business Address</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Bank Details */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>Payout Information</Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <BankIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.upi_id || 'Not configured'}</Typography>
                                            <Typography variant="caption" color="text.secondary">UPI ID</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <BankIcon fontSize="small" color="action" />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {viewingBiz.account_number ? `${viewingBiz.bank_name} - ${viewingBiz.account_number}` : 'No bank account details'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Bank Account</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* System Status */}
                            <Grid item xs={12}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>System Information</Typography>
                                <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Website Template</Typography>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.selected_template}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Registration Date</Typography>
                                            <Typography variant="body2" fontWeight={700}>{formatDate(viewingBiz.created_at)}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Total Bookings</Typography>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.bookingCount}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="caption" color="text.secondary" display="block">Multi-Location</Typography>
                                            <Typography variant="body2" fontWeight={700}>{viewingBiz.has_multiple_locations ? 'Yes' : 'No'}</Typography>
                                        </Grid>
                                    </Grid>
                                    {!viewingBiz.status && (
                                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'error.50', borderRadius: 1.5, border: '1px solid', borderColor: 'error.100' }}>
                                            <Typography variant="caption" color="error.main" fontWeight={800} display="block">Suspension Reason</Typography>
                                            <Typography variant="body2" color="error.dark" fontWeight={600}>{viewingBiz.suspended_reason}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>

                    <Button onClick={() => setViewDialogOpen(false)} variant="contained" sx={{ fontWeight: 700, px: 4 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Suspend Reason Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Suspend Business</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Provide a reason for suspending **{selectedBiz?.business_name}**. This will disable their booking website.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="e.g. Inappropriate content, violation of policies..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={confirmSuspension}
                        variant="contained"
                        color="error"
                        disabled={processing}
                        sx={{ fontWeight: 700 }}
                    >
                        {processing ? 'Suspending...' : 'Confirm Suspension'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageTransition>
    );
};

export default PortalBusinesses;
