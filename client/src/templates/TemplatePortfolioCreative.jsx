import React from 'react';
import {
    Box, Container, Typography, Button, Stack,
    useTheme, Chip, IconButton
} from '@mui/material';
import {
    Language as GlobeIcon,
    NorthEast as ArrowUpIcon,
    Star as StarIcon,
    PlayArrowRounded as PlayIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { motion, useScroll, useTransform } from 'framer-motion';

const TemplatePortfolioCreative = ({ data }) => {
    const theme = useTheme();
    const { business = {}, services = [], locations = [] } = data || {};

    const displayName = business.owner?.name || business.business_name || "Creative Professional";
    const bio = business.description || "Experimental professional merging logic with creativity to deliver exceptional value. We don't just provide services; we build partnerships that drive meaningful transformation.";

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

    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const opacity1 = useTransform(scrollY, [0, 500], [1, 0]);

    // Vibrant gradients
    const gradientBg = "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)";
    const textGradient = {
        background: "linear-gradient(90deg, #1f1f1f 0%, #5e5e5e 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    };

    return (
        <Box sx={{ position: 'relative', bgcolor: '#fafafa', color: '#111', minHeight: '100vh', overflow: 'hidden', fontFamily: "'Clash Display', 'Inter', sans-serif" }}>

            {/* Nav */}
            <Box component={motion.nav} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
                sx={{ display: 'flex', justifyContent: 'space-between', p: { xs: 3, md: 5 }, position: 'absolute', width: '100%', zIndex: 10 }}>
                <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
                    {displayName.split(' ')[0].toUpperCase()}<span style={{ color: '#FF6B6B' }}>.</span>
                </Typography>

            </Box>

            {/* Split Hero Section */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', pt: { xs: 12, md: 0 } }}>
                <Box sx={{ 
                    flex: { xs: '1 1 100%', md: '1 1 50%' }, 
                    position: 'relative', 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: { xs: 4, md: 6 }, 
                    zIndex: 2 
                }}>

                    {/* Decorative blobs */}
                    <Box component={motion.div} animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        sx={{ position: 'absolute', top: '10%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(78,205,196,0.3) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: -1 }} />
                    <Box component={motion.div} animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        sx={{ position: 'absolute', bottom: '10%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,107,0.2) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(50px)', zIndex: -1 }} />

                    <Box>
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, staggerChildren: 0.2 }}>

                            <Chip
                                label="Creative Partner"
                                sx={{ mb: 4, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.05)', color: '#111', borderRadius: '8px' }}
                            />

                            <motion.div style={{ y: y1, opacity: opacity1 }}>
                                <Typography variant="h1" sx={{
                                    fontSize: 'clamp(2.5rem, 15cqw, 5.5rem)',
                                    fontWeight: 900,
                                    lineHeight: 0.9,
                                    letterSpacing: '-0.04em',
                                    mb: 5,
                                    textTransform: 'none'
                                }}>
                                    <span style={textGradient}>{displayName}</span>
                                </Typography>
                            </motion.div>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 300px' } }}>
                                    <Typography variant="body1" sx={{ fontSize: '1.25rem', lineHeight: 1.7, color: '#555', fontWeight: 500 }}>
                                        {bio}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    flex: { xs: '1 1 100%', sm: '0 1 auto' },
                                    display: 'flex',
                                    gap: 2,
                                    alignItems: 'center'
                                }}>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            background: '#111',
                                            color: 'white',
                                            borderRadius: '14px',
                                            px: 4,
                                            py: 1.8,
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            textTransform: 'none',
                                            boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                                            '&:hover': {
                                                background: '#000',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                        onClick={() => document.getElementById('work-section').scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Explore
                                    </Button>
                                </Box>
                            </Box>
                        </motion.div>
                    </Box>
                </Box>

                <Box sx={{
                    flex: { xs: '1 1 100%', md: '0 1 40%' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    p: { xs: 4, md: 6 },
                    transition: 'all .4s ease',
                    '&:hover': {
                        transform: 'translateY(-6px)'
                    }
                }}>
                    {business.owner?.profile_picture && (
                        <Box
                            component="img"
                            src={business.owner.profile_picture}
                            sx={{
                                width: { xs: 240, md: 320, lg: 380 },
                                height: { xs: 240, md: 320, lg: 380 },
                                objectFit: 'cover',
                                borderRadius: '50%',
                                boxShadow: '0 30px 70px rgba(0,0,0,0.15)',
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Featured Services */}
            <Box id="work-section" sx={{ py: { xs: 10, md: 20 }, bgcolor: '#111', color: 'white', borderTopRightRadius: { xs: 0, md: '80px' }, mt: -5, position: 'relative', zIndex: 10 }}>
                <Container maxWidth="xl">
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }} sx={{ mb: 10, gap: 4 }}>
                        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                            <Typography variant="h2" sx={{ fontWeight: 900, fontSize: { xs: '3rem', md: '5rem' }, letterSpacing: '-0.03em', lineHeight: 1 }}>
                                Services<br /><span style={{ color: '#FF6B6B' }}>Offered.</span>
                            </Typography>
                        </motion.div>
                        <Typography sx={{ fontWeight: 600, color: '#888', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.875rem' }}>* SCROLL TO EXPLORE</Typography>
                    </Stack>

                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                        gap: 4 
                    }}>
                        {services.map((service, index) => (
                            <Box key={service.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    whileHover={{ y: -10 }}
                                >
                                    <Box sx={{
                                        p: 6,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover .hover-bg': { opacity: 1 }
                                    }}>
                                        <Box className="hover-bg" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(78,205,196,0.1) 100%)', opacity: 0, transition: 'opacity 0.4s ease', zIndex: 0 }} />

                                        <Box sx={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ color: '#FF6B6B', fontWeight: 800, mb: 4, fontFamily: 'monospace' }}>
                                                0{index + 1}
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, letterSpacing: -1 }}>
                                                {service.service_name}
                                            </Typography>
                                            <Typography sx={{ color: '#aaa', fontWeight: 400, lineHeight: 1.6, mb: 6 }}>
                                                {service.description || "A specialized, high-impact solution engineered for extraordinary results and sustainable long-term value."}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 'auto' }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>Investment</Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 900 }}>₹{Number(service.price).toLocaleString()}</Typography>
                                            </Box>
                                            <IconButton sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#FF6B6B', color: 'white' } }}>
                                                <ArrowUpIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 10, bgcolor: '#0a0a0a', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: '#FF6B6B', filter: 'blur(150px)', opacity: 0.2 }} />

                <Container maxWidth="lg">
                    <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 8, 
                        alignItems: 'center' 
                    }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}>
                            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, letterSpacing: -2, fontSize: { xs: '3rem', md: '5rem' } }}>
                                Ready to <span style={{ color: '#4ECDC4' }}>launch?</span>
                            </Typography>
                            <Typography sx={{ color: '#888', fontSize: '1.25rem', fontWeight: 500 }}>
                                Based in {locations?.[0]?.city || business.city || 'your city'}. Partnering with visionaries worldwide.
                            </Typography>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 auto' }, textAlign: { md: 'right' } }}>
                            <Button
                                variant="outlined"
                                sx={{ borderRadius: 50, borderColor: 'rgba(255,255,255,0.2)', color: 'white', px: 4, py: 2, mb: 4, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                            >
                                {business.email || 'hello@example.com'}
                            </Button>
                            <Typography sx={{ color: '#555', fontSize: '0.9rem', fontWeight: 500 }}>
                                © {new Date().getFullYear()} {displayName}. All rights reserved.<br />
                                <span style={{ opacity: 0.5 }}>Made possible by MyBookings.</span>
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default TemplatePortfolioCreative;
