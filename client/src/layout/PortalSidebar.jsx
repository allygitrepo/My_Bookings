import React from 'react';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, Box, Divider, useTheme, useMediaQuery
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    CalendarMonth as CalendarIcon,
    People as PeopleIcon,
    AdminPanelSettings as AdminIcon,
    Logout as LogoutIcon,
    ArrowBack as BackIcon,
    Inventory as PackageIcon,
    Payments as PaymentsIcon,
    Layers as TemplatesIcon
} from '@mui/icons-material';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';

const DRAWER_WIDTH = 260;

const PortalSidebar = ({ open, onClose, variant }) => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { text: 'Admin Dashboard', icon: <DashboardIcon />, path: '/portal/dashboard' },
        { text: 'Businesses', icon: <BusinessIcon />, path: '/portal/businesses' },
        { text: 'Templates', icon: <TemplatesIcon />, path: '/portal/templates' },
        { text: 'Packages', icon: <PackageIcon />, path: '/portal/packages' },
        { text: 'Payments', icon: <PaymentsIcon />, path: '/portal/payments' },
        { text: 'Users', icon: <PeopleIcon />, path: '/portal/users' },
        { text: 'Create Admin', icon: <AdminIcon />, path: '/portal/create-admin' },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            <Toolbar sx={{ px: 3, py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{ width: 60, height: 60, borderRadius: 2, cursor: 'pointer' }}
                    onClick={() => navigate('/portal/dashboard')}
                />
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={900} color="primary" sx={{ letterSpacing: -0.5, lineHeight: 1.2 }}>
                        SUPER PORTAL
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Administrator
                    </Typography>
                </Box>
            </Toolbar>

            <Divider sx={{ opacity: 0.6 }} />

            <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
                <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    System Management
                </Typography>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                onClick={variant === 'temporary' ? onClose : undefined}
                                sx={{
                                    borderRadius: 3,
                                    py: 1.2,
                                    bgcolor: isActive ? 'primary.main' : 'transparent',
                                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                                    '&:hover': {
                                        bgcolor: isActive ? 'primary.main' : 'action.hover',
                                        color: isActive ? 'primary.contrastText' : 'primary.main',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: isActive ? 'inherit' : 'inherit',
                                        minWidth: 40
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ p: 2 }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 3,
                        py: 1.2,
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.50' }
                    }}
                >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 700 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Drawer
            variant={variant}
            open={open}
            onClose={onClose}
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none'
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default PortalSidebar;
