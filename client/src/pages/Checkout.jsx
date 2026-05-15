import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Button, 
    CircularProgress, Divider, Stack, Card, CardContent,
    useTheme, useMediaQuery, Chip, Grid
} from '@mui/material';
import { 
    CheckCircle as CheckIcon, 
    ArrowBack as BackIcon,
    Security as SecurityIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Get packageId from URL query or sessionStorage
    const queryParams = new URLSearchParams(location.search);
    const packageId = queryParams.get('packageId') || sessionStorage.getItem('selectedPackageId');

    useEffect(() => {
        if (!packageId) {
            toast.error('No package selected');
            navigate('/');
            return;
        }

        const fetchPackageDetails = async () => {
            try {
                const response = await axiosInstance.get(`/packages/${packageId}`);
                if (response.data.success) {
                    setPackageData(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch package:', error);
                toast.error('Failed to load package details');
            } finally {
                setLoading(false);
            }
        };

        fetchPackageDetails();
    }, [packageId, navigate]);

    const handlePayment = async () => {
        setProcessing(true);
        try {
            // Check if package is free
            if (parseFloat(packageData.amount) === 0) {
                const res = await axiosInstance.post('/subscriptions/activate-free', { packageId });
                if (res.data.success) {
                    toast.success('Free plan activated!');
                    
                    // Update local storage user object with new package info
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    const updatedUser = { ...currentUser, package_id: packageData.id };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    
                    sessionStorage.removeItem('selectedPackageId');
                    sessionStorage.removeItem('selectedPackageName');
                    
                    // Attempt token refresh to sync everything
                    try {
                        const tokenRes = await axiosInstance.post('/users/refresh-token');
                        if (tokenRes.data?.success) {
                            localStorage.setItem('currentUser', JSON.stringify({ ...tokenRes.data.data.user, token: tokenRes.data.data.token }));
                        }
                    } catch (e) { /* silent fail */ }

                    navigate('/dashboard');
                    return;
                }
            }

            // 1. Create Order
            const orderRes = await axiosInstance.post('/subscriptions/create-order', { packageId });
            if (!orderRes.data.success) throw new Error(orderRes.data.message);

            const { order, pkg } = orderRes.data;

            // 2. Open Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "MyBookings",
                description: `Subscription for ${pkg.name}`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await axiosInstance.post('/subscriptions/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            packageId: pkg.id
                        });

                        if (verifyRes.data.success) {
                            toast.success('Subscription activated successfully!');
                            
                            // Update local storage
                            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                            const updatedUser = { ...currentUser, package_id: pkg.id };
                            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                            sessionStorage.removeItem('selectedPackageId');
                            sessionStorage.removeItem('selectedPackageName');

                            // Refresh token to get latest package info
                            try {
                                const tokenRes = await axiosInstance.post('/users/refresh-token');
                                if (tokenRes.data?.success) {
                                    localStorage.setItem('currentUser', JSON.stringify({ ...tokenRes.data.data.user, token: tokenRes.data.data.token }));
                                }
                            } catch (e) { /* silent fail */ }

                            navigate('/dashboard');
                        }
                    } catch (err) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: localStorage.getItem('userName'),
                    email: localStorage.getItem('userEmail'),
                },
                theme: { color: "#6366f1" },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            toast.error(error.response?.data?.message || 'Activation failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'transparent' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                <Button 
                    startIcon={<BackIcon />} 
                    onClick={() => navigate(-1)}
                    sx={{ mb: 4, textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
                >
                    Back to Plans
                </Button>

                <Grid container spacing={4}>
                    {/* Left Column: Order Summary */}
                    <Grid item xs={12} md={7}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Typography variant="h4" fontWeight={900} gutterBottom sx={{ color: '#0f172a' }}>
                                Review your subscription
                            </Typography>
                            <Typography variant="body1" color="text.secondary" mb={4}>
                                You're almost there! Complete your payment to unlock professional booking tools.
                            </Typography>

                            <Paper sx={{ p: 0, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                <Box sx={{ p: 4, bgcolor: '#6366f1', color: 'white' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="h6" fontWeight={800}>{packageData?.name}</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Professional SaaS Subscription</Typography>
                                        </Box>
                                        <Chip label="Selected Plan" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                                    </Stack>
                                </Box>
                                
                                <Box sx={{ p: 4 }}>
                                    <Stack spacing={3}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" fontWeight={500}>Plan Duration</Typography>
                                            <Typography fontWeight={700}>{packageData?.duration_days} Days</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" fontWeight={500}>Businesses allowed</Typography>
                                            <Typography fontWeight={700}>{packageData?.max_businesses === -1 ? 'Unlimited' : packageData?.max_businesses}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography color="text.secondary" fontWeight={500}>Locations allowed</Typography>
                                            <Typography fontWeight={700}>{packageData?.max_locations === -1 ? 'Unlimited' : packageData?.max_locations}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <Typography variant="h6" fontWeight={800}>Total Amount</Typography>
                                            <Typography variant="h4" fontWeight={900} color="primary">₹{parseFloat(packageData?.amount).toLocaleString()}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Paper>

                            <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2, p: 3, borderRadius: '16px', bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                <SecurityIcon sx={{ color: '#059669' }} />
                                <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 600 }}>
                                    Secure SSL encrypted payment. Your data is protected by industry standard encryption.
                                </Typography>
                            </Box>
                        </motion.div>
                    </Grid>

                    {/* Right Column: Payment Details */}
                    <Grid item xs={12} md={5}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" fontWeight={800} mb={3}>Payment Method</Typography>
                                    
                                    <Box sx={{ 
                                        p: 3, mb: 4, borderRadius: '16px', border: '2px solid #6366f1', bgcolor: '#f5f3ff',
                                        display: 'flex', alignItems: 'center', gap: 2
                                    }}>
                                        <PaymentIcon color="primary" />
                                        <Box>
                                            <Typography fontWeight={700}>Razorpay Secure</Typography>
                                            <Typography variant="caption" color="text.secondary">UPI, Cards, Netbanking, Wallets</Typography>
                                        </Box>
                                        <CheckIcon sx={{ ml: 'auto', color: '#6366f1' }} />
                                    </Box>

                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        size="large"
                                        disabled={processing}
                                        onClick={handlePayment}
                                        sx={{ 
                                            py: 2, borderRadius: '12px', fontWeight: 800, textTransform: 'none', fontSize: '1.1rem',
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)',
                                            '&:hover': { transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        {processing ? (
                                            <CircularProgress size={24} sx={{ color: 'white' }} />
                                        ) : (
                                            parseFloat(packageData?.amount) === 0 ? 'Activate Free Plan' : `Pay ₹${parseFloat(packageData?.amount).toLocaleString()}`
                                        )}
                                    </Button>

                                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            By completing the payment, you agree to our Terms of Service and Privacy Policy.
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3, opacity: 0.5 }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Visa_2021.svg/100px-Visa_2021.svg.png" height="15" alt="Visa" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/100px-Mastercard-logo.svg.png" height="15" alt="Mastercard" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/100px-UPI-Logo.png" height="15" alt="UPI" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Checkout;
