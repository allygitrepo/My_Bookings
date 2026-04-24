import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import PortalSidebar from './PortalSidebar';

const DRAWER_WIDTH = 260;

const PortalLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
            <PortalSidebar
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
            />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
                {isMobile && (
                    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Toolbar>
                            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight={700}>Portal Admin</Typography>
                        </Toolbar>
                    </AppBar>
                )}

                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default PortalLayout;
