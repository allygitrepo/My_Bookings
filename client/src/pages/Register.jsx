import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Alert, Link as MuiLink,
    InputAdornment, IconButton, CircularProgress, LinearProgress,
    useTheme
} from '@mui/material';
import {
    Visibility, VisibilityOff,
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckIcon,
    ArrowForward as ArrowIcon,
    Shield as ShieldIcon,
    Bolt as BoltIcon,
    Language as GlobeIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { register, sendOtp } from '../api/user.api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Dialog, DialogContent, DialogTitle, 
    DialogActions, Stack 
} from '@mui/material';
import logoImg from '../assets/logo.png';

const STATS = [
    { icon: <BoltIcon sx={{ fontSize: 22, color: '#a5b4fc' }} />, value: '5,000+', label: 'Businesses' },
    { icon: <GlobeIcon sx={{ fontSize: 22, color: '#a5b4fc' }} />, value: '40+', label: 'Cities' },
    { icon: <ShieldIcon sx={{ fontSize: 22, color: '#a5b4fc' }} />, value: '99.9%', label: 'Uptime' },
];

// Password strength meter
const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score: score * 20, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score: score * 20, label: 'Fair', color: '#f59e0b' };
    return { score: score * 20, label: 'Strong', color: '#22c55e' };
};

const inputSx = (focused, name) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
        bgcolor: 'white',
        color: '#1e293b', // Ensure text is dark on white background
        transition: 'all 0.2s',
        boxShadow: focused === name ? '0 0 0 4px rgba(99,102,241,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
        '& fieldset': { borderColor: focused === name ? '#6366f1' : '#e5e7eb', transition: 'border-color 0.2s' },
        '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px white inset !important',
            WebkitTextFillColor: '#1e293b !important',
        },
    }
});

