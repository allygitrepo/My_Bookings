import React from 'react';
import {
    Box, Container, Typography, Grid, Chip, Avatar,
    Button, IconButton, Divider, useTheme, useMediaQuery
} from '@mui/material';
import {
    Instagram as InstagramIcon,
    LinkedIn as LinkedInIcon,
    Twitter as TwitterIcon,
    NavigateNext as NextIcon,
    MailOutline as MailIcon,
    LocationOnOutlined as LocationIcon
} from '@mui/icons-material';
import { motion, useScroll, useTransform } from 'framer-motion';

/* ─── Design tokens ────────────────────────────────────────────────────── */
const TEAL = '#00e5c8';
const TEAL2 = '#00c4ac';
const TEAL_DIM = 'rgba(0,229,200,0.15)';
const TEAL_GLOW = 'rgba(0,229,200,0.35)';
const BG = '#050a0a';
const BG2 = '#091212';
const BG3 = '#0d1a1a';
const WHITE = '#f0fafa';
const MUTED = 'rgba(180,220,215,0.55)';
const BORDER = 'rgba(0,229,200,0.22)';

const neonText = {
    color: TEAL,
    textShadow: `0 0 24px ${TEAL_GLOW}, 0 0 8px ${TEAL_GLOW}`,
};
const neonBorder = `1px solid ${TEAL}`;
const glowBox = `0 0 28px ${TEAL_GLOW}, 0 0 6px ${TEAL_DIM}`;

