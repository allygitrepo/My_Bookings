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
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useBusinesses } from '../store';

const Navbar = ({ onToggleSidebar }) => {
    const [businesses] = useBusinesses();
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        if (businesses.length > 0 && (!selectedBusiness || !businesses.find(b => b.id === selectedBusiness))) {
            setSelectedBusiness(businesses[0].id);
        }
    }, [businesses, selectedBusiness]);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar
            position="fixed"
            color="inherit"
            elevation={0}
            sx={{
                width: { md: `calc(100% - 260px)` },
                ml: { md: `260px` },
                borderBottom: '1px solid',
                borderColor: 'divider',
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={onToggleSidebar}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
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
                                <MenuItem key={b.id} value={b.id}>
                                    {b.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton color="inherit">
                        <Badge badgeContent={0} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <IconButton
                        size="large"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>AD</Avatar>
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Profile</MenuItem>
                        <MenuItem onClick={handleClose}>My account</MenuItem>
                        <MenuItem onClick={handleClose}>Logout</MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