const Register = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState('');
    
    // OTP States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [resending, setResending] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const strength = getPasswordStrength(form.password);

    const checks = [
        { label: 'At least 6 characters', pass: form.password.length >= 6 },
        { label: 'Passwords match', pass: form.password && form.password === form.confirmPassword },
    ];

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) { setError('Full Name is required'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        try {
            const response = await sendOtp(form.email);
            if (response.success) {
                setOtpToken(response.otpToken);
                setShowOtpModal(true);
            } else {
                setError(response.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async () => {
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await register({
                name: form.name,
                email: form.email,
                password: form.password,
                otp,
                otpToken
            });

            if (response.success) {
                setShowOtpModal(false);
                navigate('/login', { state: { message: 'Registration successful! Please login.' } });
            } else {
                setError(response.message || 'Verification failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        try {
            const response = await sendOtp(form.email);
            if (response.success) {
                setOtpToken(response.otpToken);
                // Reset OTP input
                setOtp('');
            }
        } catch (err) {
            console.error('Resend OTP failed:', err);
        } finally {
            setResending(false);
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
                {/* decorative circles */}
                {[
                    { size: 600, top: '-25%', right: '-20%', color: 'rgba(99,102,241,0.15)' },
                    { size: 350, bottom: '-15%', left: '-10%', color: 'rgba(168,85,247,0.12)' },
                    { size: 200, top: '40%', right: '10%', color: 'rgba(59,130,246,0.08)' },
                ].map((c, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', width: c.size, height: c.size,
                        top: c.top, bottom: c.bottom, left: c.left, right: c.right,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${c.color} 0%, transparent 70%)`,
                        pointerEvents: 'none'
                    }} />
                ))}

                {/* grid overlay */}
                <Box sx={{
                    position: 'absolute', inset: 0, opacity: 0.035,
                    backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 60px)',
                    pointerEvents: 'none'
                }} />

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ position: 'relative', zIndex: 1, width: '100%' }}
                >


                    <Typography variant="h2" sx={{
                        fontWeight: 900, color: 'white',
                        lineHeight: 1.08, mb: 4, fontSize: { md: '2.6rem', lg: '3rem' }
                    }}>
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="MyBookings"
                            sx={{
                                width: 180, height: 180,
                                borderRadius: '16px',
                                objectFit: 'contain',
                                bgcolor: 'rgba(255,255,255,0.07)',
                                p: 1.5,
                                border: '1px solid rgba(255,255,255,0.12)',
                                mb: 4
                            }}
                        />
                        <br />
                        Start managing
                        bookings{' '}
                        <Box component="span" sx={{
                            background: 'linear-gradient(90deg, #c084fc, #818cf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>smarter.</Box>
                    </Typography>

                    {/* Logo — big square, between heading and subtitle */}

                    <Typography sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '1rem', lineHeight: 1.75, mb: 7, maxWidth: 380
                    }}>
                        Join thousands of service businesses running their bookings, staff, and customers from one clean dashboard.
                    </Typography>

                    {/* Stats row */}
                    <Box sx={{ display: 'flex', gap: 4, mb: 8 }}>
                        {STATS.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.15 }}
                            >

                            </motion.div>
                        ))}
                    </Box>




                </motion.div>
            </Box>

            {/* ─── RIGHT PANEL: Form ─── */}
            <Box sx={{
                width: { xs: '100%', md: 560 },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflowY: 'auto',
                px: { xs: 3, sm: 6, md: 7 },
                py: 6,
                bgcolor: '#fafafe',
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                >
                    {/* Mobile logo */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 5, justifyContent: 'center' }}>
                        <Box component="img" src="/logo.png" alt="MyBookings" sx={{ width: 72, height: 72, borderRadius: '16px', objectFit: 'contain' }} />
                    </Box>

                    <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mb: 0.5 }}>
                        Create account
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 5 }}>
                        Free forever. No credit card required.{' '}

                    </Typography>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                style={{ marginBottom: 20 }}
                            >
                                <Alert severity="error" sx={{ borderRadius: '16px' }}>{error}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSendOtp}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                            {/* Name */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#374151' }}>Full Name</Typography>
                                <TextField
                                    fullWidth name="name" placeholder="e.g. Dr. Mehta"
                                    value={form.name} onChange={handleChange}
                                    onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                                    required autoFocus variant="outlined"
                                    sx={inputSx(focused, 'name')}
                                />
                            </Box>

                            {/* Email */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#374151' }}>Email Address</Typography>
                                <TextField
                                    fullWidth name="email" type="email" placeholder="you@example.com"
                                    value={form.email} onChange={handleChange}
                                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                                    required variant="outlined"
                                    sx={inputSx(focused, 'email')}
                                />
                            </Box>

                            {/* Password */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#374151' }}>Password</Typography>
                                <TextField
                                    fullWidth name="password" type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={form.password} onChange={handleChange}
                                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                                    required variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: 'text.secondary' }}
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={inputSx(focused, 'password')}
                                />
                                {/* Strength bar */}
                                {form.password && (
                                    <Box sx={{ mt: 1.5 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={strength.score}
                                            sx={{
                                                height: 5, borderRadius: 10,
                                                bgcolor: '#f1f5f9',
                                                '& .MuiLinearProgress-bar': { bgcolor: strength.color, borderRadius: 10, transition: 'width 0.4s ease' }
                                            }}
                                        />
                                        <Typography sx={{ color: strength.color, fontSize: '0.75rem', fontWeight: 700, mt: 0.5 }}>
                                            {strength.label} password
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Confirm */}
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#374151' }}>Confirm Password</Typography>
                                <TextField
                                    fullWidth name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
                                    value={form.confirmPassword} onChange={handleChange}
                                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')}
                                    required variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirm(!showConfirm)}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: 'text.secondary' }}
                                                >
                                                    {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={inputSx(focused, 'confirm')}
                                />
                            </Box>

                            {/* Requirements checklist */}
                            {(form.password || form.confirmPassword) && (
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    {checks.map((c, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={c.pass ? 'check' : 'empty'}
                                                    initial={{ scale: 0.5 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {c.pass
                                                        ? <CheckIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                                                        : <UncheckIcon sx={{ fontSize: 16, color: '#cbd5e1' }} />
                                                    }
                                                </motion.div>
                                            </AnimatePresence>
                                            <Typography sx={{ fontSize: '0.78rem', color: c.pass ? '#22c55e' : '#94a3b8', fontWeight: 600, transition: 'color 0.2s' }}>
                                                {c.label}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

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
                                    borderRadius: '16px',
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
                                {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Create Free Account'}
                            </Button>

                            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: -1 }}>
                                Already Have an Account?.
                                <MuiLink component={Link} to="/login" sx={{
                                    fontWeight: 700, color: '#6366f1',
                                    textDecoration: 'none', '&:hover': { textDecoration: 'underline' }
                                }}>
                                    Sign in instead
                                </MuiLink>
                            </Typography>

                        </Box>
                    </form>
                </motion.div>
            </Box>
            {/* ─── OTP MODAL ─── */}
            <Dialog 
                open={showOtpModal} 
                onClose={() => !loading && setShowOtpModal(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        padding: '12px',
                        maxWidth: '400px',
                        width: '100%',
                        bgcolor: 'background.paper',
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                    <Box sx={{ 
                        width: 64, height: 64, borderRadius: '50%', 
                        bgcolor: isDark ? 'rgba(99,102,241,0.2)' : '#f5f3ff', 
                        color: theme.palette.primary.main,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <ShieldIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
                        Verify Your Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 2 }}>
                        We've sent a 6-digit code to <br />
                        <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{form.email}</Box>
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Enter 6-digit OTP"
                            variant="outlined"
                            value={otp}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(val);
                            }}
                            autoFocus
                            inputProps={{ 
                                style: { 
                                    textAlign: 'center', 
                                    fontSize: '24px', 
                                    fontWeight: 800, 
                                    letterSpacing: '8px',
                                    color: theme.palette.text.primary
                                } 
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                    '& fieldset': { borderColor: theme.palette.divider },
                                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                    '& input': {
                                        caretColor: theme.palette.primary.main
                                    }
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'text.secondary'
                                }
                            }}
                        />
                        
                        {error && (
                            <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', fontWeight: 600 }}>
                                {error}
                            </Typography>
                        )}
                        
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Didn't receive the code?{' '}
                                <Button 
                                    size="small" 
                                    onClick={handleResendOtp}
                                    disabled={resending || loading}
                                    sx={{ fontWeight: 700, textTransform: 'none', color: theme.palette.primary.main }}
                                >
                                    {resending ? 'Resending...' : 'Resend Code'}
                                </Button>
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                
                <DialogActions sx={{ pb: 4, px: 3 }}>
                    <Button 
                        fullWidth 
                        variant="contained"
                        onClick={handleVerifyAndRegister}
                        disabled={otp.length !== 6 || loading}
                        sx={{
                            py: 1.8,
                            borderRadius: '16px',
                            fontWeight: 800,
                            fontSize: '1rem',
                            textTransform: 'none',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            boxShadow: isDark ? 'none' : '0 8px 20px -4px rgba(99,102,241,0.45)',
                            '&:hover': {
                                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                            },
                            '&.Mui-disabled': {
                                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                                color: isDark ? 'rgba(255,255,255,0.3)' : '#9e9e9e',
                                background: 'none'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify & Create Account'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Register;