/* ─── Component ────────────────────────────────────────────────────────── */
const TemplatePortfolioStudio = ({ data }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { business = {}, services = [], locations = [] } = data || {};

    const displayName = business.owner?.name || business.business_name || "Professional Studio";
    const bio = business.description || "Welcome to my professional workspace. I provide high-quality curated services tailored to your specific needs. Let's work together to achieve your goals.";

    /* ── Booking widget script — keys kept exactly as original ── */
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

    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 120]);
    const opacity1 = useTransform(scrollY, [0, 300], [1, 0]);

    const stats = [
        { num: '01', label: 'Years Active', value: '5+' },
        { num: '02', label: 'Projects Done', value: '120+' },
        { num: '03', label: 'Happy Clients', value: '98%' },
    ];

    return (
        <Box sx={{
            bgcolor: BG,
            color: WHITE,
            minHeight: '100vh',
            fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
            overflowX: 'hidden',
        }}>

            {/* ══ NAV ══════════════════════════════════════════════════════ */}
            <Box
                component={motion.nav}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                sx={{
                    position: 'fixed', top: 0, width: '100%', zIndex: 100,
                    borderBottom: `1px solid ${BORDER}`,
                    backdropFilter: 'blur(16px)',
                    bgcolor: 'rgba(5,10,10,0.72)',
                }}
            >
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                    <Typography sx={{
                        fontWeight: 900, letterSpacing: 5, fontSize: '1rem',
                        color: WHITE, textTransform: 'uppercase',
                    }}>
                        {business.business_name || 'Studio'}
                    </Typography>

                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 4 }}>
                            {['Home', 'Services', 'Portfolio', 'Contact'].map(l => (
                                <Typography
                                    key={l}
                                    onClick={l === 'Services' ? () => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' }) : undefined}
                                    sx={{
                                        fontSize: '0.78rem', letterSpacing: 2, fontWeight: 500,
                                        color: MUTED, textTransform: 'uppercase', cursor: 'pointer',
                                        transition: 'color .25s',
                                        '&:hover': { color: TEAL },
                                    }}
                                >
                                    {l}
                                </Typography>
                            ))}
                        </Box>
                    )}


                </Container>
            </Box>

            {/* ══ HERO ═════════════════════════════════════════════════════ */}
            <Box sx={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', pt: 10, overflow: 'hidden' }}>

                {/* Ambient blobs */}
                <Box sx={{
                    position: 'absolute', top: '5%', left: '-12%',
                    width: '60vw', height: '60vw',
                    background: `radial-gradient(circle, rgba(0,229,200,0.05) 0%, transparent 65%)`,
                    pointerEvents: 'none', zIndex: 0,
                }} />
                <Box sx={{
                    position: 'absolute', bottom: '5%', right: '-8%',
                    width: '45vw', height: '45vw',
                    background: `radial-gradient(circle, rgba(0,229,200,0.04) 0%, transparent 65%)`,
                    pointerEvents: 'none', zIndex: 0,
                }} />

                <Container maxWidth="xl" sx={{ zIndex: 2, position: 'relative' }}>
                    <Grid container spacing={8} alignItems="center" sx={{ minHeight: '80vh' }}>

                        {/* LEFT ── text */}
                        <Grid item xs={12} md={6}>
                            <motion.div style={{ y: y1, opacity: opacity1 }}>

                                <Chip
                                    label={business.business_type || 'Creative Studio'}
                                    size="small"
                                    sx={{
                                        bgcolor: TEAL_DIM,
                                        color: TEAL,
                                        border: `1px solid ${TEAL}`,
                                        fontWeight: 700,
                                        letterSpacing: 2.5,
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        mb: 4,
                                        boxShadow: `0 0 14px ${TEAL_DIM}`,
                                    }}
                                />

                                {/* Headline: User's Name mapped across lines */}
                                {displayName.split(' ').map((word, i) => (
                                    <Typography
                                        key={`${word}-${i}`}
                                        variant="h1"
                                        sx={{
                                            fontSize: { xs: '3.5rem', md: '5.5rem', lg: '6.5rem' },
                                            fontWeight: 900,
                                            lineHeight: 0.95,
                                            letterSpacing: '-0.04em',
                                            mb: i === displayName.split(' ').length - 1 ? 4 : 0,
                                            textTransform: 'uppercase',
                                            ...(i === 1 ? neonText : { color: WHITE }),
                                        }}
                                    >
                                        {word}{i === displayName.split(' ').length - 1 ? '.' : ''}
                                    </Typography>
                                ))}

                                <Typography sx={{
                                    color: MUTED,
                                    fontSize: { xs: '1rem', md: '1.2rem' },
                                    lineHeight: 1.6,
                                    maxWidth: 500,
                                    mb: 6,
                                    fontWeight: 400,
                                    opacity: 0.9
                                }}>
                                    {bio}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: TEAL, borderColor: TEAL,
                                            fontWeight: 800, fontSize: '0.85rem',
                                            letterSpacing: 2, textTransform: 'uppercase',
                                            px: 5, py: 1.8, borderRadius: '2px',
                                            '&:hover': { bgcolor: TEAL_DIM, boxShadow: glowBox },
                                            transition: 'all .3s ease',
                                        }}
                                        onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        See Portfolio
                                    </Button>
                                    <Button
                                        variant="text"
                                        sx={{
                                            color: MUTED, fontWeight: 700,
                                            fontSize: '0.85rem', letterSpacing: 1.5,
                                            textTransform: 'uppercase',
                                            '&:hover': { color: WHITE },
                                            display: 'flex', alignItems: 'center', gap: 1
                                        }}
                                        onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Book Now <span style={{ fontSize: '1.2rem', marginLeft: '4px' }}>→</span>
                                    </Button>
                                </Box>
                            </motion.div>
                        </Grid>

                        {/* RIGHT ── image with neon frame */}
                        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, delay: 0.3 }}
                                style={{ position: 'relative' }}
                            >
                                {/* Outer neon frame */}
                                <Box sx={{
                                    position: 'absolute', inset: -14,
                                    border: `1px solid ${BORDER}`,
                                    boxShadow: glowBox,
                                    zIndex: 0,
                                    pointerEvents: 'none',
                                }} />
                                {/* Corner accents */}
                                {[
                                    { top: -2, left: -2, borderTop: `2px solid ${TEAL}`, borderLeft: `2px solid ${TEAL}` },
                                    { top: -2, right: -2, borderTop: `2px solid ${TEAL}`, borderRight: `2px solid ${TEAL}` },
                                    { bottom: -2, left: -2, borderBottom: `2px solid ${TEAL}`, borderLeft: `2px solid ${TEAL}` },
                                    { bottom: -2, right: -2, borderBottom: `2px solid ${TEAL}`, borderRight: `2px solid ${TEAL}` },
                                ].map((s, i) => (
                                    <Box key={i} sx={{
                                        position: 'absolute', width: 24, height: 24,
                                        zIndex: 3, pointerEvents: 'none',
                                        ...s,
                                    }} />
                                ))}

                                {business.owner?.profile_picture ? (
                                    <Box
                                        component="img"
                                        src={business.owner.profile_picture}
                                        sx={{
                                            width: { xs: 270, md: 360, lg: 420 },
                                            height: { xs: 330, md: 450, lg: 510 },
                                            objectFit: 'cover',
                                            display: 'block',
                                            position: 'relative', zIndex: 1,
                                            filter: 'contrast(1.05) brightness(0.92)',
                                        }}
                                    />
                                ) : (
                                    <Box sx={{
                                        width: { xs: 270, md: 360, lg: 420 },
                                        height: { xs: 330, md: 450, lg: 510 },
                                        bgcolor: BG3,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative', zIndex: 1,
                                    }}>
                                        <Avatar sx={{ width: 110, height: 110, bgcolor: TEAL_DIM, color: TEAL, fontSize: '2.5rem' }}>
                                            {displayName.charAt(0)}
                                        </Avatar>
                                    </Box>
                                )}

                                {/* Teal tint overlay */}
                                <Box sx={{
                                    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                                    background: `linear-gradient(135deg, ${TEAL_DIM} 0%, transparent 55%)`,
                                }} />
                            </motion.div>
                        </Grid>
                    </Grid>

                    {/* Stats row */}
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        sx={{
                            display: 'flex', gap: { xs: 4, md: 8 },
                            mt: { xs: 8, md: 10 }, pt: 4,
                            borderTop: `1px solid ${BORDER}`,
                            flexWrap: 'wrap',
                        }}
                    >
                        {stats.map((s, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                <Typography sx={{
                                    ...neonText, fontSize: '0.72rem',
                                    fontWeight: 700, letterSpacing: 2,
                                    fontFamily: 'monospace',
                                }}>
                                    {s.num}
                                </Typography>
                                <Box>
                                    <Typography sx={{ color: WHITE, fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>
                                        {s.value}
                                    </Typography>
                                    <Typography sx={{ color: MUTED, fontSize: '0.72rem', letterSpacing: 1.5, textTransform: 'uppercase', mt: 0.5 }}>
                                        {s.label}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* ══ INFO ═════════════════════════════════════════════════════ */}
            <Box sx={{ py: 15, borderTop: `1px solid ${BORDER}`, bgcolor: BG2 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={8}>
                        <Grid item xs={12} md={6}>
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                                <Typography sx={{
                                    color: TEAL, textTransform: 'uppercase',
                                    letterSpacing: 4, fontWeight: 700, mb: 3, fontSize: '0.72rem',
                                    textShadow: `0 0 10px ${TEAL_GLOW}`,
                                }}>
                                    The Approach
                                </Typography>
                                <Typography variant="h3" sx={{
                                    fontWeight: 900, mb: 4, letterSpacing: -0.5,
                                    color: WHITE, lineHeight: 1.2, textTransform: 'uppercase',
                                    fontSize: { xs: '1.8rem', md: '2.4rem' },
                                }}>
                                    Curated precision.<br />Meticulous attention<br />to detail.
                                </Typography>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{
                                            p: 4, height: '100%', bgcolor: BG3,
                                            border: `1px solid ${BORDER}`, borderRadius: '4px',
                                            transition: 'all .3s',
                                            '&:hover': { boxShadow: glowBox, borderColor: TEAL },
                                        }}>
                                            <LocationIcon sx={{ color: TEAL, mb: 2, fontSize: 26 }} />
                                            <Typography sx={{ color: MUTED, fontWeight: 700, mb: 1, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 2.5 }}>Location</Typography>
                                            <Typography sx={{ color: WHITE, fontWeight: 600, fontSize: '1rem' }}>
                                                {locations?.[0]?.address || business.address || 'Remote / Global'}
                                            </Typography>
                                            <Typography sx={{ color: MUTED, mt: 0.5, fontSize: '0.85rem' }}>
                                                {locations?.[0]?.city || business.city}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{
                                            p: 4, height: '100%', bgcolor: BG3,
                                            border: `1px solid ${BORDER}`, borderRadius: '4px',
                                            transition: 'all .3s',
                                            '&:hover': { boxShadow: glowBox, borderColor: TEAL },
                                        }}>
                                            <MailIcon sx={{ color: TEAL, mb: 2, fontSize: 26 }} />
                                            <Typography sx={{ color: MUTED, fontWeight: 700, mb: 1, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 2.5 }}>Contact</Typography>
                                            <Typography sx={{ color: WHITE, fontWeight: 600, fontSize: '0.92rem', wordBreak: 'break-all' }}>{business.email}</Typography>
                                            <Button variant="text" sx={{ p: 0, mt: 2, minWidth: 0, color: TEAL, fontSize: '0.8rem', '&:hover': { color: WHITE } }}>
                                                Email Me →
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ══ SERVICES / BOOKING ═══════════════════════════════════════ */}
            <Box id="booking-section" sx={{ py: { xs: 12, md: 18 }, position: 'relative', bgcolor: BG }}>
                <Box sx={{
                    position: 'absolute', top: '20%', right: '-15%',
                    width: '50vw', height: '50vw',
                    background: `radial-gradient(circle, rgba(0,229,200,0.04) 0%, transparent 65%)`,
                    pointerEvents: 'none',
                }} />

                <Container maxWidth="lg">
                    <Box sx={{ mb: 10 }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <Typography sx={{
                                color: TEAL, textTransform: 'uppercase',
                                letterSpacing: 4, fontWeight: 700, mb: 2, fontSize: '0.72rem',
                                textShadow: `0 0 10px ${TEAL_GLOW}`,
                            }}>
                                Services
                            </Typography>
                            <Typography variant="h2" sx={{
                                fontWeight: 900, textTransform: 'uppercase',
                                letterSpacing: -1, color: WHITE,
                                fontSize: { xs: '2rem', md: '3.2rem' },
                            }}>
                                Studio Offerings
                            </Typography>
                        </motion.div>
                    </Box>

                    <Grid container spacing={3}>
                        {services.map((service, index) => (
                            <Grid item xs={12} md={4} key={service.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    style={{ height: '100%' }}
                                >
                                    <Box sx={{
                                        p: 4, bgcolor: BG3,
                                        border: `1px solid ${BORDER}`, borderRadius: '4px',
                                        height: '100%', display: 'flex', flexDirection: 'column',
                                        position: 'relative', overflow: 'hidden',
                                        transition: 'all 0.35s ease', cursor: 'pointer',
                                        '&:hover': { borderColor: TEAL, boxShadow: glowBox, transform: 'translateY(-6px)' },
                                    }}>
                                        {/* Top glow line */}
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                            background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
                                            opacity: 0.8,
                                        }} />
                                        {/* Corner accent */}
                                        <Box sx={{
                                            position: 'absolute', top: 8, right: 8,
                                            width: 12, height: 12,
                                            borderTop: `2px solid ${TEAL}`,
                                            borderRight: `2px solid ${TEAL}`,
                                            opacity: 0.7,
                                        }} />

                                        <Typography variant="h5" sx={{
                                            fontWeight: 800, mb: 2, letterSpacing: -0.3,
                                            color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
                                        }}>
                                            {service.service_name}
                                        </Typography>
                                        <Typography sx={{ color: MUTED, mb: 4, flexGrow: 1, fontSize: '0.88rem', lineHeight: 1.7 }}>
                                            {service.description || `Complete ${service.duration_minutes}m professional consultation.`}
                                        </Typography>

                                        <Box sx={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                                            pt: 3, borderTop: `1px solid ${BORDER}`,
                                        }}>
                                            <Box>
                                                <Typography sx={{ color: TEAL, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 2, mb: 0.5 }}>Rate</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, ...neonText }}>
                                                    ₹{Number(service.price).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ color: MUTED, fontWeight: 500, fontSize: '0.85rem' }}>
                                                {service.duration_minutes}m
                                            </Typography>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
            <Box sx={{ borderTop: `1px solid ${BORDER}`, py: 6, bgcolor: BG }}>
                <Container maxWidth="lg" sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center', gap: 2,
                }}>
                    <Typography sx={{ color: MUTED, fontSize: '0.85rem', letterSpacing: 1 }}>
                        © {new Date().getFullYear()} {displayName}.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton sx={{
                            color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '2px', p: 1,
                            '&:hover': { color: TEAL, borderColor: TEAL, boxShadow: `0 0 10px ${TEAL_DIM}` },
                        }}>
                            <InstagramIcon fontSize="small" />
                        </IconButton>
                        <IconButton sx={{
                            color: MUTED, border: `1px solid ${BORDER}`, borderRadius: '2px', p: 1,
                            '&:hover': { color: TEAL, borderColor: TEAL, boxShadow: `0 0 10px ${TEAL_DIM}` },
                        }}>
                            <LinkedInIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography sx={{ color: 'rgba(100,160,155,0.35)', fontSize: '0.8rem', letterSpacing: 1 }}>
                        Systems by MyBookings
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default TemplatePortfolioStudio;