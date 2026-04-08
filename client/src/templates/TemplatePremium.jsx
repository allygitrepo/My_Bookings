import React, { useState } from 'react';
import {
    Container, Box, Typography, Button, Grid, Card, CardContent,
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

    return (
        <Box sx={{ bgcolor: '#020617', minHeight: '100vh', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
            {/* Hero Section */}
            <Box sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                background: 'linear-gradient(rgba(2, 6, 23, 0.4), rgba(2, 6, 23, 0.9)), url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden'
            }}>
                <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Box sx={{ maxWidth: 1000 }}>
                            <Chip
                                label="THE GOLD STANDARD"
                                size="small"
                                sx={{
                                    mb: 5,
                                    bgcolor: 'rgba(56, 189, 248, 0.2)',
                                    color: '#38bdf8',
                                    borderColor: 'rgba(56, 189, 248, 0.4)',
                                    fontWeight: 900,
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: 4,
                                    fontSize: '0.8rem',
                                    px: 2, height: 32
                                }}
                            />
                            <Typography variant="h1" fontWeight={900} sx={{ 
                                fontSize: { xs: '4.5rem', md: '9.5rem' }, 
                                mb: 4, 
                                lineHeight: 0.85, 
                                color: '#fff', 
                                letterSpacing: -5 
                            }}>
                                {business.business_name || 'Prestige'}
                            </Typography>
                            <Typography variant="h6" sx={{ 
                                color: 'rgba(148, 163, 184, 0.9)', 
                                mb: 10, 
                                fontWeight: 400, 
                                fontSize: '1.6rem', 
                                lineHeight: 1.6, 
                                maxWidth: 750,
                                letterSpacing: '0.5px'
                            }}>
                                Unparalleled excellence in {business.business_type?.toLowerCase() || 'professional services'}. We define the new benchmark of luxury and distinction.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                className="mybookings-trigger"
                                endIcon={<ArrowIcon sx={{ fontSize: 32 }} />}
                                sx={{
                                    bgcolor: '#38bdf8',
                                    color: '#020617',
                                    px: 10, py: 3.5,
                                    borderRadius: '6px',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    fontSize: '1.15rem',
                                    letterSpacing: 3,
                                    boxShadow: '0 25px 50px rgba(56, 189, 248, 0.3)',
                                    '&:hover': { 
                                        bgcolor: '#fff', 
                                        transform: 'translateY(-6px)', 
                                        color: '#020617',
                                        boxShadow: '0 40px 80px rgba(56, 189, 248, 0.5)'
                                    },
                                    transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)'
                                }}
                            >
                                Start Your Journey
                            </Button>
                        </Box>
                    </motion.div>
                </Container>

                {/* Decorative Elements */}
                <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </Box>

            {/* Content Section */}
            <Container maxWidth="xl" sx={{ py: { xs: 10, md: 24 } }}>
                <Grid container spacing={10}>
                    <Grid item xs={12} md={8}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <Typography variant="h2" fontWeight={900} gutterBottom sx={{ 
                                fontSize: { xs: '2.5rem', md: '4.5rem' }, 
                                mb: 8, 
                                letterSpacing: -2 
                            }}>
                                Our Specialized Services
                            </Typography>
                            <Grid container spacing={4}>
                                {services.map((svc, idx) => (
                                    <Grid item xs={12} sm={6} key={svc.id}>
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
                                                <CardContent sx={{ p: 5 }}>
                                                    <Typography variant="h5" fontWeight={900} gutterBottom sx={{ color: '#fff', fontSize: '1.75rem', mb: 1.5 }}>
                                                        {svc.service_name}
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#64748b', mb: 4, fontWeight: 500, fontSize: '1.1rem' }}>
                                                        Duration • {svc.duration_minutes} min
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="h4" fontWeight={900} sx={{ color: '#38bdf8', fontSize: '2.2rem' }}>
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
                                                            <ArrowIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    </Grid>
                                ))}
                            </Grid>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={4}>
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
                                <Typography variant="h4" fontWeight={900} gutterBottom sx={{ mb: 5, fontSize: '2.5rem' }}>
                                    Visit & Contact
                                </Typography>

                                <Box sx={{ mb: 6 }}>
                                    {locations.map(loc => (
                                        <Box key={loc.id} sx={{ mb: 4 }}>
                                            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', mb: 1.5, fontSize: '1.4rem' }}>{loc.location_name}</Typography>
                                            <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.8, fontSize: '1.1rem' }}>
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
                    </Grid>
                </Grid>
            </Container>

        </Box>
    );
};

export default TemplatePremium;
