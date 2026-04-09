import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar,
    IconButton, Button, Tooltip, CircularProgress, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import {
    Block as BlockIcon,
    CheckCircle as ActiveIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Info as InfoIcon
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
                                        <Tooltip title="View Public Page">
                                            <IconButton 
                                                component="a" 
                                                href={`/${biz.slug}`} 
                                                target="_blank"
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
