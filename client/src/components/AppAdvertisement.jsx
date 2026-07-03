import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Collapse, Button } from '@mui/material';
import {
    Close,
    PhoneIphone,
    QrCode2,
    Bolt,
    NotificationsActiveOutlined,
    WifiOff
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const APP_URL = 'https://play.google.com/store/apps/details?id=com.allysoftsolutions.mybookings';
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(APP_URL)}`;

const FEATURES = [
    { icon: Bolt, label: 'Faster booking' },
    { icon: NotificationsActiveOutlined, label: 'Live alerts' },
    { icon: WifiOff, label: 'Works offline' }
];

// 'closed'    -> never render this session (user opted out permanently)
// 'minimized' -> small pulsing pill, tap to reopen
// 'open'      -> full card
const AppAdvertisement = () => {
    const [view, setView] = useState('closed');
    const [showQr, setShowQr] = useState(false);

    useEffect(() => {
        const dismissed = sessionStorage.getItem('appAdDismissed');
        if (dismissed) return;
        const timer = setTimeout(() => setView('open'), 800);
        return () => clearTimeout(timer);
    }, []);

    const minimize = () => setView('minimized');
    const reopen = () => setView('open');
    const dismissForSession = () => {
        sessionStorage.setItem('appAdDismissed', 'true');
        setView('closed');
    };

    if (view === 'closed') return null;

    return (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            <AnimatePresence mode="wait">
                {view === 'minimized' ? (
                    <Box
                        key="pill-wrapper"
                        component={motion.div}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                        sx={{ position: 'relative' }}
                    >
                        <Box
                            layoutId="app-ad-shell"
                            component={motion.div}
                            onClick={reopen}
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                boxShadow: '0 8px 24px -4px rgba(168, 85, 247, 0.6)',
                                color: 'white',
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    border: '2px solid rgba(168, 85, 247, 0.6)',
                                    animation: 'ring 2.2s infinite'
                                },
                                '@keyframes ring': {
                                    '0%': { transform: 'scale(1)', opacity: 0.8 },
                                    '100%': { transform: 'scale(1.8)', opacity: 0 }
                                }
                            }}
                        >
                            <PhoneIphone fontSize="small" />
                        </Box>
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); dismissForSession(); }}
                            sx={{
                                position: 'absolute',
                                top: -2, right: -6,
                                width: 22, height: 22,
                                bgcolor: '#1e1b4b',
                                color: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: '#0f172a', color: 'white', borderColor: 'rgba(255,255,255,0.5)' },
                                zIndex: 10
                            }}
                        >
                            <Close sx={{ fontSize: 13 }} />
                        </IconButton>
                    </Box>
                ) : (
                    <Box
                        key="card"
                        component={motion.div}
                        layoutId="app-ad-shell"
                        initial={{ y: 60, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        sx={{ width: 'max-content', maxWidth: 'calc(100vw - 48px)', position: 'relative' }}
                    >
                        {/* Glowing pulse backdrop */}
                        <Box sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(45deg, #6366f1, #a855f7, #ec4899)',
                            filter: 'blur(14px)',
                            opacity: 0.4,
                            borderRadius: '18px',
                            zIndex: -1,
                            animation: 'pulse 3s infinite',
                            '@keyframes pulse': {
                                '0%': { opacity: 0.3 },
                                '50%': { opacity: 0.6 },
                                '100%': { opacity: 0.3 }
                            }
                        }} />

                        <Box sx={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                            borderRadius: '18px',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.8)',
                            position: 'relative',
                            overflow: 'hidden',
                            p: 2.25,
                            width: { xs: 300, sm: 360 }
                        }}>
                            {/* Shimmer sweep */}
                            <Box sx={{
                                position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                                transform: 'skewX(-20deg)',
                                animation: 'shimmer 5s infinite',
                                '@keyframes shimmer': {
                                    '0%': { left: '-100%' },
                                    '25%': { left: '200%' },
                                    '100%': { left: '200%' }
                                }
                            }} />

                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, zIndex: 1, position: 'relative' }}>
                                <Box
                                    component={motion.div}
                                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                    sx={{
                                        width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
                                    }}
                                >
                                    <PhoneIphone fontSize="small" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'white', lineHeight: 1.2, fontSize: '0.95rem' }}>
                                        Also available in Mobile App </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                        Get the MyBookings app
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={minimize}
                                    size="small"
                                    aria-label="Minimize"
                                    sx={{ color: 'rgba(255,255,255,0.5)', mt: -0.5, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)' } }}
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            </Box>

                            {/* Feature row */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1.75, zIndex: 1, position: 'relative' }}>
                                {FEATURES.map(({ icon: Icon, label }) => (
                                    <Box
                                        key={label}
                                        sx={{
                                            flex: 1,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                                            py: 1, borderRadius: '10px',
                                            bgcolor: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.06)'
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 18, color: '#c4b5fd' }} />
                                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.1 }}>
                                            {label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* CTA row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.75, zIndex: 1, position: 'relative' }}>
                                <Button
                                    href={APP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    fullWidth
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        color: 'white',
                                        borderRadius: '10px',
                                        py: 1,
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)' }
                                    }}
                                >
                                    Get it on Google Play
                                </Button>
                                <IconButton
                                    onClick={() => setShowQr((v) => !v)}
                                    aria-label="Show QR code"
                                    size="small"
                                    sx={{
                                        color: showQr ? '#fff' : 'rgba(255,255,255,0.55)',
                                        bgcolor: showQr ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255,255,255,0.06)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.3)' }
                                    }}
                                >
                                    <QrCode2 fontSize="small" />
                                </IconButton>
                            </Box>

                            {/* QR reveal */}
                            <Collapse in={showQr}>
                                <Box sx={{
                                    mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
                                    p: 1.25, borderRadius: '12px',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)'
                                }}>
                                    <Box sx={{ bgcolor: 'white', p: 0.5, borderRadius: '8px', flexShrink: 0, lineHeight: 0 }}>
                                        <img src={QR_SRC} alt="QR code to download the app" width={64} height={64} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                        Scan with your phone's camera to open the Play Store listing.
                                    </Typography>
                                </Box>
                            </Collapse>

                            {/* Footer */}
                            <Typography
                                onClick={dismissForSession}
                                sx={{
                                    mt: 1.5, fontSize: '0.68rem', textAlign: 'center', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.4)', zIndex: 1, position: 'relative',
                                    '&:hover': { color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }
                                }}
                            >
                                Don't show this again
                            </Typography>
                        </Box>
                    </Box>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default AppAdvertisement;