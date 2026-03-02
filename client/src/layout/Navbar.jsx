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
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { useBusinesses, useCurrentUser } from '../store';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, isSidebarOpen, drawerWidth }) => {
    const [businesses] = useBusinesses();
    const [currentUser] = useCurrentUser();
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (businesses.length > 0 && (!selectedBusiness || !businesses.find(b => b.id === selectedBusiness))) {
            setSelectedBusiness(businesses[0].id);
        }
    }, [businesses, selectedBusiness]);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        handleClose();
        navigate('/login');
    };

    const userInitials = currentUser
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD';

    return (
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
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton color="inherit" edge="start" onClick={onToggleSidebar} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>

                    <FormControl variant="standard" sx={{ minWidth: 200, display: businesses.length > 0 ? 'block' : 'none' }}>
                        <Select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            disableUnderline
                            sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                        >
                            {businesses.map((b) => (
                                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton color="inherit">
                        <Badge badgeContent={0} color="error"><NotificationsIcon /></Badge>
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleMenu}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                            {userInitials}
                        </Avatar>
                        {currentUser && (
                            <Typography variant="body2" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' } }}>
                                {currentUser.name.split(' ')[0]}
                            </Typography>
                        )}
                    </Box>

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
                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
