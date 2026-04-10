import React, { useState, useEffect } from 'react';
import {
    Box, Card, Typography, TextField, Button, Alert, Avatar,
    Divider, InputAdornment, IconButton,
} from '@mui/material';
import { Edit as EditIcon, Visibility, VisibilityOff, AccountCircleOutlined, PhotoCamera } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { updateUser, getUserById } from '../api/user.api';
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
                    });
                    // Sync localStorage
                    const updatedStorageUser = { ...currentUser, ...freshUser };
                    localStorage.setItem('currentUser', JSON.stringify(updatedStorageUser));
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
            <PageHeader title="My Profile" subtitle="Manage your account information and security settings." />

            <Box sx={{ maxWidth: 700 }}>
                {/* Profile Info Card */}
                <Card sx={{ p: 4, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={profileForm.profile_picture || undefined}
                                sx={{ width: 86, height: 86, bgcolor: 'primary.main', fontSize: '1.8rem', fontWeight: 700, border: '4px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                            >
                                {!profileForm.profile_picture && userInitials}
                            </Avatar>
                            <IconButton 
                                component="label" 
                                size="small" 
                                sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: 'white', border: '1px solid #ddd', '&:hover': { bgcolor: '#f0f0f0' } }}
                            >
                                <PhotoCamera fontSize="small" sx={{ color: 'text.secondary' }} />
                                <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                            </IconButton>
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{currentUser?.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{currentUser?.email}</Typography>
                        </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon fontSize="small" /> Edit Profile
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {profileError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{profileError}</Alert>}

                    <form onSubmit={handleProfileSave}>
                        <TextField
                            fullWidth label="Full Name" value={profileForm.name}
                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                            sx={{ mb: 2 }} required
                        />
                        <TextField
                            fullWidth label="Email Address" type="email" value={profileForm.email}
                            onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                            sx={{ mb: 3 }} required
                        />
                        <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2, px: 4 }}>
                            Save Changes
                        </Button>
                    </form>
                </Card>

                {/* Change Password Card */}
                <Card sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountCircleOutlined fontSize="small" /> Change Password
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {passwordError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{passwordError}</Alert>}

                    <form onSubmit={handlePasswordChange}>
                        <TextField
                            fullWidth label="Current Password"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            sx={{ mb: 2 }} required
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
                            fullWidth label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            sx={{ mb: 2 }} required helperText="At least 6 characters"
                        />
                        <TextField
                            fullWidth label="Confirm New Password"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            sx={{ mb: 3 }} required
                        />
                        <Button type="submit" variant="outlined" size="large" sx={{ borderRadius: 2, px: 4 }}>
                            Update Password
                        </Button>
                    </form>
                </Card>
            </Box>
        </>
    );
};

export default Profile;
