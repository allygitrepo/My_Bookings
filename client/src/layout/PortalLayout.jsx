import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import PortalSidebar from './PortalSidebar';
import './PortalLayout.css';

const DRAWER_WIDTH = 260;

const PortalLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    return (
        <Box className="portal-layout-root">
            <PortalSidebar
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
            />

            <Box
                component="main"
                className="portal-main-content"
                sx={{ p: { xs: 2, md: 4 } }}
            >
                {isMobile && (
                    <AppBar position="sticky" elevation={0} className="portal-appbar">
                        <Toolbar>
                            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight={700}>Portal Admin</Typography>
                        </Toolbar>
                    </AppBar>
                )}

                <Box className="portal-outlet-wrapper">
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default PortalLayout;
