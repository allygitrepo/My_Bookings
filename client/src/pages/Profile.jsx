import React, { useState, useEffect } from 'react';
import {
    Edit as EditIcon, Visibility, VisibilityOff, AccountCircleOutlined,
    PhotoCamera, Bolt as BoltIcon
} from '@mui/icons-material';
import {
    Box, Card, Typography, TextField, Button, Alert, Avatar,
    Divider, InputAdornment, IconButton, Chip, Grid
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import { updateUser, getUserById } from '../api/user.api';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';

const Profile = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const [profileForm, setProfileForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        profile_picture: currentUser?.profile_picture || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const userInitials = currentUser?.name
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    const { refreshUsage } = useSubscription();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser.id) return;
            try {
                const response = await getUserById(currentUser.id);
                if (response.success) {
                    const freshUser = response.data;
                    setProfileForm({
                        name: freshUser.name || '',
                        email: freshUser.email || '',
                        profile_picture: freshUser.profile_picture || '',
                        package_id: freshUser.package_id,
                        package_name: freshUser.package?.name,
                        package_expiry: freshUser.package_expiry,
                    });
                    // Sync localStorage
                    const updatedStorageUser = { ...currentUser, ...freshUser };
                    localStorage.setItem('currentUser', JSON.stringify(updatedStorageUser));
                    
                    // Refresh usage flags for sidebar
                    refreshUsage();
                }
            } catch (error) {
                console.error('Failed to fetch fresh user data:', error);
            }
        };
        fetchUserData();
    }, []);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileError('');
        if (!profileForm.name.trim()) { setProfileError('Name cannot be empty.'); return; }

        try {
            const response = await updateUser(currentUser.id, {
                name: profileForm.name,
                email: profileForm.email,
                profile_picture: profileForm.profile_picture
            });
            if (response.success) {
                const updatedUser = { ...currentUser, name: profileForm.name, email: profileForm.email, profile_picture: profileForm.profile_picture };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setProfileForm(prev => ({ ...prev, profile_picture: dataUrl }));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.'); return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.'); return;
        }

        try {
            const response = await updateUser(currentUser.id, {
                password: passwordForm.newPassword,
                currentPassword: passwordForm.currentPassword
            });
            if (response.success) {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                toast.success('Password changed successfully!');
            }
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Failed to change password');
        }
    };

    return (
        <>
            {/* <PageHeader title="My Profile" subtitle="Manage your account information and security settings." sx={{ mb: 4 }} /> */}

            <Box sx={{ maxWidth: 850 }}>
                {/* Subscription Plan Card */}
                {currentUser?.role === 'OWNER' && (
                    <Card sx={{
                        p: 2.5, mb: 3,
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(30, 41, 59, 0.7) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.2)', display: 'flex' }}>
                                <BoltIcon sx={{ color: '#818cf8', fontSize: 18 }} />
                            </Box>
                            Current Subscription
                        </Typography>

                        {profileForm.package_id ? (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: '12px',
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Box>
                                    <Typography variant="h5" fontWeight={900} sx={{
                                        background: 'linear-gradient(90deg, #818cf8, #c084fc)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>
                                        {profileForm.package_name || 'Active Plan'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                        Expires on: {profileForm.package_expiry ? new Date(profileForm.package_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </Typography>
                                </Box>
                                <Chip
                                    label="Active"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        fontWeight: 800,
                                        borderRadius: '6px',
                                        height: 24, fontSize: '0.7rem'
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <Typography variant="body2" color="text.secondary" mb={1.5}>No active subscription.</Typography>
                                <Button
                                    variant="contained" size="small"
                                    onClick={() => window.location.href = '/'}
                                    sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}
                                >
                                    Plans
                                </Button>
                            </Box>
                        )}
                    </Card>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        {/* Profile Info Card */}
                        <Card sx={{ height: '100%', p: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <EditIcon sx={{ color: 'primary.main', fontSize: 18 }} /> Profile Details
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3.5 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={profileForm.profile_picture || undefined}
                                        sx={{
                                            width: 72, height: 72,
                                            bgcolor: 'primary.main',
                                            fontSize: '1.5rem',
                                            fontWeight: 800,
                                            border: '3px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {!profileForm.profile_picture && userInitials}
                                    </Avatar>
                                    <IconButton
                                        component="label"
                                        size="small"
                                        sx={{
                                            position: 'absolute', bottom: -2, right: -2,
                                            bgcolor: 'primary.main',
                                            color: 'white', p: 0.5,
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <PhotoCamera sx={{ fontSize: 14 }} />
                                        <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                    </IconButton>
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{currentUser?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>{currentUser?.role}</Typography>
                                </Box>
                            </Box>

                            {profileError && <Alert severity="error" size="small" sx={{ mb: 2, py: 0, borderRadius: '8px', fontSize: '0.75rem' }}>{profileError}</Alert>}

                            <form onSubmit={handleProfileSave}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth label="Full Name" value={profileForm.name} size="small"
                                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                        required
                                    />
                                    <TextField
                                        fullWidth label="Email Address" type="email" value={profileForm.email} size="small"
                                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="medium"
                                        sx={{ borderRadius: '10px', fontWeight: 800, mt: 0.5 }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            </form>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        {/* Change Password Card */}
                        <Card sx={{ height: '100%', p: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <AccountCircleOutlined sx={{ color: 'primary.main', fontSize: 18 }} /> Security
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5, lineHeight: 1.4 }}>
                                Update your account password to maintain a high level of security.
                            </Typography>

                            {passwordError && <Alert severity="error" size="small" sx={{ mb: 2, py: 0, borderRadius: '8px', fontSize: '0.75rem' }}>{passwordError}</Alert>}

                            <form onSubmit={handlePasswordChange}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth label="Current Password" size="small"
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordForm.currentPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        required
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                                                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <TextField
                                        fullWidth label="New Password" size="small"
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        required
                                    />
                                    <TextField
                                        fullWidth label="Confirm Password" size="small"
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="outlined"
                                        size="medium"
                                        sx={{ borderRadius: '10px', fontWeight: 800, mt: 0.5 }}
                                    >
                                        Update Password
                                    </Button>
                                </Box>
                            </form>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Profile;
