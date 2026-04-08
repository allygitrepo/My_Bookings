import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Box, Typography, Button, Grid,
    List, ListItem, ListItemText, Divider, Paper,
    Modal, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    ArrowForward as ArrowIcon,
    CheckCircleOutline as CheckIcon,
} from '@mui/icons-material';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay },
    }),
};

const fadeRight = {
    hidden: { opacity: 0, x: -16 },
    show: (delay = 0) => ({
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay },
    }),
};

const fadeLeft = {
    hidden: { opacity: 0, x: 20 },
    show: (delay = 0) => ({
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay },
    }),
};

// ─── Reusable Reveal wrapper ──────────────────────────────────────────────────
const Reveal = ({ children, variant = fadeUp, delay = 0, style = {} }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            custom={delay}
            variants={variant}
            style={style}
        >
            {children}
        </motion.div>
    );
};

// ─── STATS BAR ────────────────────────────────────────────────────────────────
const stats = [
    { num: '4.9', label: 'Rating' },
    { num: '2,400+', label: 'Clients' },
    { num: '8', label: 'Services' },
    { num: '5 yrs', label: 'Experience' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const TemplateMinimal = ({ data }) => {
    const { business = {}, services = [], locations = [] } = data;
    const [dotVisible, setDotVisible] = useState(true);

    // Pulse the "live" dot
    useEffect(() => {
        const id = setInterval(() => setDotVisible(v => !v), 1100);
        return () => clearInterval(id);
    }, []);

    return (
        <Box
            sx={{
                bgcolor: '#fff',
                minHeight: '100vh',
                py: { xs: 7, md: 10 },
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                overflowX: 'hidden',
            }}
        >
            {/* Google Font */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;900&family=DM+Mono:wght@400;500&display=swap');`}</style>

            <Container maxWidth="md">

                {/* ── HERO ── */}
                <Box sx={{ textAlign: 'center', mb: { xs: 7, md: 10 } }}>

                    {/* Live badge */}
                    <Reveal delay={0}>
                        <Box
                            sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 1,
                                bgcolor: '#f4f4f4', border: '0.5px solid #e8e8e8',
                                borderRadius: '100px', px: 2, py: 0.75, mb: 3.5,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 7, height: 7, borderRadius: '50%', bgcolor: '#111',
                                    transition: 'opacity .4s',
                                    opacity: dotVisible ? 1 : 0.2,
                                }}
                            />
                            <Typography sx={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.5px', color: '#555' }}>
                                Now accepting appointments
                            </Typography>
                        </Box>
                    </Reveal>

                    {/* Business name */}
                    <Reveal delay={0.08}>
                        <Typography
                            variant="h1"
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: { xs: '2.6rem', md: '4rem' },
                                fontWeight: 900,
                                letterSpacing: '-2.5px',
                                lineHeight: 1,
                                color: '#0a0a0a',
                                mb: 1.5,
                            }}
                        >
                            {business.business_name || 'The Craft Studio'}
                        </Typography>
                    </Reveal>

                    <Reveal delay={0.15}>
                        <Typography sx={{ fontSize: '1rem', color: '#999', mb: 5, fontWeight: 400, letterSpacing: '.3px' }}>
                            {business.business_type || 'Premium Hair & Beauty Services'}
                        </Typography>
                    </Reveal>

                    {/* CTA */}
                    <Reveal delay={0.22}>
                        <motion.button
                            className="mybookings-trigger"
                            whileHover={{ y: -3, boxShadow: '0 18px 42px rgba(0,0,0,.18)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 10,
                                background: '#0a0a0a', color: '#fff',
                                border: 'none', padding: '16px 36px',
                                fontSize: '.95rem', fontWeight: 700,
                                fontFamily: "'DM Sans', sans-serif",
                                borderRadius: 4, cursor: 'pointer',
                                letterSpacing: '.2px', transition: 'background .2s',
                            }}
                        >
                            Book Appointment
                            <motion.span
                                initial={{ x: 0 }}
                                whileHover={{ x: 4 }}
                                style={{ display: 'flex' }}
                            >
                                <ArrowIcon sx={{ fontSize: 18 }} />
                            </motion.span>
                        </motion.button>
                    </Reveal>
                </Box>

                {/* ── STATS BAR ── */}
                <Reveal delay={0.1}>
                    <Box
                        sx={{
                            display: 'flex', borderRadius: 2,
                            border: '0.5px solid #ebebeb', overflow: 'hidden', mb: { xs: 7, md: 10 },
                        }}
                    >
                        {stats.map((s, i) => (
                            <Box
                                key={s.label}
                                sx={{
                                    flex: 1, textAlign: 'center', py: 2.5, px: 2,
                                    borderRight: i < stats.length - 1 ? '0.5px solid #ebebeb' : 'none',
                                }}
                            >
                                <Typography sx={{ fontSize: '1.55rem', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-1px', lineHeight: 1.1 }}>
                                    {s.num}
                                </Typography>
                                <Typography sx={{ fontSize: '.7rem', color: '#bbb', letterSpacing: '.8px', textTransform: 'uppercase', mt: .5, fontWeight: 500 }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Reveal>

                {/* ── MAIN GRID ── */}
                <Grid container spacing={5} alignItems="flex-start">

                    {/* LEFT – Services */}
                    <Grid item xs={12} md={7}>
                        <Reveal variant={fadeRight} delay={0}>
                            <Typography sx={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#bbb', mb: 3 }}>
                                Featured Services
                            </Typography>
                        </Reveal>

                        <List disablePadding>
                            {(services.length ? services : defaultServices).map((svc, idx) => (
                                <Reveal key={svc.id || idx} variant={fadeRight} delay={0.06 * idx}>
                                    <motion.div
                                        whileHover={{ x: 8 }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                        style={{ position: 'relative' }}
                                    >
                                        {/* Left accent bar */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileHover={{ height: 36 }}
                                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                            style={{
                                                position: 'absolute', left: -14, top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: 3, background: '#0a0a0a', borderRadius: 4,
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                py: 2.8, borderBottom: idx < (services.length || defaultServices.length) - 1 ? '0.5px solid #f0f0f0' : 'none',
                                            }}
                                        >
                                            <Box>
                                                <Typography sx={{ fontSize: '.975rem', fontWeight: 700, color: '#0a0a0a', mb: .7 }}>
                                                    {svc.service_name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: .6 }}>
                                                    <TimeIcon sx={{ fontSize: 13, color: '#ccc' }} />
                                                    <Typography sx={{ fontSize: '.76rem', color: '#aaa', fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>
                                                        {svc.duration_minutes} min
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box
                                                sx={{
                                                    background: '#f5f5f5', borderRadius: 1,
                                                    px: 1.5, py: .8,
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: '.82rem', fontWeight: 700, color: '#0a0a0a',
                                                }}
                                            >
                                                ₹{svc.price}
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Reveal>
                            ))}
                        </List>
                    </Grid>

                    {/* RIGHT – Info Card */}
                    <Grid item xs={12} md={5}>
                        <Reveal variant={fadeLeft} delay={0.15}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3.5, bgcolor: '#fafafa',
                                    border: '0.5px solid #ebebeb',
                                    borderRadius: 2,
                                    position: 'sticky', top: 24,
                                }}
                            >
                                <Typography sx={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#bbb', mb: 2.5 }}>
                                    Location & Contact
                                </Typography>

                                {(locations.length ? locations : defaultLocations).map(loc => (
                                    <Box key={loc.id} sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                                        <Box
                                            sx={{
                                                width: 32, height: 32, bgcolor: '#0a0a0a',
                                                borderRadius: 1, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}
                                        >
                                            <LocationIcon sx={{ fontSize: 15, color: '#fff' }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '.84rem', fontWeight: 700, color: '#0a0a0a', mb: .3 }}>
                                                {loc.location_name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '.74rem', color: '#aaa', lineHeight: 1.7 }}>
                                                {loc.address}<br />{loc.city}, {loc.state}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}

                                <Divider sx={{ my: 2.5, borderColor: '#ebebeb' }} />

                                <Typography sx={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#bbb', mb: 2 }}>
                                    Hours
                                </Typography>

                                {[
                                    { day: 'Mon – Fri', time: '10:00 – 20:00' },
                                    { day: 'Saturday', time: '09:00 – 21:00' },
                                    { day: 'Sunday', time: 'Closed' },
                                ].map(row => (
                                    <Box key={row.day} sx={{ display: 'flex', justifyContent: 'space-between', mb: .8 }}>
                                        <Typography sx={{ fontSize: '.76rem', color: '#999', fontWeight: 500 }}>{row.day}</Typography>
                                        <Typography sx={{
                                            fontSize: '.76rem', fontWeight: 700,
                                            color: row.time === 'Closed' ? '#ddd' : '#0a0a0a',
                                            fontFamily: "'DM Mono', monospace",
                                        }}>
                                            {row.time}
                                        </Typography>
                                    </Box>
                                ))}

                                <Divider sx={{ my: 2.5, borderColor: '#ebebeb' }} />

                                {[
                                    { icon: <PhoneIcon sx={{ fontSize: 13, color: '#777' }} />, text: business.phone || '+91 98765 43210' },
                                    { icon: <EmailIcon sx={{ fontSize: 13, color: '#777' }} />, text: business.email || 'hello@studio.in' },
                                ].map((row, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {row.icon}
                                        </Box>
                                        <Typography sx={{ fontSize: '.8rem', color: '#555', fontWeight: 500 }}>{row.text}</Typography>
                                    </Box>
                                ))}
                            </Paper>
                        </Reveal>
                    </Grid>
                </Grid>

                {/* ── FOOTER ── */}
                <Reveal delay={0.1}>
                    <Box
                        sx={{
                            mt: 10, pt: 3.5,
                            borderTop: '0.5px solid #f0f0f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                    >
                        <Typography sx={{ fontSize: '.72rem', color: '#ccc', letterSpacing: '.4px' }}>
                            Powered by MyBookings
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2.5 }}>
                            {['Privacy', 'Terms', 'Help'].map(link => (
                                <Typography
                                    key={link}
                                    component="a"
                                    href="#"
                                    sx={{
                                        fontSize: '.72rem', color: '#ccc', textDecoration: 'none',
                                        '&:hover': { color: '#888' }, transition: 'color .15s',
                                    }}
                                >
                                    {link}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                </Reveal>
            </Container>
        </Box>
    );
};

// ─── Fallback data (used when props are empty) ────────────────────────────────
const defaultServices = [
    { id: 1, service_name: 'Signature Haircut', duration_minutes: 45, price: 599 },
    { id: 2, service_name: 'Balayage Highlight', duration_minutes: 120, price: 2499 },
    { id: 3, service_name: 'Deep Conditioning', duration_minutes: 60, price: 899 },
    { id: 4, service_name: 'Keratin Treatment', duration_minutes: 150, price: 3999 },
    { id: 5, service_name: 'Bridal Styling', duration_minutes: 180, price: 5999 },
];

const defaultLocations = [
    { id: 1, location_name: 'Main Studio', address: '42 Link Road, Alkapuri', city: 'Vadodara', state: 'Gujarat' },
];

export default TemplateMinimal;