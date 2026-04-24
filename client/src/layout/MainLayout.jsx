import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BookingWidget from '../widgets/BookingWidget';
import SubscriptionModal from '../components/SubscriptionModal';
import { useSubscription } from '../context/SubscriptionContext';
import { Typography, Button, Alert, AlertTitle } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import dayjs from 'dayjs';

const DRAWER_WIDTH = 260;

const MainLayout = () => {
    const theme = useTheme();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const { usage, loading } = useSubscription();
    const isExpired = usage?.isExpired;
    const expiryDate = usage?.expiryDate;
    const [modalOpen, setModalOpen] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const user = currentUser.user || currentUser; // Handle nested structure

    // Subscription Guard: Owners without a package must pay
    const hasPackage = user && (user.package_id !== null && user.package_id !== undefined);
    const isCheckoutPage = location.pathname.startsWith('/checkout');
    const selectedPackageId = sessionStorage.getItem('selectedPackageId');

    // If no package and not on checkout, we show the modal overlay
    const showSubscriptionModal = user && user.role === 'OWNER' && !hasPackage && !isCheckoutPage;

    // No more redirecting to "/" here. The modal handles everything.
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const showWidget = [
        '/bookings',
        '/api-keys',
        '/widget-script',
        '/website-builder'
    ].some(path => location.pathname.startsWith(path));

    if (showSubscriptionModal) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SubscriptionModal open={true} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar
                open={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                variant={isMobile ? 'temporary' : 'persistent'}
                drawerWidth={DRAWER_WIDTH}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${isSidebarOpen && !isMobile ? DRAWER_WIDTH : 0}px)` },
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                        }),
                }}
            >
                <Navbar
                    onToggleSidebar={toggleSidebar}
                    isSidebarOpen={isSidebarOpen && !isMobile}
                    drawerWidth={DRAWER_WIDTH}
                />
                <Box sx={{ mt: 10 }}>
                    {isExpired && !loading && (
                        <Alert 
                            severity="error" 
                            variant="filled"
                            icon={<WarningIcon />}
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small" 
                                    onClick={() => setModalOpen(true)}
                                    sx={{ fontWeight: 800, textTransform: 'none' }}
                                >
                                    Renew Plan
                                </Button>
                            }
                            sx={{ 
                                mb: 3, borderRadius: 3, 
                                boxShadow: '0 8px 24px -12px rgba(239, 68, 68, 0.5)',
                                '& .MuiAlert-message': { width: '100%' }
                            }}
                        >
                            <AlertTitle sx={{ fontWeight: 800, mb: 0 }}>Subscription Expired</AlertTitle>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Your plan expired {expiryDate ? <b>on {dayjs(expiryDate).format('DD MMM YYYY')}</b> : 'recently'}. 
                                Your booking widget and all resource creation are currently disabled.
                            </Typography>
                        </Alert>
                    )}
                    <Outlet />
                </Box>

                <SubscriptionModal 
                    open={modalOpen} 
                    onClose={() => setModalOpen(false)} 
                />
                {/* Widget Preview for Admin - Show on relevant pages */}
                {showWidget && (
                    <BookingWidget 
                        isSidebarOpen={isSidebarOpen && !isMobile} 
                        drawerWidth={DRAWER_WIDTH} 
                        isExpired={isExpired}
                    />
                )}
            </Box>
        </Box>
    );
};

export default MainLayout;

