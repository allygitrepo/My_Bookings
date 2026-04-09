import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar,
    CircularProgress, TextField, InputAdornment, Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as UserIcon,
    AdminPanelSettings as AdminIcon,
    Work as OwnerIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import {
    Tabs, Tab, Switch, Dialog, DialogTitle, DialogContent,
    DialogActions, Button
} from '@mui/material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';

const roleColors = {
    PORTAL_ADMIN: 'secondary',
    OWNER: 'primary',
    STAFF: 'info'
};

const roleIcons = {
    PORTAL_ADMIN: <AdminIcon fontSize="small" />,
    OWNER: <OwnerIcon fontSize="small" />,
    STAFF: <UserIcon fontSize="small" />
};

const PortalUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTab, setCurrentTab] = useState(0);

    // Suspension Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/portal/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch platform users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (user) => {
        if (user.status) {
            // Opening dialog to suspend
            setSelectedUser(user);
            setReason('');
            setOpenDialog(true);
        } else {
            // Immediately activate
            try {
                const response = await axiosInstance.put(`/portal/users/${user.id}/manage`, { status: true });
                if (response.data.success) {
                    toast.success('User activated successfully');
                    fetchUsers();
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to activate user');
            }
        }
    };

    const confirmSuspension = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for suspension');
            return;
        }
        setProcessing(true);
        try {
            const response = await axiosInstance.put(`/portal/users/${selectedUser.id}/manage`, {
                status: false,
                suspended_reason: reason
            });
            if (response.data.success) {
                toast.success('User suspended successfully');
                setOpenDialog(false);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to suspend user');
        } finally {
            setProcessing(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (currentTab === 1) return matchesSearch && u.role === 'OWNER';
        if (currentTab === 2) return matchesSearch && u.role === 'PORTAL_ADMIN';
        return matchesSearch;
    });

    return (
        <PageTransition>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Platform Users</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Manage all registered accounts across all roles and businesses.
                    </Typography>
                    <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mt: 3, minHeight: 40 }}>
                        <Tab label="All Users" sx={{ fontWeight: 700, textTransform: 'none' }} />
                        <Tab label="Business Owners" sx={{ fontWeight: 700, textTransform: 'none' }} />
                        <Tab label="Portal Admins" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    </Tabs>
                </Box>
                <TextField
                    size="small"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ width: { xs: '100%', md: 300 }, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Access</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                                    No users found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 }}>
                                            {user.name?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={800}>{user.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={roleIcons[user.role]}
                                        label={user.role}
                                        size="small"
                                        color={roleColors[user.role] || 'default'}
                                        sx={{ fontWeight: 800, borderRadius: 1.5, textTransform: 'uppercase', fontSize: '0.65rem' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{formatDate(user.created_at)}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Switch
                                            size="small"
                                            checked={user.status}
                                            onChange={() => handleToggleStatus(user)}
                                            color="success"
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" fontWeight={700} color={user.status ? 'success.main' : 'error.main'}>
                                                {user.status ? 'Active' : 'Suspended'}
                                            </Typography>
                                            {!user.status && (
                                                <Tooltip title={user.suspended_reason || "Account restricted by administrator"} arrow>
                                                    <InfoIcon sx={{ fontSize: '1rem', color: 'error.main', cursor: 'help' }} />
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Suspend Reason Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Suspend User Account</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please provide a reason for suspending **{selectedUser?.name}**. This will be shown to the user.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="e.g. Violation of terms, overdue payment..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={confirmSuspension}
                        variant="contained"
                        color="error"
                        disabled={processing}
                        sx={{ fontWeight: 700 }}
                    >
                        {processing ? 'Suspending...' : 'Confirm Suspension'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageTransition>
    );
};

export default PortalUsers;
