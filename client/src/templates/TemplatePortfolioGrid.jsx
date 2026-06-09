import React from 'react';
import { Box, Typography, Container, Button, Avatar } from '@mui/material';
import { motion } from 'framer-motion';

const TemplatePortfolioGrid = ({ data }) => {
    const { business = {}, services = [], locations = [] } = data || {};

    const displayName = business.owner?.name || business.business_name || "Modern Professional";
    const firstName = displayName.split(' ')[0];
    const bio = business.description || "Passionate professional providing top-tier services to help you reach your full potential. Specializing in efficient, results-driven workflows that save you time and effort.";

    // Load External Booking Widget Script
    React.useEffect(() => {
        if (data.hideScript) return;
        const scriptId = 'mybookings-widget-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://mybookings.allysoftsolutions.com/widget.js";
            script.dataset.businessId = business.api_key || "pk_live_2a3364a2d6ac4db497371edfbe156dbd";
            script.dataset.theme = "light";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [business.api_key, data.hideScript]);

    const icons = [
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    ];

    return (
        <Box sx={{
            position: 'relative',
            background: 'linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)',
            minHeight: '100vh',
            pb: 10,
            fontFamily: "'Inter', sans-serif",
            color: '#1a1a1a'
        }}>
            <Box
                component={motion.nav}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: { xs: 3, md: 5 },
                    py: 3,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    position: data.isPreview ? 'absolute' : 'sticky',
                    top: 0,
                    zIndex: 100
                }}
            >
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>
                    {firstName}<Box component="span" sx={{ color: '#667eea' }}>.</Box>
                </Typography>
            </Box>

            <Container maxWidth="md" sx={{ pt: 8, pb: 4, textAlign: 'center' }}>
                <Box
                    component={motion.div}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    sx={{
                        position: 'relative',
                        width: { xs: 160, md: 200 },
                        height: { xs: 160, md: 200 },
                        margin: '0 auto 20px',
                    }}
                >
                    <Avatar
                        src={business.owner?.profile_picture}
                        sx={{
                            width: '100%',
                            height: '100%',
                            fontSize: 64,
                            fontWeight: 700,
                            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.25)',
                            border: '6px solid white',
                            bgcolor: '#764ba2'
                        }}
                    >
                        {displayName.charAt(0)}
                    </Avatar>
                    <Box sx={{
                        position: 'absolute',
                        bottom: 5,
                        right: 5,
                        width: 20,
                        height: 20,
                        background: '#22c55e',
                        borderRadius: '50%',
                        border: '4px solid #fff'
                    }} />
                </Box>
                <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Typography variant="h1" sx={{
                        fontSize: 'clamp(2rem, 10cqw, 3.25rem)',
                        fontWeight: 800,
                        letterSpacing: '-1.5px',
                        mb: 2,
                        background: 'linear-gradient(90deg, #111 0%, #555 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {displayName}
                    </Typography>
                    <Typography sx={{ fontSize: 18, color: '#555', lineHeight: 1.6, mb: 3, fontWeight: 400 }}>
                        {bio}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, fontWeight: 500, px: 2, py: 1,
                            borderRadius: 100, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#444'
                        }}>
                            📍 {locations?.[0]?.city || business.city || 'Remote Available'}
                        </Box>
                        {business.business_type && (
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, fontWeight: 500, px: 2, py: 1,
                                borderRadius: 100, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#444'
                            }}>
                                ✨ {business.business_type}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Container>

            <Container maxWidth="lg" sx={{ mt: 8 }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(320px, 1fr))' },
                    gap: 3
                }}>
                    {services.map((service, index) => (
                        <Box
                            key={service.id}
                            component={motion.div}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                            sx={{
                                background: '#ffffff',
                                borderRadius: 6,
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                border: '1px solid rgba(0,0,0,0.04)',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                            }}
                        >
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{
                                    width: 48, height: 48, borderRadius: 2, background: '#f3f4f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, color: '#111'
                                }}>
                                    {icons[index % icons.length]}
                                </Box>
                                <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1.5, letterSpacing: -0.5 }}>
                                    {service.service_name}
                                </Typography>
                                <Typography sx={{ fontSize: 15, color: '#666', lineHeight: 1.6, mb: 4 }}>
                                    {service.description || `A specialized full ${service.duration_minutes} minute immersive session tailored specifically for your needs.`}
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                mt: 'auto', pt: 3, borderTop: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <Box>
                                    <Typography sx={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{service.duration_minutes} min</Typography>
                                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#111' }}>₹{Number(service.price).toLocaleString()}</Typography>
                                </Box>
                                <Button
                                    className="mybookings-trigger"
                                    component={motion.button}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    variant="contained"
                                    sx={{
                                        px: 3, py: 1.2, borderRadius: 50, background: '#111', color: '#fff',
                                        fontSize: 14, fontWeight: 600, textTransform: 'none',
                                        '&:hover': { bgcolor: '#000' }
                                    }}
                                >
                                    Book Now
                                </Button>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Container>

            <Container maxWidth="lg" sx={{ mt: 10 }}>
                <Box
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    sx={{
                        p: { xs: 4, md: 8 },
                        background: 'linear-gradient(135deg, #111 0%, #333 100%)',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: 4, md: 5 },
                        alignItems: 'center',
                        color: '#fff',
                        boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)',
                    }}
                >
                    <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography sx={{ fontSize: { xs: 28, md: 32 }, fontWeight: 800, letterSpacing: -1, mb: 2 }}>
                            Start the journey.
                        </Typography>
                        <Typography sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                            Reach out directly. Responses typically within 24 hours.
                        </Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <Button
                            className="mybookings-trigger"
                            component={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            variant="contained"
                            sx={{
                                background: '#fff', color: '#111', px: 4, py: 2, borderRadius: 50,
                                fontSize: 16, fontWeight: 600, textTransform: 'none', width: '100%',
                                '&:hover': { bgcolor: '#f0f0f0' }
                            }}
                        >
                            Contact Me Now
                        </Button>
                    </Box>
                </Box>
            </Container>

            <Box sx={{ textAlign: 'center', pt: 8, fontSize: 14, color: '#888', fontWeight: 500 }}>
                © {new Date().getFullYear()} {displayName}. Crafted with modern precision.
            </Box>
        </Box>
    );
};

export default TemplatePortfolioGrid;