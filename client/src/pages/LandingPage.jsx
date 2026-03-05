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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Link,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
    CalendarMonth as BookingIcon,
    Business as BusinessIcon,
    People as StaffIcon,
    Assessment as ReportIcon,
    ExpandMore as ExpandMoreIcon,
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

const FAQs = [
    {
        question: "How do I get started with MyBookings?",
        answer: "Getting started is easy! Simply sign up for an account, add your business details, and you can begin managing your bookings and staff immediately."
    },
    {
        question: "Can I manage multiple locations?",
        answer: "Yes, MyBookings is designed for multi-business and multi-location management. You can add as many branches as you need from a single dashboard."
    },
    {
        question: "Is there a limit on staff members?",
        answer: "No, you can add as many staff members as your business requires. Each staff member can have their own unique schedule and services."
    },
    {
        question: "How secure is my data?",
        answer: "We take security seriously. All your data is encrypted and stored securely, ensuring that your business and customer information remains private."
    }
];

const LandingPage = () => {
    return (
        <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh' }}>
            {/* Navbar */}
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="h5" color="primary" fontWeight={800}>
                            MyBookings
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* <Button color="inherit" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Features</Button> */}
                            <Button variant="contained" component={NavLink} to="/dashboard" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>
                                Get Started
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
                <Grid container spacing={4} justifyContent="center">
                    {Features.map((f, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Card
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    textAlign: 'center',
                                    borderRadius: '24px',
                                    transition: 'all 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-12px)',
                                        borderColor: 'primary.main',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        bgcolor: 'rgba(59, 130, 246, 0.02)'
                                    }
                                }}
                            >
                                <Box sx={{
                                    mb: 3,
                                    display: 'inline-flex',
                                    p: 2,
                                    borderRadius: '16px',
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    opacity: 0.8
                                }}>
                                    {f.icon}
                                </Box>
                                <Typography variant="h6" fontWeight={800} gutterBottom>{f.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{f.desc}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>


            {/* FAQ Section */}
            <Container maxWidth="md" sx={{ py: 12 }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: 'text.primary' }}>
                        Frequently Asked Questions
                    </Typography>
                    <Typography color="text.secondary" variant="h6" sx={{ maxWidth: '600px', mx: 'auto' }}>
                        Everything you need to know about our booking platform.
                    </Typography>
                </Box>
                <Box>
                    {FAQs.map((faq, index) => (
                        <Accordion
                            key={index}
                            elevation={0}
                            sx={{
                                mb: 2,
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px !important',
                                '&:before': { display: 'none' },
                                '&.Mui-expanded': { boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />}>
                                <Typography variant="h6" fontWeight={600}>{faq.question}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary" variant="body1">
                                    {faq.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{ py: 8, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} alignItems="center" justifyContent="space-between">
                        <Grid item xs={12} md={5}>
                            <Typography variant="h5" color="primary" fontWeight={900} letterSpacing="-0.5px">
                                MyBookings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Empowering businesses with smart, unified booking solutions. <br />
                                Managed and developed with excellence by Allysoft Solutions.
                            </Typography>
                        </Grid>

                        <Grid
                            item
                            xs={12}
                            md={5}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: { xs: 'flex-start', md: 'flex-end' },
                                textAlign: { xs: 'left', md: 'right' }
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="1px" gutterBottom>
                                Developed By
                            </Typography>
                            <Box
                                component={Link}
                                href="https://allysoftsolutions.com/"
                                target="_blank"
                                underline="none"
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.02)' }
                                }}
                            >
                                <Typography variant="h5" sx={{ color: '#FACC15', fontWeight: 900 }}>
                                    Allysoft Solutions
                                </Typography>
                                <Box
                                    component="img"
                                    src="/company_logo.png"
                                    alt="Allysoft Logo"
                                    sx={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'contain' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Box sx={{ pt: 4, borderTop: '1px solid #e2e8f0' }}>
                        <Typography align="center" color="text.secondary" variant="body2">
                            Copyright © {new Date().getFullYear()} Allysoft Solutions. All rights reserved.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
