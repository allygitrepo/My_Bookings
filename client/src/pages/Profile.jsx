import React, { useState } from 'react';
import {
    Box, Card, Typography, TextField, Button, Alert, Avatar,
    Divider, InputAdornment, IconButton,
} from '@mui/material';
import { Edit as EditIcon, Visibility, VisibilityOff, AccountCircleOutlined } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { updateUser, getUsers } from '../api/user.api';
import toast from 'react-hot-toast';

const Profile = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const [profileForm, setProfileForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
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

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileError('');
        if (!profileForm.name.trim()) { setProfileError('Name cannot be empty.'); return; }

        try {
            const response = await updateUser(currentUser.id, {
                name: profileForm.name,
                email: profileForm.email
            });
            if (response.success) {
                const updatedUser = { ...currentUser, name: profileForm.name, email: profileForm.email };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
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
                        <Avatar
                            sx={{ width: 76, height: 76, bgcolor: 'primary.main', fontSize: '1.8rem', fontWeight: 700 }}
                        >
                            {userInitials}
                        </Avatar>
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
