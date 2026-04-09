import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { getBusinesses } from '../api/business.api';
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
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';
import Logo from '../components/Logo';
import {
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    People as StaffIcon,
    Build as ServicesIcon,
    Group as CustomersIcon,
    Book as BookingsIcon,
    Payments as PaymentsIcon,
    VpnKey as ApiKeysIcon,
    Code as WidgetIcon,
    Language as WebsiteIcon,
    Assessment as AssessmentIcon,
} from '@mui/icons-material';

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Businesses', icon: <BusinessIcon />, path: '/businesses' },
    { text: 'Locations', icon: <LocationIcon />, path: '/locations' },
    { text: 'Staff', icon: <StaffIcon />, path: '/staff' },
    { text: 'Services', icon: <ServicesIcon />, path: '/services' },
    { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
    { text: 'Bookings', icon: <BookingsIcon />, path: '/bookings' },
    { text: 'Payments', icon: <PaymentsIcon />, path: '/payments' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'API Keys', icon: <ApiKeysIcon />, path: '/api-keys' },
    { text: 'Widget Script', icon: <WidgetIcon />, path: '/widget-script' },
    { text: 'Website Builder', icon: <WebsiteIcon />, path: '/website-builder' },
];

const Sidebar = ({ open, onClose, variant, drawerWidth }) => {
    const location = useLocation();
    const { selectedBusinessId, setSelectedBusinessId } = useBusiness();
    const [businesses, setBusinesses] = React.useState([]);

    React.useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const response = await getBusinesses();
                if (response.success) setBusinesses(response.data);
            } catch (error) {
                console.error('Failed to fetch businesses');
            }
        };
        fetchBusinesses();
    }, []);

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', direction: 'ltr' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Logo size={36} />
            </Box>
            
            <Box sx={{ px: 2, mb: 2, display: { xs: 'block', md: 'none' } }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, ml: 1, mb: 1, display: 'block' }}>
                    Select Business
                </Typography>
                <FormControl fullWidth variant="outlined" size="small">
                    <Select
                        value={selectedBusinessId}
                        onChange={(e) => setSelectedBusinessId(e.target.value)}
                        sx={{ 
                            borderRadius: 2, 
                            bgcolor: 'action.hover', 
                            fontWeight: 700, 
                            fontSize: '0.85rem',
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                        }}
                    >
                        <MenuItem value="all">All Businesses</MenuItem>
                        {businesses.map((b) => (
                            <MenuItem key={b.id} value={b.id} sx={{ fontWeight: 600 }}>{b.business_name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Divider sx={{ mb: 1 }} />
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
                    direction: 'rtl', // Move scrollbar to start (left)
                    overflowX: 'hidden',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: (theme) =>
                            theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        transition: 'background 0.3s ease',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: (theme) => theme.palette.primary.main,
                    },
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;
