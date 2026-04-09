import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    Card, InputAdornment, IconButton, CircularProgress, Alert
} from '@mui/material';
import {
    Person as UserIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import toast from 'react-hot-toast';

const CreateAdmin = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/portal/create-admin', form);
            if (response.data.success) {
                toast.success('New Portal Admin created successfully!');
                setForm({ name: '', email: '', password: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800}>Create Administrator</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Add a new colleague with full platform access. Portal Admins can manage everything.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                    <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, ml: 0.5 }}>Full Name</Typography>
                                <TextField
                                    fullWidth
                                    name="name"
                                    placeholder="Enter admin name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><UserIcon fontSize="small" color="action" /></InputAdornment>,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, ml: 0.5 }}>Email Address</Typography>
                                <TextField
                                    fullWidth
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment>,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, ml: 0.5 }}>Login Password</Typography>
                                <TextField
                                    fullWidth
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AdminIcon />}
                                sx={{ 
                                    py: 1.8, borderRadius: 3, fontWeight: 800, textTransform: 'none', fontSize: '1rem',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)'
                                }}
                            >
                                {loading ? 'Creating...' : 'Create Admin User'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        <AdminIcon sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
                        <Typography variant="h6" fontWeight={800} gutterBottom>Administrative Privileges</Typography>
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', mt: 1, flexShrink: 0 }} />
                                <Typography variant="body2">Full access to view all businesses and data.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', mt: 1, flexShrink: 0 }} />
                                <Typography variant="body2">Ability to suspend or block any business account.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', mt: 1, flexShrink: 0 }} />
                                <Typography variant="body2">Permission to create additional Portal Admin accounts.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', mt: 1, flexShrink: 0 }} />
                                <Typography variant="body2">Bypass all multi-tenant filters and security groups.</Typography>
                            </Box>
                        </Box>
                        <Alert severity="warning" variant="filled" sx={{ mt: 4, bgcolor: 'rgba(0,0,0,0.2)', border: 'none' }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>
                                CAUTION: Only provide this access to trusted team members.
                            </Typography>
                        </Alert>
                    </Card>
                </Grid>
            </Grid>
        </PageTransition>
    );
};

export default CreateAdmin;
