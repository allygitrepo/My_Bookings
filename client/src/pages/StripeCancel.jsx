import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';

const StripeCancel = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('booking_id');

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a', p: 3 }}>
            <Paper sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 4, textAlign: 'center', bgcolor: '#1e293b', color: 'white' }}>
                <CancelIcon sx={{ fontSize: 72, color: '#EF4444', mb: 2 }} />
                <Typography variant="h5" fontWeight={900} gutterBottom>Payment Cancelled</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: '#94a3b8', mb: 3 }}>
                    You cancelled the transaction on Stripe's Official Checkout page. Booking #{bookingId || ''} was not completed.
                </Typography>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/bookings')}
                    sx={{ borderRadius: 2.5, py: 1.3, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 800 }}
                >
                    Back to Bookings
                </Button>
            </Paper>
        </Box>
    );
};

export default StripeCancel;
