import React, { useState } from 'react';
import {
    Container, Box, Typography, Button, Card, CardContent,
    Avatar, Chip, Divider, IconButton, Stack
} from '@mui/material';
import {
    Star as StarIcon,
    Verified as VerifiedIcon,
    ArrowForward as ArrowIcon,
    Instagram as InstagramIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
// External Booking Widget Script replaced local BookingWidget import

const TemplatePremium = ({ data }) => {
    const { business = {}, services = [], locations = [] } = data || {};

    // Load External Booking Widget Script (Disabled during internal previews to avoid OAuth context conflicts)
    React.useEffect(() => {
        if (data.hideScript) return;
        const scriptId = 'mybookings-widget-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://mybookings.allysoftsolutions.com/widget.js";
            script.dataset.businessId = business.api_key || "pk_live_2a3364a2d6ac4db497371edfbe156dbd";
            script.dataset.theme = "dark";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [business.api_key, data.hideScript]);

    return (
        <Box sx={{ position: 'relative', bgcolor: '#020617', minHeight: '100vh', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
            {/* Hero Section */}
            <Box sx={{
                height: '85vh',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                background: 'linear-gradient(rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 1)), url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden'
            }}>
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Box sx={{ maxWidth: 700 }}>
                            <Chip
                                label="Exclusive Preview"
                                size="small"
                                sx={{
                                    mb: 3,
                                    bgcolor: 'rgba(56, 189, 248, 0.1)',
                                    color: '#38bdf8',
                                    borderColor: 'rgba(56, 189, 248, 0.2)',
                                    fontWeight: 700,
                                    borderRadius: 1,
                                    textTransform: 'uppercase',
                                    letterSpacing: 2,
                                    fontSize: '0.65rem'
                                }}
                            />
                            <Typography variant="h1" fontWeight={900} sx={{ fontSize: 'clamp(2.5rem, 15cqw, 5.5rem)', mb: 3, lineHeight: 1, color: '#fff', letterSpacing: -2 }}>
                                {business.business_name}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#94a3b8', mb: 6, fontWeight: 400, fontSize: '1.1rem', lineHeight: 1.7, maxWidth: 600 }}>
                                {business.description || `Experience unparalleled ${business.business_type?.toLowerCase() || 'service'} excellence. Bespoke solutions tailored for your professional needs.`}
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                className="mybookings-trigger"
                                endIcon={<ArrowIcon />}
                                sx={{
                                    bgcolor: '#38bdf8',
                                    color: '#020617',
                                    px: 5, py: 2.2,
                                    borderRadius: 0,
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                                    '&:hover': { bgcolor: '#fff', transform: 'translateY(-2px)', color: '#020617' },
                                    transition: 'all 0.3s'
                                }}
                            >
                                Explore
                            </Button>
                        </Box>
                    </motion.div>
                </Container>

                {/* Decorative Elements */}
                <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </Box>

            {/* Content Section */}
            <Container maxWidth="lg" sx={{ py: 15 }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 10 
                }}>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <Typography variant="h4" fontWeight={900} gutterBottom sx={{ mb: 6, letterSpacing: -1 }}>
                                Our Specialized Services
                            </Typography>
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 4 
                            }}>
                                {services.map((svc, idx) => (
                                    <Box key={svc.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        >
                                            <Card sx={{
                                                bgcolor: 'rgba(30, 41, 59, 0.3)',
                                                color: '#fff',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: 4,
                                                backdropFilter: 'blur(12px)',
                                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                '&:hover': {
                                                    transform: 'translateY(-8px) scale(1.02)',
                                                    borderColor: 'rgba(56, 189, 248, 0.5)',
                                                    bgcolor: 'rgba(56, 189, 248, 0.05)',
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                                                }
                                            }}>
                                                <CardContent sx={{ p: 4 }}>
                                                    <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#fff' }}>
                                                        {svc.service_name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontWeight: 500 }}>
                                                        Duration • {svc.duration_minutes} min
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="h5" fontWeight={900} sx={{ color: '#38bdf8' }}>
                                                            ₹{svc.price}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            className="mybookings-trigger"
                                                            sx={{
                                                                color: '#38bdf8',
                                                                bgcolor: 'rgba(56, 189, 248, 0.1)',
                                                                '&:hover': { bgcolor: '#38bdf8', color: '#020617' }
                                                            }}
                                                        >

                                                        </IconButton>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    </Box>
                                ))}
                            </Box>
                        </motion.div>
                    </Box>

                    <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 320px' } }}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Box sx={{
                                p: 5,
                                bgcolor: 'rgba(15, 23, 42, 0.5)',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(20px)',
                                position: 'sticky',
                                top: 40
                            }}>
                                <Typography variant="h5" fontWeight={900} gutterBottom sx={{ mb: 4 }}>
                                    Visit & Contact
                                </Typography>

                                <Box sx={{ mb: 6 }}>
                                    {locations.map(loc => (
                                        <Box key={loc.id} sx={{ mb: 4 }}>
                                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff', mb: 1 }}>{loc.location_name}</Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                                                {loc.address}, {loc.city}<br />
                                                {loc.state}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.05)' }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1 }}>Phone</Typography>
                                        <Typography variant="body1" sx={{ color: '#fff' }}>{business.phone || 'Private'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1 }}>Email</Typography>
                                        <Typography variant="body1" sx={{ color: '#fff' }}>{business.email || 'Private'}</Typography>
                                    </Box>
                                </Box>

                                <Stack direction="row" spacing={2} sx={{ mt: 6 }}>
                                    {[InstagramIcon, FacebookIcon, TwitterIcon].map((Icon, i) => (
                                        <IconButton key={i} sx={{ color: '#64748b', bgcolor: 'rgba(255,255,255,0.03)', '&:hover': { color: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.1)' } }}>
                                            <Icon fontSize="small" />
                                        </IconButton>
                                    ))}
                                </Stack>
                            </Box>
                        </motion.div>
                    </Box>
                </Box>
            </Container>

        </Box>
    );
};

export default TemplatePremium;
