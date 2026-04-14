import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Alert, Link as MuiLink,
    InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import {
    Visibility, VisibilityOff, CalendarMonth as CalendarIcon,
    Business as BusinessIcon, People as PeopleIcon,
    EventAvailable as EventIcon, ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/user.api';
import { googleLogin } from '../services/authService';
import { useBusiness } from '../context/BusinessContext';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const FEATURES = [
    { icon: <BusinessIcon sx={{ fontSize: 20 }} />, text: 'Multi-business management' },
    { icon: <PeopleIcon sx={{ fontSize: 20 }} />, text: 'Smart staff scheduling' },
    { icon: <CalendarIcon sx={{ fontSize: 20 }} />, text: 'Real-time availability' },
    // { icon: <EventIcon sx={{ fontSize: 20 }} />, text: 'Seamless customer bookings' },
];

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const { refreshBusinesses } = useBusiness();

    const handleGoogleLogin = async (googleUser) => {
        setError('');
        setLoading(true);
        try {
            const response = await googleLogin(googleUser);
            if (response.success) {
                const { user } = response;
                
                // Refresh businesses immediately
                if (!user.isPortalAdmin) {
                    await refreshBusinesses();
                }

                if (user.isPortalAdmin) {
                    navigate('/portal/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(response.message || 'Google Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Google authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await login(form);
            if (response.success) {
                const { token, user } = response.data;
                localStorage.setItem('currentUser', JSON.stringify({ ...user, token }));
                localStorage.setItem('role', user.role);
                localStorage.setItem('isPortalAdmin', user.isPortalAdmin);

                // Refresh businesses immediately so the context is populated before navigation
                if (!user.isPortalAdmin) {
                    await refreshBusinesses();
                }

                if (response.data.user.isPortalAdmin) {
                    navigate('/portal/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>

            {/* ─── LEFT PANEL: Branding ─── */}
            <Box sx={{
                flex: 1,
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                px: 8,
                py: 6,
                background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 30%, #2d1a4b 65%, #3b0764 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative blobs */}
                <Box sx={{
                    position: 'absolute', top: '-20%', right: '-15%',
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <Box sx={{
                    position: 'absolute', bottom: '-15%', left: '-10%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Animated grid lines */}
                <Box sx={{
                    position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 60px)',
                    pointerEvents: 'none'
                }} />

                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ position: 'relative', zIndex: 1, width: '100%' }}
                >
                    {/* Logo — square, centered between heading and subtitle */}
                    <Box
                        component="img"
                        src={logoImg}
                        alt="MyBookings"
                        sx={{
                            width: 180, height: 180,
                            borderRadius: 4,
                            objectFit: 'contain',
                            bgcolor: 'rgba(255,255,255,0.08)',
                            p: 1.5,
                            border: '1px solid rgba(255,255,255,0.12)',
                            mb: 4,
                        }}
                    />
                    <Typography variant="h2" sx={{
                        fontWeight: 900, color: 'white',
                        lineHeight: 1.1, mb: 4, fontSize: { md: '2.8rem', lg: '3.2rem' }
                    }}>
                        Your bookings,<br />
                        <Box component="span" sx={{
                            background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>beautifully managed.</Box>
                    </Typography>



                    <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', mb: 6, fontWeight: 400, lineHeight: 1.7 }}>
                        The all-in-one SaaS platform for service businesses to schedule, manage, and grow.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 38, height: 38,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(255,255,255,0.12)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#c7d2fe',
                                        flexShrink: 0
                                    }}>
                                        {f.icon}
                                    </Box>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500, fontSize: '0.95rem' }}>
                                        {f.text}
                                    </Typography>
                                </Box>
                            </motion.div>
                        ))}
                    </Box>


                </motion.div>
            </Box>

            {/* ─── RIGHT PANEL: Form ─── */}
            <Box sx={{
                width: { xs: '100%', md: 520 },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: { xs: 3, sm: 6, md: 7 },
                py: 6,
                bgcolor: '#fafafe',
                position: 'relative',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Mobile logo */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 5, justifyContent: 'center' }}>
                        <Box component="img" src={logoImg} alt="MyBookings" sx={{ width: 72, height: 72, borderRadius: 3, objectFit: 'contain' }} />
                    </Box>

                    <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mb: 1 }}>
                        Sign in
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 5, fontWeight: 400 }}>
                        Welcome back! Enter your credentials to continue.
                    </Typography>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: 20, overflow: 'hidden' }}
                            >
                                <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 600 }}>{error}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Email */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#374151' }}>
                                    Email Address
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused('')}
                                    required
                                    autoFocus
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            bgcolor: 'white',
                                            transition: 'all 0.2s',
                                            boxShadow: focused === 'email' ? '0 0 0 4px rgba(99,102,241,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
                                            '& fieldset': { borderColor: focused === 'email' ? '#6366f1' : '#e5e7eb' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Password */}
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#374151' }}>
                                        Password
                                    </Typography>

                                </Box>
                                <TextField
                                    fullWidth
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            bgcolor: 'white',
                                            transition: 'all 0.2s',
                                            boxShadow: focused === 'password' ? '0 0 0 4px rgba(99,102,241,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
                                            '& fieldset': { borderColor: focused === 'password' ? '#6366f1' : '#e5e7eb' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Submit */}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                endIcon={loading ? null : <ArrowIcon />}
                                sx={{
                                    mt: 1,
                                    py: 1.8,
                                    borderRadius: 3,
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    boxShadow: '0 8px 20px -4px rgba(99,102,241,0.45)',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: '0 12px 24px -4px rgba(99,102,241,0.55)',
                                        transform: 'translateY(-1px)',
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                }}
                            >
                                {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Sign In'}
                            </Button>

                            {/* Google Login */}
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', width: '100%', textAlign: 'center', '&::before, &::after': { content: '""', position: 'absolute', top: '50%', width: '30%', height: '1px', bgcolor: '#e5e7eb' }, '&::before': { left: 0 }, '&::after': { right: 0 } }}>
                                    Or
                                </Typography>
                                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <GoogleLoginButton onSuccess={handleGoogleLogin} />
                                </Box>
                            </Box>
                        </Box>
                    </form>

                    {/* Divider + register link */}
                    <Box sx={{ mt: 5, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <MuiLink component={Link} to="/register" sx={{
                                fontWeight: 800, color: '#6366f1',
                                textDecoration: 'none', '&:hover': { textDecoration: 'underline' }
                            }}>
                                Create one for free
                            </MuiLink>
                        </Typography>
                    </Box>
                </motion.div>
            </Box>
        </Box>
    );
};

export default Login;
