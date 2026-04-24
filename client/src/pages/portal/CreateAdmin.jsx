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
                    <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1, ml: 0.5, color: 'text.secondary' }}>Full Name</Typography>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        placeholder="Enter admin name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><UserIcon fontSize="small" sx={{ color: 'primary.main' }} /></InputAdornment>,
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1, ml: 0.5, color: 'text.secondary' }}>Email Address</Typography>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        type="email"
                                        placeholder="admin@mybookings.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ color: 'primary.main' }} /></InputAdornment>,
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1, ml: 0.5, color: 'text.secondary' }}>Login Password</Typography>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Minimum 6 characters"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" sx={{ color: 'primary.main' }} /></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Box>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AdminIcon />}
                                    sx={{ 
                                        mt: 1,
                                        py: 1.8, 
                                        borderRadius: '12px', 
                                        fontWeight: 800, 
                                        textTransform: 'none', 
                                        fontSize: '1.05rem',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        boxShadow: '0 8px 24px -4px rgba(99,102,241,0.5)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 12px 28px -4px rgba(99,102,241,0.6)',
                                        }
                                    }}
                                >
                                    {loading ? 'Creating Account...' : 'Create Administrator'}
                                </Button>
                            </Box>
                        </form>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card sx={{ 
                        p: 4, 
                        borderRadius: '20px', 
                        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, rgba(30, 41, 59, 0.7) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        height: '100%'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ 
                                p: 1.5, 
                                borderRadius: '12px', 
                                bgcolor: 'rgba(99, 102, 241, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <AdminIcon sx={{ fontSize: 32, color: '#818cf8' }} />
                            </Box>
                            <Typography variant="h6" fontWeight={800} color="text.primary">Super Admin Access</Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                            Portal Administrators have unrestricted access to all platform operations, tenant data, and billing configurations.
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {[
                                'Full access to view all businesses, bookings, and revenue data.',
                                'Ability to suspend, block, or delete any tenant account.',
                                'Permission to create additional Portal Admin accounts.',
                                'Bypass all multi-tenant security groups and API limits.',
                                'Modify platform-wide pricing, packages, and webhooks.'
                            ].map((text, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <Box sx={{ 
                                        width: 8, height: 8, 
                                        borderRadius: '50%', 
                                        bgcolor: '#818cf8', 
                                        mt: 0.8, 
                                        flexShrink: 0,
                                        boxShadow: '0 0 10px #818cf8'
                                    }} />
                                    <Typography variant="body2" fontWeight={500} color="text.primary">{text}</Typography>
                                </Box>
                            ))}
                        </Box>
                        
                        <Alert 
                            severity="warning" 
                            variant="outlined"
                            icon={<LockIcon fontSize="small" />}
                            sx={{ 
                                mt: 5, 
                                borderRadius: '12px',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                bgcolor: 'rgba(245, 158, 11, 0.05)',
                                '& .MuiAlert-icon': { color: '#fbbf24' }
                            }}
                        >
                            <Typography variant="caption" sx={{ color: '#fcd34d', fontWeight: 700, display: 'block', lineHeight: 1.5 }}>
                                SECURITY CAUTION
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Provide this level of access exclusively to trusted platform directors. Actions cannot be undone.
                            </Typography>
                        </Alert>
                    </Card>
                </Grid>
            </Grid>
        </PageTransition>
    );
};

export default CreateAdmin;
