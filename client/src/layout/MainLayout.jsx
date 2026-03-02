import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BookingWidget from '../widgets/BookingWidget';

const DRAWER_WIDTH = 260;

const MainLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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
                    <Outlet />
                </Box>
                {/* Widget Preview for Admin */}
                <BookingWidget />
            </Box>
        </Box>
    );
};

export default MainLayout;
