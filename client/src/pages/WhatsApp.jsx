import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Card, CardContent, Typography, Button,
    CircularProgress, Alert, Chip, Divider, Paper,
    Stack, IconButton, Tooltip, Zoom, Fade, Avatar,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
    WhatsApp as WhatsAppIcon,
    CheckCircle as ConnectedIcon,
    Error as DisconnectedIcon,
    Sync as SyncIcon,
    Timer as TimerIcon,
    Smartphone as PhoneIcon,
    Business as BusinessIcon,
    Send as SendIcon,
    NotificationsActive as AlertIcon,
    History as HistoryIcon,
    Verified as VerifiedIcon,
    Settings as SettingsIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';
import { useBusiness } from '../context/BusinessContext';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';

const WhatsApp = () => {
    const { businesses, selectedBusinessId } = useBusiness();
    const [status, setStatus] = useState('disconnected'); // disconnected, connecting, ready, connected
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState(null);
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);

    // Filter businesses based on selectedBusinessId
    const currentBusiness = businesses.find(b => String(b.id) === String(selectedBusinessId));

    const fetchStatus = useCallback(async () => {
        if (!selectedBusinessId || selectedBusinessId === 'all') return;

        try {
            const res = await axiosInstance.get(`/business/whatsapp/status/${selectedBusinessId}`);
            if (res.data.success) {
                setStatus(res.data.status);
            }
        } catch (err) {
            console.error('Failed to fetch status:', err);
        }
    }, [selectedBusinessId]);

    useEffect(() => {
        if (selectedBusinessId && selectedBusinessId !== 'all') {
            fetchStatus();
        }
    }, [selectedBusinessId, fetchStatus]);

    // Countdown timer for QR
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && qrCode) {
            setQrCode(null);
            setStatus('disconnected');
        }
    }, [countdown, qrCode]);

    // Polling status when QR is active
    useEffect(() => {
        let interval;
        // Only start polling if we have a QR and are waiting for connection
        if (qrCode && status === 'ready') {
            interval = setInterval(async () => {
                try {
                    const res = await axiosInstance.get(`/business/whatsapp/status/${selectedBusinessId}`);
                    // Only stop and set connected if the gateway confirms it
                    if (res.data.status === 'connected') {
                        setStatus('connected');
                        setQrCode(null);
                        setCountdown(0);
                        toast.success('WhatsApp Connected Successfully!');
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [qrCode, status, selectedBusinessId]);

    const handleLink = async () => {
        if (!selectedBusinessId || selectedBusinessId === 'all') {
            toast.error('Please select a specific business to link WhatsApp.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.post(`/business/whatsapp/initiate/${selectedBusinessId}`);
            if (res.data.success) {
                if (res.data.status === 'connected') {
                    setStatus('connected');
                    toast.success('WhatsApp is already connected!');
                } else if (res.data.qr) {
                    setQrCode(res.data.qr);
                    setStatus('ready');
                    setCountdown(40); // 40 seconds as per WA-Mitra docs
                }
            } else {
                setError(res.data.message || 'Failed to initiate WhatsApp session.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while connecting.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.post(`/business/whatsapp/disconnect/${selectedBusinessId}`);
            if (res.data.success) {
                setStatus('disconnected');
                setQrCode(null);
                toast.success('WhatsApp Disconnected!');
            }
        } catch (err) {
            toast.error('Failed to disconnect. Please try again.');
        } finally {
            setLoading(false);
            setConfirmDisconnect(false);
        }
    };

    if (!selectedBusinessId || selectedBusinessId === 'all') {
        return (
            <PageTransition>
                <PageHeader title="WhatsApp Integration" subtitle="Automate your customer notifications." />
                <Box sx={{ mt: 8, textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Please select a business from the sidebar to manage its WhatsApp integration.</Typography>
                </Box>
            </PageTransition>
        );
    }

    const FeatureItem = ({ icon: Icon, title, desc }) => (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                    borderColor: 'primary.main'
                }
            }}
        >
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(37, 211, 102, 0.1)',
                    color: '#25D366'
                }}>
                    <Icon fontSize="small" />
                </Box>
                <Box>
                    <Typography variant="subtitle2" fontWeight={800} mb={0.5}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>{desc}</Typography>
                </Box>
            </Stack>
        </Paper>
    );

    return (
        <PageTransition>
            <PageHeader
                title="WhatsApp Integration"
                subtitle={`Global Business Notifications for ${currentBusiness?.business_name}.`}
            />

            <Box sx={{ position: 'relative', mt: 2 }}>
                {/* Background Glows */}
                <Box sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, rgba(37, 211, 102, 0.08) 0%, rgba(37, 211, 102, 0) 70%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />

                <Stack spacing={4}>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'stretch' }}>
                        {/* Main Status Card */}
                        <Box sx={{ flex: '1 1 500px' }}>
                            <Card sx={{
                                borderRadius: 6,
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden',
                                height: '100%',
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.02)',
                                backdropFilter: 'blur(20px)'
                            }}>
                                <Box sx={{
                                    height: 6,
                                    width: '100%',
                                    background: status === 'connected' ? '#25D366' : 'rgba(255,255,255,0.1)'
                                }} />
                                <CardContent sx={{ p: 5 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={5}>
                                        <Stack direction="row" spacing={3} alignItems="center">
                                            <Box sx={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 4,
                                                bgcolor: 'rgba(37, 211, 102, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: 'inset 0 0 20px rgba(37, 211, 102, 0.1)'
                                            }}>
                                                <WhatsAppIcon sx={{ fontSize: 36, color: '#25D366' }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h5" fontWeight={900} mb={0.5}>WhatsApp Gateway</Typography>
                                                <Typography variant="body2" color="text.secondary">Powered by Enterprise Mitra Engine</Typography>
                                            </Box>
                                        </Stack>
                                        <Chip
                                            label={status === 'connected' ? 'LIVE' : status.toUpperCase()}
                                            sx={{
                                                borderRadius: 2,
                                                height: 32,
                                                fontWeight: 900,
                                                fontSize: '0.7rem',
                                                letterSpacing: 1,
                                                bgcolor: status === 'connected' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(255,255,255,0.05)',
                                                color: status === 'connected' ? '#25D366' : 'text.secondary',
                                                border: '1px solid',
                                                borderColor: status === 'connected' ? 'rgba(37, 211, 102, 0.3)' : 'divider'
                                            }}
                                        />
                                    </Stack>

                                    {status === 'connected' ? (
                                        <Fade in={true}>
                                            <Box>
                                                <Box sx={{
                                                    p: 4,
                                                    borderRadius: 5,
                                                    bgcolor: 'rgba(37, 211, 102, 0.03)',
                                                    border: '1px dashed rgba(37, 211, 102, 0.3)',
                                                    textAlign: 'center',
                                                    mb: 5
                                                }}>
                                                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                                                        <Box className="pulse" sx={{
                                                            position: 'absolute',
                                                            top: 0, left: 0, right: 0, bottom: 0,
                                                            borderRadius: '50%',
                                                            border: '2px solid #25D366',
                                                            animation: 'pulse-animation 2s infinite'
                                                        }} />
                                                        <Avatar sx={{ bgcolor: '#25D366', width: 64, height: 64, boxShadow: '0 0 20px rgba(37, 211, 102, 0.4)' }}>
                                                            <VerifiedIcon sx={{ fontSize: 32 }} />
                                                        </Avatar>
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={800} gutterBottom>Enterprise Account Linked</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Automated business notifications are now actively broadcasting from your number.
                                                    </Typography>
                                                </Box>


                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    disabled={loading}
                                                    onClick={() => setConfirmDisconnect(true)}
                                                    sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
                                                >
                                                    {loading ? 'Disconnecting...' : 'Disconnect'}
                                                </Button>
                                            </Box>
                                        </Fade>
                                    ) : (
                                        <Box>
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.8 }}>
                                                Unlock real-time engagement. Link your professional WhatsApp account to send instant booking confirmations, payment receipts, and automated staff alerts.
                                            </Typography>

                                            <Stack spacing={2} mb={5}>
                                                <FeatureItem
                                                    icon={SendIcon}
                                                    title="Instant Confirmation"
                                                    desc="Send automated booking details to customers as soon as they book."
                                                />
                                                <FeatureItem
                                                    icon={AlertIcon}
                                                    title="Staff Broadcasts"
                                                    desc="Notify your team instantly about new or modified appointments."
                                                />
                                            </Stack>

                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                disabled={loading || qrCode}
                                                onClick={handleLink}
                                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <WhatsAppIcon />}
                                                sx={{
                                                    py: 2,
                                                    borderRadius: 4,
                                                    fontWeight: 900,
                                                    textTransform: 'none',
                                                    fontSize: '1rem',
                                                    boxShadow: '0 10px 30px rgba(37, 211, 102, 0.2)',
                                                    background: 'linear-gradient(90deg, #25D366 0%, #1ea851 100%)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(90deg, #1ea851 0%, #25D366 100%)',
                                                    }
                                                }}
                                            >
                                                {loading ? 'Initializing Session...' : 'Establish Secure Connection'}
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>

                        {/* QR Code / Secondary Card */}
                        <Box sx={{ flex: '1 1 320px' }}>
                            <Card sx={{
                                borderRadius: 6,
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                                background: 'rgba(255, 255, 255, 0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                ...(qrCode && { boxShadow: '0 20px 80px rgba(37, 211, 102, 0.15)', borderColor: 'rgba(37, 211, 102, 0.3)' })
                            }}>
                                <CardContent sx={{ textAlign: 'center', p: 5, width: '100%' }}>
                                    {qrCode ? (
                                        <Fade in={true}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={900} mb={1}>Sync to Phone</Typography>
                                                <Typography variant="caption" color="text.secondary" mb={4} display="block">Scan this code using WhatsApp &gt; Linked Devices</Typography>

                                                <Paper elevation={0} sx={{
                                                    p: 2.5,
                                                    bgcolor: 'white',
                                                    display: 'inline-block',
                                                    borderRadius: 5,
                                                    mb: 4,
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                                    position: 'relative'
                                                }}>
                                                    <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 220, height: 220, display: 'block', borderRadius: 8 }} />
                                                    {countdown < 10 && (
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            top: 0, left: 0, right: 0, bottom: 0,
                                                            bgcolor: 'rgba(255,255,255,0.8)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            borderRadius: 5,
                                                            backdropFilter: 'blur(2px)'
                                                        }}>
                                                            <Typography variant="h1" fontWeight={900} color="error.main">{countdown}</Typography>
                                                        </Box>
                                                    )}
                                                </Paper>

                                                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center"
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 3,
                                                        bgcolor: 'rgba(255,255,255,0.05)',
                                                        width: 'fit-content',
                                                        margin: '0 auto'
                                                    }}>
                                                    <TimerIcon sx={{ fontSize: 18, color: countdown < 10 ? 'error.main' : '#25D366' }} />
                                                    <Typography variant="subtitle2" fontWeight={900} color={countdown < 10 ? 'error.main' : 'text.primary'}>
                                                        {countdown}s remaining
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        </Fade>
                                    ) : status === 'connected' ? (
                                        <Box sx={{ opacity: 0.8 }}>
                                            <Box sx={{ mb: 4, position: 'relative', display: 'inline-block' }}>
                                                <WhatsAppIcon sx={{ fontSize: 120, color: '#25D366', filter: 'drop-shadow(0 0 20px rgba(37, 211, 102, 0.4))' }} />
                                            </Box>
                                            <Typography variant="h6" fontWeight={900}>Interface Active</Typography>
                                            <Typography variant="body2" color="text.secondary">Receiving and dispatching signals.</Typography>

                                            <Stack spacing={2} sx={{ mt: 5, textAlign: 'left' }}>

                                                <Button
                                                    startIcon={<RefreshIcon />}
                                                    fullWidth
                                                    size="small"
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                                    onClick={fetchStatus}
                                                >
                                                    Verify Connection Status
                                                </Button>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Box sx={{ opacity: 0.2, filter: 'grayscale(1)' }}>
                                            <WhatsAppIcon sx={{ fontSize: 140, mb: 3 }} />
                                            <Typography variant="h6" fontWeight={900}>Awaiting Initiation</Typography>
                                            <Typography variant="caption">Session state: Idle</Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>

                </Stack>
            </Box>

            <Dialog
                open={confirmDisconnect}
                onClose={() => !loading && setConfirmDisconnect(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 5,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        border: '1px solid',
                        borderColor: 'divider',
                        maxWidth: 400
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, pt: 3 }}>Disconnect WhatsApp?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        This will permanently remove your WhatsApp link for <strong>{currentBusiness?.business_name}</strong>. 
                        Notifications for bookings and staff alerts will stop immediately.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={() => setConfirmDisconnect(false)} 
                        disabled={loading}
                        sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                    >
                        Keep Connected
                    </Button>
                    <Button 
                        onClick={handleDisconnect} 
                        color="error" 
                        variant="contained"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={16} color="inherit" />}
                        sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', px: 3 }}
                    >
                        {loading ? 'Disconnecting...' : 'Yes, Disconnect'}
                    </Button>
                </DialogActions>
            </Dialog>

            <style>
                {`
                @keyframes pulse-animation {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                `}
            </style>
        </PageTransition>
    );
};

export default WhatsApp;
