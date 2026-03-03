import React, { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Alert, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { login, getUserById } from '../api/user.api';

const Login = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
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

                // Store the full user object including business_id from the API response
                const userData = {
                    ...user,
                    token,
                };
                localStorage.setItem('currentUser', JSON.stringify(userData));
                navigate('/dashboard');
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.response?.data?.message || err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                backgroundImage: 'linear-gradient(135deg, #f0f4ff 0%, #faf8ff 100%)',
                p: 2,
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 420 }}>
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', mb: 2 }}>
                        <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary">Welcome back</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>Sign in to your MyBookings account</Typography>
                </Box>

                <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
                    {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth label="Email Address" name="email" type="email"
                            value={form.email} onChange={handleChange}
                            sx={{ mb: 2 }} required autoFocus
                        />
                        <TextField
                            fullWidth label="Password" name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password} onChange={handleChange}
                            sx={{ mb: 3 }} required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{ borderRadius: 2, py: 1.5, fontWeight: 700, fontSize: '1rem' }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
                        Don't have an account?{' '}
                        <MuiLink component={Link} to="/register" fontWeight={600} color="primary.main" underline="hover">
                            Create account
                        </MuiLink>
                    </Typography>
                </Card>
            </Box>
        </Box>
    );
};

export default Login;
