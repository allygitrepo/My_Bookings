import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Box,
    Divider,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    People as StaffIcon,
    Build as ServicesIcon,
    EventAvailable as AvailabilityIcon,
    Group as CustomersIcon,
    Book as BookingsIcon,
    Payments as PaymentsIcon,
    VpnKey as ApiKeysIcon,
    Code as WidgetIcon,
} from '@mui/icons-material';

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Businesses', icon: <BusinessIcon />, path: '/businesses' },
    { text: 'Locations', icon: <LocationIcon />, path: '/locations' },
    { text: 'Staff', icon: <StaffIcon />, path: '/staff' },
    { text: 'Services', icon: <ServicesIcon />, path: '/services' },
    { text: 'Availability', icon: <AvailabilityIcon />, path: '/availability' },
    { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
    { text: 'Bookings', icon: <BookingsIcon />, path: '/bookings' },
    { text: 'Payments', icon: <PaymentsIcon />, path: '/payments' },
    { text: 'API Keys', icon: <ApiKeysIcon />, path: '/api-keys' },
    { text: 'Widget Script', icon: <WidgetIcon />, path: '/widget-script' },
];

const Sidebar = ({ open, onClose, variant, drawerWidth }) => {
    const location = useLocation();

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                    MyBookings
                </Typography>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                onClick={variant === 'temporary' ? onClose : undefined}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: isActive ? 'primary.light' : 'transparent',
                                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                                    '&:hover': {
                                        bgcolor: isActive ? 'primary.light' : 'action.hover',
                                        color: isActive ? 'primary.contrastText' : 'primary.main',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? 'inherit' : 'text.secondary', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    © 2025 MyBookings SaaS
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Drawer
            variant={variant}
            anchor="left"
            open={open}
            onClose={onClose}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;
