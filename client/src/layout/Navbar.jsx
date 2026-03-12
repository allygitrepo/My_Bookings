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
    Search as SearchIcon,
} from '@mui/icons-material';
import { getBusinesses } from '../api/business.api';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

const Navbar = ({ onToggleSidebar, isSidebarOpen, drawerWidth }) => {
    const { searchQuery, setSearchQuery } = useSearch();
    const [businesses, setBusinesses] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    const fetchBusinesses = async () => {
        try {
            const response = await getBusinesses();
            if (response.success) {
                setBusinesses(response.data);
                if (response.data.length > 0 && !selectedBusiness) {
                    setSelectedBusiness(response.data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch businesses');
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        handleClose();
        navigate('/login');
    };

    const userInitials = (currentUser?.name)
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
                zIndex: (theme) => theme.zIndex.appBar,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <IconButton color="inherit" edge="start" onClick={onToggleSidebar} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>

                    <FormControl variant="standard" sx={{ minWidth: 200, display: { xs: 'none', md: businesses.length > 0 ? 'block' : 'none' }, mr: 4 }}>
                        <Select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            disableUnderline
                            sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                        >
                            {businesses.map((b) => (
                                <MenuItem key={b.id} value={b.id}>{b.business_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* --- Global Search Bar --- */}
                    <Box sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'action.hover',
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        width: { xs: '100%', sm: 400 },
                        maxWidth: 600,
                        ml: { xs: 0, md: 2 }
                    }}>
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1.5 }} />
                        <input
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                width: '100%',
                                fontSize: '0.9rem',
                                color: 'inherit',
                                fontWeight: 500
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>


                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleMenu}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                            {userInitials}
                        </Avatar>
                        {currentUser?.name && (
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
