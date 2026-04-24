import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, 
    CircularProgress, Divider, Stack, Card, CardContent,
    useTheme, useMediaQuery, Chip, Grid, Modal, Fade, Backdrop
} from '@mui/material';
import { 
    CheckCircle as CheckIcon, 
    Security as SecurityIcon,
    Payment as PaymentIcon,
    Bolt as BoltIcon,
    ArrowBack as BackIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SubscriptionModal = ({ open }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [packages, setPackages] = useState([]);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState('select'); // 'select' or 'pay'

    useEffect(() => {
        if (!open) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all active packages with 'already_used' info for this user
                const pkgRes = await axiosInstance.get('/packages/available');
                if (pkgRes.data.success) {
                    setPackages(pkgRes.data.data);
                    
                    // If we already have a selection in session, skip to pay step
                    const savedId = sessionStorage.getItem('selectedPackageId');
                    if (savedId) {
                        const pkg = pkgRes.data.data.find(p => String(p.id) === String(savedId));
                        // Only auto-select if NOT already used
                        if (pkg && !pkg.already_used) {
                            setSelectedPkg(pkg);
                            setStep('pay');
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to load pricing plans');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [open]);

    const handleActivation = async () => {
        if (!selectedPkg) return;
        setProcessing(true);
        try {
            const packageId = selectedPkg.id;
            
            // 1. Handle Free Plan
            if (parseFloat(selectedPkg.amount) === 0) {
                const res = await axiosInstance.post('/subscriptions/activate-free', { packageId });
                if (res.data.success) {
                    toast.success('Free plan activated!');
                    await refreshSession(packageId, selectedPkg.name);
                    window.location.reload();
                    return;
                } else {
                    throw new Error(res.data.message || 'Activation failed');
                }
            }

            // 2. Handle Paid Plan
            console.log('Creating order for package:', packageId);
            const orderRes = await axiosInstance.post('/subscriptions/create-order', { packageId });
            
            if (!orderRes.data.success) {
                throw new Error(orderRes.data.message || 'Failed to create payment order');
            }

            const { order, pkg } = orderRes.data;
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const user = currentUser.user || currentUser;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "MyBookings",
                description: `Subscription for ${pkg.name}`,
                order_id: order.id,
                prefill: {
                    name: user.name || '',
                    email: user.email || '',
                },
                handler: async (response) => {
                    try {
                        const verifyRes = await axiosInstance.post('/subscriptions/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            packageId: pkg.id
                        });

                        if (verifyRes.data.success) {
                            toast.success('Subscription activated!');
                            await refreshSession(pkg.id, pkg.name);
                            window.location.reload();
                        } else {
                            toast.error(verifyRes.data.message || 'Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        toast.error('Payment verification failed');
                    }
                },
                theme: { color: "#6366f1" },
            };

            if (!window.Razorpay) {
                throw new Error('Razorpay SDK not loaded. Please refresh the page.');
            }

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                toast.error(response.error.description || 'Payment failed');
            });
            rzp.open();
        } catch (error) {
            console.error('Activation Error:', error);
            toast.error(error.response?.data?.message || error.message || 'Activation failed');
        } finally {
            setProcessing(false);
        }
    };

    const refreshSession = async (pkgId, pkgName) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const updatedUser = { ...currentUser, package_id: pkgId, package_name: pkgName };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        try {
            await axiosInstance.post('/users/refresh-token');
        } catch (e) {}
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '95%' : (step === 'select' ? 1000 : 800),
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        overflowY: 'auto',
        outline: 'none',
        p: 0
    };

    return (
        <Modal open={open} BackdropProps={{ sx: { backdropFilter: 'blur(10px)', bgcolor: 'rgba(15, 23, 42, 0.8)' } }}>
            <Fade in={open}>
                <Box sx={modalStyle}>
                    {loading ? (
                        <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>
                    ) : (
                        <Box>
                            {step === 'select' ? (
                                <Box sx={{ p: 4 }}>
                                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                                        <Typography variant="h4" fontWeight={900}>Choose Your Plan</Typography>
                                        <Typography color="text.secondary">Select a package to unlock your professional dashboard</Typography>
                                    </Box>
                                    
                                    <Grid container spacing={3} justifyContent="center">
                                        {(() => {
                                            const count = packages.length;
                                            let md = 2.4; // Default for 5
                                            if (count === 1) md = 12;
                                            else if (count === 2) md = 6;
                                            else if (count === 3) md = 4;
                                            else if (count === 4) md = 3;
                                            else if (count === 5) md = 2.4;
                                            else if (count === 6) md = 4; // 3 upper, 3 lower
                                            else md = 3; // 4 per row for > 6

                                            return packages.map((pkg) => (
                                                <Grid item xs={12} sm={6} md={md} key={pkg.id}>
                                                <Card 
                                                    elevation={0}
                                                    onClick={() => { 
                                                        if (pkg.already_used) return;
                                                        setSelectedPkg(pkg); 
                                                        setStep('pay'); 
                                                    }}
                                                    sx={{ 
                                                        cursor: pkg.already_used ? 'not-allowed' : 'pointer', 
                                                        p: 3, height: '100%', 
                                                        borderRadius: '24px',
                                                        border: '1px solid #e2e8f0',
                                                        opacity: pkg.already_used ? 0.6 : 1,
                                                        filter: pkg.already_used ? 'grayscale(0.5)' : 'none',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        position: 'relative',
                                                        '&:hover': !pkg.already_used && { 
                                                            borderColor: '#6366f1', 
                                                            transform: 'translateY(-8px)',
                                                            boxShadow: '0 20px 40px rgba(99,102,241,0.08)'
                                                        }
                                                    }}
                                                >
                                                    {pkg.already_used && (
                                                        <Box sx={{ 
                                                            position: 'absolute', top: 12, right: 12,
                                                            bgcolor: '#fee2e2', color: '#ef4444', 
                                                            px: 1.5, py: 0.5, borderRadius: 10,
                                                            fontSize: '0.65rem', fontWeight: 800,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            Used
                                                        </Box>
                                                    )}
                                                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a', mb: 2 }}>{pkg.name}</Typography>
                                                    
                                                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'baseline' }}>
                                                        <Typography variant="h4" fontWeight={900} sx={{ color: pkg.already_used ? '#94a3b8' : '#6366f1' }}>
                                                            ₹{parseFloat(pkg.amount).toLocaleString()}
                                                        </Typography>
                                                    </Box>

                                                    <Divider sx={{ mb: 3, borderColor: '#f1f5f9' }} />
                                                    
                                                    <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>
                                                        {[
                                                            { label: `${pkg.max_businesses === -1 ? 'Unlimited' : pkg.max_businesses} Businesses`, icon: <CheckIcon fontSize="small" /> },
                                                            { label: `${pkg.max_locations === -1 ? 'Unlimited' : pkg.max_locations} Locations`, icon: <CheckIcon fontSize="small" /> },
                                                            { label: `${pkg.max_staff === -1 ? 'Unlimited' : pkg.max_staff} Staff Members`, icon: <CheckIcon fontSize="small" /> },
                                                            { label: `${pkg.max_bookings === -1 ? 'Unlimited' : pkg.max_bookings} Bookings`, icon: <CheckIcon fontSize="small" /> },
                                                            { label: 'API Access', icon: pkg.allow_api ? <CheckIcon fontSize="small" /> : <CancelIcon fontSize="small" />, disabled: !pkg.allow_api },
                                                            { label: 'Website Builder', icon: pkg.allow_website_builder ? <CheckIcon fontSize="small" /> : <CancelIcon fontSize="small" />, disabled: !pkg.allow_website_builder },
                                                            { label: `${pkg.duration_days} Days Validity`, icon: <CheckIcon fontSize="small" /> },
                                                        ].map((item, idx) => (
                                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: item.disabled ? 0.4 : 1 }}>
                                                                <Box sx={{ color: item.disabled ? '#ef4444' : '#10b981', display: 'flex' }}>
                                                                    {item.icon}
                                                                </Box>
                                                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, textDecoration: item.disabled ? 'line-through' : 'none' }}>
                                                                    {item.label}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>

                                                    <Button 
                                                        fullWidth 
                                                        variant="outlined" 
                                                        disabled={pkg.already_used}
                                                        sx={{ 
                                                            borderRadius: '12px',
                                                            py: 1,
                                                            fontWeight: 800,
                                                            textTransform: 'none',
                                                            fontSize: '0.85rem',
                                                            borderColor: pkg.already_used ? '#e2e8f0' : '#6366f1',
                                                            color: pkg.already_used ? '#94a3b8' : '#6366f1',
                                                            '&:hover': !pkg.already_used && {
                                                                bgcolor: '#6366f1',
                                                                color: 'white',
                                                                borderColor: '#6366f1'
                                                            }
                                                        }}
                                                    >
                                                        {pkg.already_used ? 'Already Used' : 'Select Plan'}
                                                    </Button>
                                                </Card>
                                            </Grid>
                                        ))
                                    })()}
                                </Grid>
                                </Box>
                            ) : (
                                <Grid container>
                                    <Grid item xs={12} md={6} sx={{ p: 4, bgcolor: '#f8fafc' }}>
                                        <Button startIcon={<BackIcon />} onClick={() => setStep('select')} sx={{ mb: 2 }}>Change Plan</Button>
                                        <Typography variant="h6" fontWeight={800} mb={2}>Review Activation</Typography>
                                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                            <Typography variant="caption" color="primary" fontWeight={700}>PLAN DETAILS</Typography>
                                            <Typography variant="h5" fontWeight={900}>{selectedPkg?.name}</Typography>
                                            <Typography variant="h4" color="primary" fontWeight={900} sx={{ mt: 1 }}>₹{parseFloat(selectedPkg?.amount).toLocaleString()}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Button
                                            fullWidth variant="contained" size="large" disabled={processing}
                                            onClick={handleActivation}
                                            sx={{ py: 2, borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                                        >
                                            {processing ? <CircularProgress size={24} color="inherit" /> : parseFloat(selectedPkg?.amount) === 0 ? 'Activate Now' : 'Pay & Activate'}
                                        </Button>
                                        <Button variant="text" sx={{ mt: 2 }} onClick={() => { localStorage.removeItem('currentUser'); window.location.href='/'; }}>Logout</Button>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
            </Fade>
        </Modal>
    );
};

export default SubscriptionModal;
