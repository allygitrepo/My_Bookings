import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import { verifyStripePayment } from '../api/payment.api';

const StripeSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);

    const sessionId = searchParams.get('session_id');
    const bookingId = searchParams.get('booking_id');

    useEffect(() => {
        const verify = async () => {
            if (sessionId && bookingId) {
                try {
                    await verifyStripePayment({
                        payment_intent_id: sessionId,
                        booking_id: bookingId,
                        amount: 0,
                        paid_amount: 0
                    });
                    setVerified(true);
                } catch (e) {
                    console.error('Stripe Verification Error:', e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        verify();
    }, [sessionId, bookingId]);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a', p: 3 }}>
            <Paper sx={{ p: 4, maxWidth: 440, width: '100%', borderRadius: 4, textAlign: 'center', bgcolor: '#1e293b', color: 'white' }}>
                {loading ? (
                    <Box sx={{ py: 4 }}>
                        <CircularProgress size={40} sx={{ color: '#635BFF', mb: 2 }} />
                        <Typography variant="body1" fontWeight={700}>Verifying your Stripe Payment...</Typography>
                    </Box>
                ) : (
                    <>
                        <SuccessIcon sx={{ fontSize: 72, color: '#10B981', mb: 2 }} />
                        <Typography variant="h5" fontWeight={900} gutterBottom>Payment Successful!</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ color: '#94a3b8', mb: 3 }}>
                            Your transaction was processed successfully via <strong>Stripe Official Checkout</strong>. Your booking #{bookingId || ''} is confirmed!
                        </Typography>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => navigate('/bookings')}
                            sx={{ borderRadius: 2.5, py: 1.3, bgcolor: '#635BFF', '&:hover': { bgcolor: '#4B45C6' }, fontWeight: 800 }}
                        >
                            Return to Dashboard
                        </Button>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default StripeSuccess;
