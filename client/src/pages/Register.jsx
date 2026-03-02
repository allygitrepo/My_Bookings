import React, { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Alert, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, PersonAddOutlined } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisteredUsers, useCurrentUser } from '../store';

const Register = () => {
    const [users, setUsers] = useRegisteredUsers();
    const [, setCurrentUser] = useCurrentUser();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) { setError('Please enter your full name.'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
        if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) {
            setError('An account with this email already exists.'); return;
        }

        const newUser = { id: Date.now().toString(), name: form.name, email: form.email, password: form.password, createdAt: new Date().toISOString() };
        setUsers([...users, newUser]);

        const { password: _, ...safeUser } = newUser;
        setCurrentUser(safeUser);
        navigate('/dashboard');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'background.default', backgroundImage: 'linear-gradient(135deg, #f0f4ff 0%, #faf8ff 100%)', p: 2,
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 420 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', mb: 2 }}>
                        <PersonAddOutlined sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h4" fontWeight={800}>Create account</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>Start managing bookings for free</Typography>
                </Box>

                <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
                    {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

                    <form onSubmit={handleRegister}>
                        <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} sx={{ mb: 2 }} required autoFocus />
                        <TextField fullWidth label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} sx={{ mb: 2 }} required />
                        <TextField
                            fullWidth label="Password" name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password} onChange={handleChange} sx={{ mb: 2 }} required
                            helperText="At least 6 characters"
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
                        <TextField
                            fullWidth label="Confirm Password" name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={form.confirmPassword} onChange={handleChange} sx={{ mb: 3 }} required
                        />
                        <Button type="submit" variant="contained" fullWidth size="large" sx={{ borderRadius: 2, py: 1.5, fontWeight: 700, fontSize: '1rem' }}>
                            Create Account
                        </Button>
                    </form>

                    <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
                        Already have an account?{' '}
                        <MuiLink component={Link} to="/login" fontWeight={600} color="primary.main" underline="hover">
                            Sign in
                        </MuiLink>
                    </Typography>
                </Card>
            </Box>
        </Box>
    );
};

export default Register;
