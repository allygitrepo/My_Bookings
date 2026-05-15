import React, { useState, useRef, useEffect } from 'react';
import {
    Container, Box, Typography, Card,
    CardContent, IconButton, Stack, Divider
} from '@mui/material';
import {
    ArrowForward as ArrowIcon,
    Instagram as InstagramIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    Schedule as ScheduleIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    CheckCircle as CheckIcon,
    KeyboardArrowDown as ChevronIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
// External Booking Widget Script replaced local BookingWidget import

// ─── Fonts ────────────────────────────────────────────────────────────────────
const FontImport = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
    `}</style>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1];
const SPRING = { type: 'spring', stiffness: 200, damping: 22 };
const ACCENT = '#c9a84c';
const ACCENT_DIM = 'rgba(201,168,76,.15)';
const SURFACE = 'rgba(255,255,255,.03)';
const BORDER = 'rgba(255,255,255,.07)';

const DEFAULT_SERVICES = [
    { id: 1, service_name: 'Executive Consultation', duration_minutes: 60, price: 4999 },
    { id: 2, service_name: 'Signature Treatment', duration_minutes: 90, price: 7999 },
    { id: 3, service_name: 'Premium Package', duration_minutes: 120, price: 12999 },
    { id: 4, service_name: 'Elite Experience', duration_minutes: 180, price: 19999 },
];
const DEFAULT_LOCATIONS = [
    { id: 1, location_name: 'The Grand Studio', address: '42 Link Road, Alkapuri', city: 'Vadodara', state: 'Gujarat' },
    { id: 2, location_name: 'North Flagship', address: '18 Race Course Road', city: 'Vadodara', state: 'Gujarat' },
];

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, y = 28, x = 0, scale = 1 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y, x, scale }}
            animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: EASE, delay }}
        >
            {children}
        </motion.div>
    );
};

// ─── Gold divider line ────────────────────────────────────────────────────────
const GoldLine = ({ width = 48, mx = 'auto', mb = 0 }) => (
    <Box sx={{ width, height: 1, bgcolor: ACCENT, opacity: .6, mx, mb }} />
);

// ─── Number counter ───────────────────────────────────────────────────────────
const Counter = ({ to, suffix = '' }) => {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(to / 40);
        const id = setInterval(() => {
            start += step;
            if (start >= to) { setVal(to); clearInterval(id); }
            else setVal(start);
        }, 30);
        return () => clearInterval(id);
    }, [inView, to]);
    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TemplateModern = ({ data }) => {
    const { business = {}, services = [], locations = [] } = data || {};
    const svcs = services.length ? services : DEFAULT_SERVICES;
    const locs = locations.length ? locations : DEFAULT_LOCATIONS;

    const [navSolid, setNavSolid] = useState(false);

    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
    const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

    useEffect(() => {
        const fn = () => setNavSolid(window.scrollY > 80);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    // Load External Booking Widget Script (Disabled during internal previews to avoid OAuth context conflicts)
    useEffect(() => {
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
        <Box sx={{ position: 'relative', bgcolor: '#080b12', minHeight: '100vh', color: '#fff', fontFamily: "'Jost', sans-serif", overflowX: 'hidden' }}>
            <FontImport />

            {/* ══ NAVBAR ══════════════════════════════════════════════════════ */}
            <motion.nav
                animate={{
                    backgroundColor: navSolid ? 'rgba(8,11,18,.92)' : 'transparent',
                    backdropFilter: navSolid ? 'blur(20px)' : 'blur(0px)',
                    borderBottom: navSolid ? `1px solid ${BORDER}` : '1px solid transparent',
                }}
                transition={{ duration: 0.35 }}
                style={{ position: data.isPreview ? 'absolute' : 'fixed', top: 0, left: 0, right: 0, zIndex: 300, padding: '20px 0' }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                            <Typography sx={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '1.5rem', fontWeight: 600,
                                letterSpacing: '1px', color: '#fff',
                            }}>
                                {business.business_name}
                            </Typography>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}>
                            <Stack direction="row" gap={1} alignItems="center">
                                {['Services', 'Locations', 'Contact'].map(label => (
                                    <Typography key={label} component="a" href={`#${label.toLowerCase()}`}
                                        sx={{ fontSize: '.78rem', fontWeight: 500, color: 'rgba(255,255,255,.5)', textDecoration: 'none', px: 1.5, letterSpacing: '.5px', transition: 'color .2s', '&:hover': { color: '#fff' } }}
                                    >
                                        {label}
                                    </Typography>
                                ))}

                            </Stack>
                        </motion.div>
                    </Box>
                </Container>
            </motion.nav>

            {/* ══ HERO ════════════════════════════════════════════════════════ */}
            <Box ref={heroRef} sx={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* Parallax BG */}
                <Box
                    component={motion.div}
                    style={{ y: heroBgY }}
                    sx={{ position: 'absolute', inset: '-10% 0', zIndex: 0 }}
                >
                    <Box sx={{
                        width: '100%', height: '120%',
                        background: `linear-gradient(to bottom, rgba(8,11,18,.3) 0%, rgba(8,11,18,.85) 70%, #080b12 100%), url("https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop")`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                </Box>

                {/* Gold accent lines */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, opacity: .5, zIndex: 2 }} />
                <Box sx={{ position: 'absolute', top: 0, left: 60, width: 1, height: '100%', background: `linear-gradient(to bottom, ${ACCENT}20, transparent)`, opacity: .4, zIndex: 2 }} />
                <Box sx={{ position: 'absolute', top: 0, right: 60, width: 1, height: '100%', background: `linear-gradient(to bottom, ${ACCENT}20, transparent)`, opacity: .4, zIndex: 2 }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
                    <motion.div style={{ y: heroY, opacity: heroOpacity }}>
                        <Box sx={{ maxWidth: 780 }}>
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                    <GoldLine width={32} mx="0" />
                                    <Typography sx={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: ACCENT }}>
                                        {business.business_type || 'Luxury Experience'}
                                    </Typography>
                                    <GoldLine width={32} mx="0" />
                                </Box>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}>
                                <Typography sx={{
                                    fontFamily: "'Cormorant Garamond', serif",
                                    fontSize: 'clamp(2.2rem, 10cqw, 6.5rem)',
                                    fontWeight: 300, lineHeight: .92,
                                    letterSpacing: '-1px', color: '#fff', mb: 1,
                                }}>
                                    {business.business_name || 'Prestige'}
                                </Typography>

                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}>
                                <Typography sx={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.55)', mb: 7, fontWeight: 300, lineHeight: 1.8, maxWidth: 520, letterSpacing: '.2px' }}>
                                    {business.description || "An uncompromising dedication to excellence — where craft meets luxury and every detail is curated for your distinction."}
                                </Typography>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.65 }}>
                                <Stack direction="row" gap={3} flexWrap="wrap" alignItems="center">
                                    <motion.button
                                        className="mybookings-trigger"
                                        whileHover={{ y: -3, boxShadow: `0 16px 48px rgba(201,168,76,.35)` }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 12,
                                            background: ACCENT, color: '#080b12',
                                            border: 'none', padding: '18px 40px',
                                            fontSize: '.8rem', fontWeight: 700,
                                            fontFamily: "'Jost', sans-serif", cursor: 'pointer',
                                            letterSpacing: '2px', textTransform: 'uppercase',
                                        }}
                                    >
                                        Explore
                                        <ArrowIcon sx={{ fontSize: 16 }} />
                                    </motion.button>
                                    <Typography component="a" href="#services"
                                        sx={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', '&:hover': { color: ACCENT }, transition: 'color .2s' }}
                                    >
                                        Explore Services
                                    </Typography>
                                </Stack>
                            </motion.div>
                        </Box>
                    </motion.div>
                </Container>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 3, opacity: 0.4 }}
                >
                    <ChevronIcon sx={{ color: '#fff', fontSize: 28 }} />
                </motion.div>
            </Box>

            {/* ══ STATS BAND ══════════════════════════════════════════════════ */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, py: 5, bgcolor: SURFACE }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: 0
                    }}>
                        {[
                            { value: 2400, suffix: '+', label: 'Clients Served' },
                            { value: 5, suffix: ' Yrs', label: 'Of Excellence' },
                            { value: 98, suffix: '%', label: 'Satisfaction Rate' },
                            { value: 12, suffix: '+', label: 'Expert Services' },
                        ].map((s, i) => (
                            <Box key={s.label}>
                                <Reveal delay={0.08 * i}>
                                    <Box sx={{
                                        textAlign: 'center', py: 2,
                                        borderRight: {
                                            xs: i % 2 === 0 ? `1px solid ${BORDER}` : 'none',
                                            md: i < 3 ? `1px solid ${BORDER}` : 'none'
                                        },
                                        borderBottom: {
                                            xs: i < 2 ? `1px solid ${BORDER}` : 'none',
                                            md: 'none'
                                        }
                                    }}>
                                        <Typography sx={{
                                            fontFamily: "'Cormorant Garamond', serif",
                                            fontSize: '2.8rem', fontWeight: 600,
                                            color: ACCENT, lineHeight: 1, letterSpacing: '-1px',
                                        }}>
                                            <Counter to={s.value} suffix={s.suffix} />
                                        </Typography>
                                        <Typography sx={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', letterSpacing: '2px', textTransform: 'uppercase', mt: .75, fontWeight: 500 }}>
                                            {s.label}
                                        </Typography>
                                    </Box>
                                </Reveal>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* ══ SERVICES ════════════════════════════════════════════════════ */}
            <Box id="services" sx={{ py: 16 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <GoldLine mb={3} />
                            <Typography sx={{ fontSize: '.7rem', letterSpacing: '3px', textTransform: 'uppercase', color: ACCENT, mb: 2, fontWeight: 600 }}>
                                What We Offer
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: { xs: '2.8rem', md: '3.8rem' },
                                fontWeight: 300, letterSpacing: '-1px', color: '#fff', lineHeight: 1,
                            }}>
                                Our Curated Services
                            </Typography>
                        </Box>
                    </Reveal>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: 2
                    }}>
                        {svcs.map((svc, idx) => (
                            <Box key={svc.id}>
                                <Reveal delay={0.07 * idx} scale={0.97}>
                                    <motion.div
                                        className="mybookings-trigger"
                                        whileHover={{ y: -8 }}
                                        transition={SPRING}
                                        style={{ cursor: 'pointer', height: '100%' }}
                                    >
                                        <Box sx={{
                                            p: 4, height: '100%',
                                            background: SURFACE,
                                            border: `1px solid ${BORDER}`,
                                            position: 'relative', overflow: 'hidden',
                                            transition: 'border-color .3s, background .3s',
                                            '&:hover': {
                                                borderColor: `${ACCENT}50`,
                                                background: ACCENT_DIM,
                                            },
                                            '&:hover .svc-num': { opacity: .08 },
                                            '&:hover .svc-arrow': { opacity: 1, x: 0 },
                                        }}>
                                            {/* Big index number */}
                                            <Typography className="svc-num" sx={{
                                                position: 'absolute', top: -10, right: 12,
                                                fontFamily: "'Cormorant Garamond', serif",
                                                fontSize: '7rem', fontWeight: 700,
                                                color: '#fff', opacity: .03,
                                                lineHeight: 1, userSelect: 'none',
                                                transition: 'opacity .3s',
                                            }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </Typography>

                                            <Box sx={{ mb: 4 }}>
                                                <Box sx={{ width: 32, height: 1, bgcolor: ACCENT, mb: 3, opacity: .6 }} />
                                                <Typography sx={{ fontSize: '.65rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', mb: 2, fontWeight: 600 }}>
                                                    Service {String(idx + 1).padStart(2, '0')}
                                                </Typography>
                                                <Typography sx={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#fff', lineHeight: 1.2, mb: 1.5 }}>
                                                    {svc.service_name}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" gap={.7}>
                                                    <ScheduleIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }} />
                                                    <Typography sx={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', fontFamily: "'Space Mono', monospace" }}>
                                                        {svc.duration_minutes} min
                                                    </Typography>
                                                </Stack>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography sx={{
                                                    fontFamily: "'Space Mono', monospace",
                                                    fontSize: '1.1rem', fontWeight: 700, color: ACCENT,
                                                }}>
                                                    ₹{svc.price.toLocaleString()}
                                                </Typography>
                                                <Box sx={{
                                                    width: 32, height: 32, border: `1px solid ${ACCENT}50`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'background .2s, border-color .2s',
                                                    '&:hover': { background: ACCENT, borderColor: ACCENT },
                                                }}>
                                                    <ArrowIcon sx={{ fontSize: 14, color: ACCENT, '.svc-num:hover &': { color: '#080b12' } }} />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Reveal>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* ══ FULL-WIDTH QUOTE BAND ════════════════════════════════════════ */}
            <Box sx={{ py: 14, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${ACCENT_DIM} 0%, transparent 65%)`, pointerEvents: 'none' }} />
                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <Reveal>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: { xs: '2rem', md: '3rem' },
                                fontWeight: 300, fontStyle: 'italic',
                                color: 'rgba(255,255,255,.85)', lineHeight: 1.4,
                                mb: 3,
                            }}>
                                "Where precision meets artistry, and every detail reflects the highest standard of craft."
                            </Typography>
                            <GoldLine width={40} />
                        </Box>
                    </Reveal>
                </Container>
            </Box>

            {/* ══ LOCATIONS & CONTACT ═════════════════════════════════════════ */}
            <Box id="locations" sx={{ py: 16 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{ mb: 10 }}>
                            <GoldLine width={40} mx="0" mb={3} />
                            <Typography sx={{ fontSize: '.7rem', letterSpacing: '3px', textTransform: 'uppercase', color: ACCENT, mb: 2, fontWeight: 600 }}>
                                Find Us
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: { xs: '2.8rem', md: '3.8rem' },
                                fontWeight: 300, letterSpacing: '-1px', color: '#fff', lineHeight: 1,
                            }}>
                                Locations & Contact
                            </Typography>
                        </Box>
                    </Reveal>

                    {/* Location cards */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                        gap: 2,
                        mb: 4
                    }}>
                        {locs.map((loc, idx) => (
                            <Box key={loc.id}>
                                <Reveal delay={0.08 * idx}>
                                    <motion.div whileHover={{ y: -6 }} transition={SPRING}>
                                        <Box sx={{
                                            p: 4, background: SURFACE,
                                            border: `1px solid ${BORDER}`,
                                            transition: 'border-color .3s',
                                            '&:hover': { borderColor: `${ACCENT}40` },
                                        }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                <Box sx={{ width: 36, height: 36, border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: .3 }}>
                                                    <LocationIcon sx={{ fontSize: 15, color: ACCENT }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: '#fff', mb: .75 }}>
                                                        {loc.location_name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.8, letterSpacing: '.2px' }}>
                                                        {loc.address}<br />{loc.city}, {loc.state}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Reveal>
                            </Box>
                        ))}
                    </Box>

                    {/* Contact + Hours + Social — full width */}
                    <Reveal delay={0.1}>
                        <Box sx={{ background: SURFACE, border: `1px solid ${BORDER}`, p: { xs: 4, md: 6 } }}>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                gap: 6
                            }} id="contact">
                                {/* Phone & Email */}
                                <Box>
                                    <Typography sx={{ fontSize: '.65rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: ACCENT, mb: 3, fontWeight: 600 }}>
                                        Get in Touch
                                    </Typography>
                                    {[
                                        { icon: <PhoneIcon sx={{ fontSize: 14, color: ACCENT }} />, label: 'Phone', value: business.phone || '+91 93161 63578' },
                                        { icon: <EmailIcon sx={{ fontSize: 14, color: ACCENT }} />, label: 'Email', value: business.email || 'hr@allysoftsolutions.com' },
                                    ].map(row => (
                                        <Box key={row.label} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                            <Box sx={{ width: 34, height: 34, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {row.icon}
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: '.62rem', color: 'rgba(255,255,255,.3)', letterSpacing: '1.5px', textTransform: 'uppercase', mb: .3 }}>{row.label}</Typography>
                                                <Typography sx={{ fontSize: '.88rem', color: '#fff', fontWeight: 400 }}>{row.value}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Hours */}
                                <Box>
                                    <Typography sx={{ fontSize: '.65rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: ACCENT, mb: 3, fontWeight: 600 }}>
                                        Business Hours
                                    </Typography>
                                    {[
                                        { day: 'Monday – Friday', time: '10:00 – 20:00' },
                                        { day: 'Saturday', time: '09:00 – 21:00' },
                                        { day: 'Sunday', time: 'Closed' },
                                    ].map(r => (
                                        <Box key={r.day} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.4, borderBottom: `1px solid ${BORDER}` }}>
                                            <Typography sx={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)', fontWeight: 400 }}>{r.day}</Typography>
                                            <Typography sx={{ fontSize: '.78rem', fontFamily: "'Space Mono', monospace", color: r.time === 'Closed' ? 'rgba(255,255,255,.2)' : ACCENT }}>
                                                {r.time}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Social + CTA */}
                                <Box>
                                    <Typography sx={{ fontSize: '.65rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: ACCENT, mb: 3, fontWeight: 600 }}>
                                        Follow Us
                                    </Typography>
                                    <Stack direction="row" gap={1.5} sx={{ mb: 5 }}>
                                        {[InstagramIcon, FacebookIcon, TwitterIcon].map((Icon, i) => (
                                            <motion.div key={i} whileHover={{ y: -3 }} transition={SPRING}>
                                                <Box sx={{
                                                    width: 40, height: 40, border: `1px solid ${BORDER}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', transition: 'border-color .2s, background .2s',
                                                    '&:hover': { borderColor: `${ACCENT}60`, background: ACCENT_DIM },
                                                }}>
                                                    <Icon sx={{ fontSize: 16, color: 'rgba(255,255,255,.45)' }} />
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </Stack>

                                    <motion.button
                                        className="mybookings-trigger"
                                        whileHover={{ y: -2, boxShadow: `0 12px 36px rgba(201,168,76,.3)` }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            width: '100%', background: ACCENT, color: '#080b12',
                                            border: 'none', padding: '14px 0',
                                            fontSize: '.72rem', fontWeight: 700,
                                            fontFamily: "'Jost', sans-serif", cursor: 'pointer',
                                            letterSpacing: '2px', textTransform: 'uppercase',
                                        }}
                                    >
                                        Reserve a Session
                                    </motion.button>
                                </Box>
                            </Box>
                        </Box>
                    </Reveal>
                </Container>
            </Box>

            {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, py: 5 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography sx={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '1px' }}>
                            {business.business_name || 'Prestige Studio'}
                        </Typography>
                        <Typography sx={{ fontSize: '.68rem', color: 'rgba(255,255,255,.2)', letterSpacing: '.5px' }}>
                            Powered by MyBookings · {new Date().getFullYear()}
                        </Typography>
                        <Stack direction="row" gap={3}>
                            {['Privacy', 'Terms', 'Help'].map(l => (
                                <Typography key={l} component="a" href="#"
                                    sx={{ fontSize: '.68rem', color: 'rgba(255,255,255,.25)', textDecoration: 'none', letterSpacing: '.5px', '&:hover': { color: ACCENT }, transition: 'color .2s' }}
                                >
                                    {l}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>
                </Container>
            </Box>

        </Box>
    );
};

export default TemplateModern;