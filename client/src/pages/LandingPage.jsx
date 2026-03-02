import React from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Grid,
    Card,
    Stack,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
    CalendarMonth as BookingIcon,
    Business as BusinessIcon,
    People as StaffIcon,
    Assessment as ReportIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Simple icon wrapper for missing imports
const CalendarMonthIcon = (props) => <BookingIcon {...props} />;

const Features = [
    {
        title: 'Multi-Business support',
        desc: 'Manage multiple businesses and branches from a single unified dashboard.',
        icon: <BusinessIcon fontSize="large" color="primary" />,
    },
    {
        title: 'Smart Scheduling',
        desc: 'Advanced availability management with custom time ranges for every staff member.',
        icon: <CalendarMonthIcon fontSize="large" color="primary" />,
    },
    {
        title: 'Staff Management',
        desc: 'Detailed roles, service mappings, and individual performance tracking.',
        icon: <StaffIcon fontSize="large" color="primary" />,
    },
    {
        title: 'Insightful Analytics',
        desc: 'Track revenue, bookings, and customer growth with real-time reporting.',
        icon: <ReportIcon fontSize="large" color="primary" />,
    },
];

const LandingPage = () => {
    return (
        <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh' }}>
            {/* Navbar */}
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="h5" color="primary" fontWeight={800}>
                            BookingApp
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Button color="inherit">Features</Button>
                            <Button color="inherit">Pricing</Button>
                            <Button variant="contained" component={NavLink} to="/dashboard">
                                Go to Dashboard
                            </Button>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{ py: { xs: 8, md: 15 }, bgcolor: '#f8fafc' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '3rem', md: '4rem' } }}>
                                    The Unified <Box component="span" color="primary.main">Booking</Box> Engine.
                                </Typography>
                                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4, fontWeight: 400 }}>
                                    A complete SaaS solution for multi-business booking management, staff scheduling, and customer engagement.
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" size="large" sx={{ px: 4, py: 1.5 }} component={NavLink} to="/dashboard">
                                        Get Started Free
                                    </Button>
                                    <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5 }}>
                                        View Demo
                                    </Button>
                                </Stack>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <Box
                                    component="img"
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
                                    alt="Dashboard Preview"
                                    sx={{
                                        width: '100%',
                                        borderRadius: 4,
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h3" fontWeight={700} gutterBottom>
                        Everything you need for bookings
                    </Typography>
                    <Typography color="text.secondary" variant="h6">
                        Powerful features to help you scale your service-based business.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {Features.map((f, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Card variant="outlined" sx={{ p: 4, height: '100%', textAlign: 'center', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', borderColor: 'primary.main' } }}>
                                <Box sx={{ mb: 2 }}>{f.icon}</Box>
                                <Typography variant="h6" fontWeight={700} gutterBottom>{f.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* CTA Section */}
            <Box sx={{ py: 10, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
                <Container maxWidth="sm">
                    <Typography variant="h3" fontWeight={700} gutterBottom>
                        Ready to grow?
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                        Join 5,000+ businesses using BookingApp to streamline their operations.
                    </Typography>
                    <Button variant="contained" color="secondary" size="large" sx={{ px: 6, py: 2 }} component={NavLink} to="/dashboard">
                        Start Your 14-Day Free Trial
                    </Button>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 6, borderTop: '1px solid #e2e8f0' }}>
                <Container maxWidth="lg">
                    <Typography align="center" color="text.secondary" variant="body2">
                        © 2025 BookingApp SaaS. Built with React & MUI.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
