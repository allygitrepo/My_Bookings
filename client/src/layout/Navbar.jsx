import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Box,
    Select,
    MenuItem,
    FormControl,
    Badge,
    Avatar,
    Menu,
    Typography,
    Button,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { getBusinesses } from '../api/business.api';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';

import ConfirmDialog from '../components/ConfirmDialog';

const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    if (rawBase.endsWith('/mybookings') && cleanUrl.startsWith('/mybookings/')) {
        const origin = rawBase.replace(/\/mybookings\/?$/, '');
        return `${origin}${cleanUrl}`;
    }
    return `${rawBase}${cleanUrl}`;
};

const Navbar = ({ onToggleSidebar, isSidebarOpen, drawerWidth }) => {
    const { searchQuery, setSearchQuery } = useSearch();
    const { selectedBusinessId, setSelectedBusinessId, businesses } = useBusiness();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [anchorEl, setAnchorEl] = useState(null);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const navigate = useNavigate();

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleConfirmLogout = () => {
        localStorage.removeItem('currentUser');
        setLogoutConfirmOpen(false);
        navigate('/login');
    };

    const userInitials = (currentUser?.name)
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
        <>
            <AppBar
                position="fixed"
                color="inherit"
                elevation={0}
                sx={{
                    width: { md: `calc(100% - ${isSidebarOpen ? drawerWidth : 0}px)` },
                    ml: { md: isSidebarOpen ? `${drawerWidth}px` : 0 },
                    transition: (theme) => theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: (theme) => theme.zIndex.appBar,
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <IconButton color="inherit" edge="start" onClick={onToggleSidebar} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>

                        <FormControl variant="standard" sx={{ minWidth: 200, display: { xs: 'none', md: 'block' }, mr: 3 }}>
                            <Select
                                value={selectedBusinessId}
                                onChange={(e) => setSelectedBusinessId(e.target.value)}
                                disableUnderline
                                sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'primary.main' }}
                                renderValue={(selected) => {
                                    if (selected === 'all') return 'All Businesses';
                                    const b = businesses.find(item => String(item.id) === String(selected));
                                    if (!b) return 'Select Business';
                                    return (
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                            {b.logo ? (
                                                <Avatar src={getLogoUrl(b.logo)} sx={{ width: 22, height: 22, borderRadius: 1 }} />
                                            ) : null}
                                            <Typography fontWeight={700} fontSize="0.95rem" color="primary.main">{b.business_name}</Typography>
                                        </Box>
                                    );
                                }}
                            >
                                <MenuItem value="all">All Businesses</MenuItem>
                                {businesses.map((b) => (
                                    <MenuItem key={b.id} value={b.id} sx={{ fontWeight: 600 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <Avatar
                                                src={b.logo ? getLogoUrl(b.logo) : undefined}
                                                sx={{ width: 24, height: 24, borderRadius: 1.2, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'action.hover' }}
                                            >
                                                {!b.logo && (b.business_name?.[0]?.toUpperCase() || 'B')}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={600}>{b.business_name}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* --- Global Search Bar --- */}
                        <Box sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: 'action.hover',
                            borderRadius: 2.5,
                            px: { xs: 1.5, sm: 2 },
                            py: 0.75,
                            flex: { xs: 1, sm: 'none' },
                            width: { sm: 300, md: 400 },
                            maxWidth: 600,
                            ml: { xs: 0, md: 1 },
                            border: '1px solid transparent',
                            '&:focus-within': {
                                borderColor: 'primary.main',
                                bgcolor: 'background.paper',
                                boxShadow: '0 0 0 4px rgba(99,102,241,0.1)'
                            },
                            transition: 'all 0.2s'
                        }}>
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} />
                            <input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '0.85rem',
                                    color: 'inherit',
                                    fontWeight: 600
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleMenu}>
                            <Avatar 
                                src={currentUser?.profile_picture || undefined}
                                sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}
                            >
                                {!currentUser?.profile_picture && userInitials}
                            </Avatar>
                            {currentUser?.name && (
                                <Typography variant="body2" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    {currentUser.name.split(' ')[0]}
                                </Typography>
                            )}
                        </Box>

                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<LogoutIcon />}
                            onClick={() => setLogoutConfirmOpen(true)}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 1.8,
                                py: 0.6,
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                '&:hover': {
                                    borderColor: 'error.main',
                                    bgcolor: 'rgba(239, 68, 68, 0.08)'
                                },
                                display: { xs: 'none', sm: 'inline-flex' }
                            }}
                        >
                            Logout
                        </Button>
                        <Tooltip title="Logout">
                            <IconButton
                                color="error"
                                size="small"
                                onClick={() => setLogoutConfirmOpen(true)}
                                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                            >
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorEl={anchorEl}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 2 } }}
                        >
                            <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                                <PersonIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                                My Profile
                            </MenuItem>
                            <MenuItem onClick={() => { handleClose(); setLogoutConfirmOpen(true); }} sx={{ color: 'error.main' }}>
                                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <ConfirmDialog
                open={logoutConfirmOpen}
                onClose={() => setLogoutConfirmOpen(false)}
                onConfirm={handleConfirmLogout}
                title="Logout Confirmation"
                message="Are you sure you want to log out of your account?"
                confirmText="Log Out"
                confirmColor="warning"
                iconType="logout"
            />
        </>
    );
};

export default Navbar;
