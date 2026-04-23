import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Chip,
    Divider,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import PublicBusinessWebsite from './PublicBusinessWebsite';
import {
    CalendarMonth as BookingIcon,
    Business as BusinessIcon,
    People as StaffIcon,
    Assessment as ReportIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

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
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const bizId = searchParams.get('biz');

    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashboardPath, setDashboardPath] = useState('/dashboard');

    useEffect(() => {
        // Determine dashboard path based on role
        const role = localStorage.getItem('role');
        if (role === 'PORTAL_ADMIN') {
            setDashboardPath('/portal/dashboard');
        } else {
            setDashboardPath('/dashboard');
        }

        const fetchPackages = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/packages/active`);
                const data = await response.json();
                if (data.success) {
                    // Filter active only on frontend as well for absolute safety
                    const activePackages = data.data.filter(p => p.status === true);
                    setPackages(activePackages);
                }
            } catch (error) {
                console.error('Failed to fetch pricing plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    if (bizId) {
        return <PublicBusinessWebsite />;
    }

    return (
        <Box sx={{ bgcolor: '#0f172a', minHeight: '100vh', color: 'white' }}>
            <AppBar position="fixed" elevation={0} sx={{
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'flex-end' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="contained"
                                component={NavLink}
                                to={dashboardPath}
                                sx={{
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                                    px: 3
                                }}
                            >
                                Get Started
                            </Button>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                pt: { xs: 10, md: 0 },
                background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 30%, #2d1a4b 65%, #3b0764 100%)',
                overflow: 'hidden',
            }}>
                {/* Decorative blobs */}
                <Box sx={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: { xs: 300, md: 600 }, height: { xs: 300, md: 600 }, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <Box sx={{
                    position: 'absolute', bottom: '0%', left: '-5%',
                    width: { xs: 300, md: 500 }, height: { xs: 300, md: 500 }, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Animated grid lines */}
                <Box sx={{
                    position: 'absolute', inset: 0, opacity: 0.9,
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(99,102,241,0.2) 0px, rgba(99,102,241,0.2) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, rgba(99,102,241,0.2) 0px, rgba(99,102,241,0.2) 1px, transparent 1px, transparent 80px)',
                    pointerEvents: 'none'
                }} />

                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        {/* LEFT SIDE: TEXT */}
                        <Grid item xs={12} md={7}>
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            >
                                <Chip
                                    label="SaaS Portfolio Platform"
                                    sx={{
                                        mb: 3,
                                        bgcolor: 'rgba(99,102,241,0.15)',
                                        color: '#c7d2fe',
                                        fontWeight: 700,
                                        border: '1px solid rgba(99,102,241,0.3)',
                                        px: 1
                                    }}
                                />
                                <Typography variant="h1" gutterBottom sx={{
                                    fontSize: { xs: '3rem', md: '4.5rem' },
                                    fontWeight: 900,
                                    color: 'white',
                                    lineHeight: 1.1,
                                    letterSpacing: '-2px',
                                    mb: 3
                                }}>
                                    Automate your<br />
                                    <Box component="span" sx={{
                                        background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>Business Workflow.</Box>
                                </Typography>

                                <Typography sx={{
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                                    mb: 6,
                                    fontWeight: 400,
                                    lineHeight: 1.8,
                                    maxWidth: '600px'
                                }}>
                                    From scheduling to staff management, MyBookings provides a high-performance
                                    ecosystem to grow your service business effortlessly.
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            px: 4,
                                            py: 2,
                                            borderRadius: '16px',
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 12px 30px rgba(99,102,241,0.5)',
                                            }
                                        }}
                                        component={NavLink}
                                        to={dashboardPath}
                                    >
                                        Launch Dashboard
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            px: 4,
                                            py: 2,
                                            borderRadius: '16px',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            color: 'white',
                                            borderColor: 'rgba(255,255,255,0.2)',
                                            background: 'rgba(255,255,255,0.05)',
                                            '&:hover': {
                                                borderColor: 'rgba(255,255,255,0.4)',
                                                background: 'rgba(255,255,255,0.1)',
                                            }
                                        }}
                                    >
                                        Explore Projects
                                    </Button>
                                </Stack>
                            </motion.div>
                        </Grid>

                        {/* RIGHT SIDE: LOGO + HEADER */}
                        <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', pr: 0 }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{
                                    duration: 1.2,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                            >
                                <motion.div
                                    animate={{
                                        y: [0, -20, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Logo size={280} showText={false} sx={{
                                        filter: 'drop-shadow(0 20px 40px rgba(99,102,241,0.3))',
                                    }} />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    style={{ textAlign: 'right', marginTop: '2rem' }}
                                >
                                    <Typography variant="h3" sx={{
                                        fontWeight: 900,
                                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                                        letterSpacing: '-1px'
                                    }}>
                                        My Bookings
                                    </Typography>
                                    <Typography sx={{
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '1.2rem',
                                        fontWeight: 600,
                                        letterSpacing: '4px',
                                        textTransform: 'uppercase',
                                        mt: 1
                                    }}>
                                        Bookings seamlessly
                                    </Typography>
                                </motion.div>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>


            {/* Features Section */}
            <Box sx={{ py: 15, bgcolor: '#0f172a', position: 'relative' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <Typography variant="h3" fontWeight={900} gutterBottom sx={{
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            color: 'white',
                            letterSpacing: '-1px'
                        }}>
                            Everything you need to <Box component="span" sx={{
                                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>scale</Box>
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', variant: 'h6', maxWidth: '600px', mx: 'auto', fontSize: '1.1rem' }}>
                            Powerful features designed to streamline your operations and delight your customers.
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {Features.map((f, i) => (
                            <Grid item xs={12} md={6} key={i}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <Card
                                        elevation={0}
                                        sx={{
                                            p: 6,
                                            height: '100%',
                                            textAlign: 'center',
                                            borderRadius: '40px',
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateY(-12px)',
                                                bgcolor: 'rgba(255,255,255,0.06)',
                                                borderColor: 'rgba(99,102,241,0.4)',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                                '& .feature-icon': {
                                                    transform: 'scale(1.1) rotate(5deg)',
                                                    bgcolor: 'rgba(99,102,241,0.2)',
                                                    color: '#818cf8'
                                                }
                                            }
                                        }}
                                    >
                                        <Box
                                            className="feature-icon"
                                            sx={{
                                                mb: 4,
                                                display: 'inline-flex',
                                                p: 3,
                                                borderRadius: '24px',
                                                bgcolor: 'rgba(255,255,255,0.05)',
                                                color: '#6366f1',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {f.icon}
                                        </Box>
                                        <Typography variant="h5" fontWeight={800} gutterBottom sx={{ color: 'white', mb: 2 }}>
                                            {f.title}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: '1.1rem' }}>
                                            {f.desc}
                                        </Typography>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            <Box sx={{ py: 15, background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
                <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 } }}>
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: 'white', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                            Simple, Transparent <Box component="span" sx={{
                                background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Pricing</Box>
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', variant: 'h6' }}>
                            Choose the perfect plan for your business growth. No hidden fees.
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress sx={{ color: '#6366f1' }} />
                        </Box>
                    ) : (
                        <Grid container spacing={2} justifyContent="center">
                            {packages.map((pkg, i) => (
                                <Grid item xs={12} sm={6} md={2.4} key={pkg.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        style={{ height: '100%' }}
                                    >
                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: '24px',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                bgcolor: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                backdropFilter: 'blur(10px)',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    borderColor: 'rgba(99,102,241,0.5)',
                                                    transform: 'translateY(-8px)',
                                                    bgcolor: 'rgba(255,255,255,0.05)',
                                                    boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
                                                }
                                            }}
                                        >
                                            {i === 1 && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 15,
                                                    right: -35,
                                                    bgcolor: '#6366f1',
                                                    color: 'white',
                                                    px: 6,
                                                    py: 0.5,
                                                    transform: 'rotate(45deg)',
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem',
                                                    textTransform: 'uppercase',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                                }}>
                                                    Popular
                                                </Box>
                                            )}

                                            <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: 'white' }}>{pkg.name}</Typography>
                                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'baseline' }}>
                                                <Typography variant="h4" fontWeight={900} sx={{ color: 'white' }}>₹{parseFloat(pkg.amount).toLocaleString()}</Typography>
                                                <Typography variant="caption" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)' }}>/ {pkg.duration_days}d</Typography>
                                            </Box>

                                            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                                            <Stack spacing={1.5} sx={{ mb: 4, flexGrow: 1 }}>
                                                {[
                                                    { label: `${pkg.max_businesses === -1 ? 'Unlimited' : pkg.max_businesses} Biz`, icon: <CheckIcon fontSize="small" /> },
                                                    { label: `${pkg.max_locations === -1 ? 'Unlimited' : pkg.max_locations} Loc`, icon: <CheckIcon fontSize="small" /> },
                                                    { label: `${pkg.max_staff === -1 ? 'Unlimited' : pkg.max_staff} Staff`, icon: <CheckIcon fontSize="small" /> },
                                                    { label: `${pkg.max_bookings === -1 ? 'Unlimited' : pkg.max_bookings} Bookings`, icon: <CheckIcon fontSize="small" /> },
                                                    { label: 'API Access', icon: pkg.allow_api ? <CheckIcon fontSize="small" /> : <CancelIcon fontSize="small" />, disabled: !pkg.allow_api },
                                                    { label: 'Website Builder', icon: pkg.allow_website_builder ? <CheckIcon fontSize="small" /> : <CancelIcon fontSize="small" />, disabled: !pkg.allow_website_builder },
                                                ].map((item, idx) => (
                                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: item.disabled ? 0.3 : 1 }}>
                                                        <Box sx={{ color: item.disabled ? '#ef4444' : '#10b981', display: 'flex' }}>
                                                            {item.icon}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: item.disabled ? 'line-through' : 'none', fontWeight: 500 }}>
                                                            {item.label}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>

                                            <Button
                                                fullWidth
                                                variant={i === 1 ? 'contained' : 'outlined'}
                                                size="small"
                                                component={NavLink}
                                                to="/register"
                                                sx={{
                                                    borderRadius: '12px',
                                                    py: 1,
                                                    fontWeight: 800,
                                                    textTransform: 'none',
                                                    fontSize: '0.75rem',
                                                    ...(i === 1 ? {
                                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                    } : {
                                                        color: 'white',
                                                        borderColor: 'rgba(255,255,255,0.2)',
                                                    })
                                                }}
                                            >
                                                Choose Plan
                                            </Button>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            </Box>



            {/* FAQ Section */}
            <Box sx={{ py: 15, bgcolor: '#0f172a' }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: 'white', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                            Frequently Asked <Box component="span" sx={{
                                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Questions</Box>
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', variant: 'h6', maxWidth: '600px', mx: 'auto' }}>
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
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '20px !important',
                                    color: 'white',
                                    overflow: 'hidden',
                                    '&:before': { display: 'none' },
                                    '&.Mui-expanded': {
                                        bgcolor: 'rgba(255,255,255,0.04)',
                                        borderColor: 'rgba(99,102,241,0.3)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                    }
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}>
                                    <Typography variant="h6" fontWeight={700}>{faq.question}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', pt: 3 }}>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', variant: 'body1', lineHeight: 1.8 }}>
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 10, borderTop: '1px solid rgba(255,255,255,0.06)', bgcolor: '#0b1120' }}>
                <Container maxWidth="xl">
                    <Grid container spacing={6} alignItems="flex-start" justifyContent="space-between">
                        <Grid item xs={12} md={5}>
                            <Logo size={42} />
                            <Typography variant="body2" sx={{ mt: 3, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: '400px' }}>
                                Empowering businesses with smart, unified booking solutions.
                                Designed for modern service providers who value efficiency and premium customer experience.
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
                            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', mb: 2 }}>
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
                                    gap: 2,
                                    transition: 'all 0.3s ease',
                                    '&:hover': { transform: 'scale(1.05)' }
                                }}
                            >
                                <Typography variant="h4" sx={{ color: '#FACC15', fontWeight: 900, letterSpacing: '-1px' }}>
                                    Allysoft Solutions
                                </Typography>
                                <Box
                                    component="img"
                                    src="/company_logo.png"
                                    alt="Allysoft Logo"
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: '12px',
                                        objectFit: 'contain',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        p: 0.5,
                                        bgcolor: 'rgba(255,255,255,0.05)'
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography align="center" sx={{ color: 'rgba(255,255,255,0.4)', variant: 'body2' }}>
                            Copyright © {new Date().getFullYear()} Allysoft Solutions. All rights reserved.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
