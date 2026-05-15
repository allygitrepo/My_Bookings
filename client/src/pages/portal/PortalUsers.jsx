import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar,
    CircularProgress, TextField, InputAdornment, Tooltip, IconButton, TablePagination
} from '@mui/material';
import {
    Tabs, Tab, Switch, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
    Grid
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as UserIcon,
    AdminPanelSettings as AdminIcon,
    Work as OwnerIcon,
    Info as InfoIcon,
    Inventory as PackageIcon
} from '@mui/icons-material';
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
    const [currentTab, setCurrentTab] = useState(1);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Suspension Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [reason, setReason] = useState('');

    // Package Assignment State
    const [packages, setPackages] = useState([]);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignData, setAssignData] = useState({
        packageId: '',
        isOneTime: false
    });
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

    const fetchPackages = async () => {
        try {
            const response = await axiosInstance.get('/packages/active');
            if (response.data.success) {
                setPackages(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch packages');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPackages();
    }, []);

    const handleOpenAssign = (user) => {
        setSelectedUser(user);
        setAssignData({ packageId: user.package_id || '', isOneTime: false });
        setAssignDialogOpen(true);
    };

    const confirmAssignment = async () => {
        if (!assignData.packageId) return toast.error('Please select a package');
        
        setProcessing(true);
        try {
            const response = await axiosInstance.post('/packages/assign', {
                userId: selectedUser.id,
                packageId: assignData.packageId,
                isOneTime: assignData.isOneTime
            });
            if (response.data.success) {
                toast.success('Package assigned successfully');
                setAssignDialogOpen(false);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign package');
        } finally {
            setProcessing(false);
        }
    };

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

            <TableContainer component={Paper} sx={{ overflow: 'hidden', mb: 4 }}>
                <Table>
                    <TableHead >
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Package</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Access</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
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
                        ) : filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
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
                                    {user.package_id ? (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Chip 
                                                    label={user.package?.name || 'Standard Plan'} 
                                                    size="small" variant="outlined" color="primary" 
                                                    sx={{ fontWeight: 700, borderRadius: 1.5 }} 
                                                />
                                                {user.subscriptions?.[0]?.razorpay_payment_id === 'MANUAL_ASSIGN' && (
                                                    <Chip 
                                                        label="Manual" 
                                                        size="small" 
                                                        color="secondary"
                                                        sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.6rem', height: 20 }} 
                                                    />
                                                )}
                                            </Box>
                                            {user.package_expiry && (
                                                <Typography variant="caption" display="block" color="text.secondary" fontWeight={500}>
                                                    Expires: {formatDate(user.package_expiry)}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">Free / None</Typography>
                                    )}
                                </TableCell>
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
                                <TableCell align="right">
                                    {user.role !== 'PORTAL_ADMIN' && (
                                        <Tooltip title="Assign Package">
                                            <IconButton 
                                                onClick={() => handleOpenAssign(user)} 
                                                size="small" 
                                                sx={{ bgcolor: 'primary.50', color: 'primary.main' }}
                                            >
                                                <PackageIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

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

            {/* Package Assignment Dialog */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Assign Package</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Assign a subscription tier to **{selectedUser?.name}**. This will override their current restrictions.
                    </Typography>
                    
                    <FormControl fullWidth>
                        <InputLabel>Select Package</InputLabel>
                        <Select
                            value={assignData.packageId}
                            label="Select Package"
                            onChange={(e) => setAssignData({ ...assignData, packageId: e.target.value })}
                        >
                            <MenuItem value=""><em>None / Remove Package</em></MenuItem>
                            {packages.map(pkg => (
                                <MenuItem key={pkg.id} value={pkg.id}>
                                    {pkg.name} - ₹{parseFloat(pkg.amount).toLocaleString()} ({pkg.duration_days} Days) {pkg.is_one_time ? '[1-TIME]' : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAssignDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={confirmAssignment}
                        variant="contained"
                        disabled={processing}
                        sx={{ fontWeight: 700 }}
                    >
                        {processing ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageTransition>
    );
};

export default PortalUsers;
