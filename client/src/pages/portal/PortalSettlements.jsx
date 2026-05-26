import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, IconButton,
    Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, TextField, InputAdornment, Card, CardContent,
    Divider, TablePagination, useTheme, Checkbox
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as ViewIcon,
    AccountBalance as BankIcon,
    Payments as PaymentsIcon,
    CheckCircle as CheckCircleIcon,
    ContentCopy as CopyIcon,
    Info as InfoIcon,
    AccountBalanceWallet as WalletIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    PriceCheck as SettleIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const PortalSettlements = () => {
    const theme = useTheme();
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    // Dialog state
    const [openAccountDialog, setOpenAccountDialog] = useState(false);
    const [openBreakdownDialog, setOpenBreakdownDialog] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/portal/settlements');
            if (res.data.success) {
                setSettlements(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch settlements data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlements();
    }, []);

    const handleSettleAllForGroup = async (bizGroup) => {
        const unpaidPaymentIds = (bizGroup.payments || [])
            .filter(p => p.settlement_status === 'unpaid')
            .map(p => p.id);

        if (unpaidPaymentIds.length === 0) return;

        setActionLoading(true);
        try {
            const res = await axiosInstance.put('/portal/settlements/mark-paid', { paymentIds: unpaidPaymentIds });
            if (res.data.success) {
                toast.success(`Settlements for ${bizGroup.business_name} (${bizGroup.monthLabel}) marked as paid`);
                
                // Keep dialog selection updated if open
                if (selectedBusiness && selectedBusiness.id === bizGroup.id && selectedBusiness.monthKey === bizGroup.monthKey) {
                    const updatedBiz = {
                        ...selectedBusiness,
                        status: 'paid',
                        payments: selectedBusiness.payments.map(p => ({ ...p, settlement_status: 'paid' }))
                    };
                    setSelectedBusiness(updatedBiz);
                }
                
                fetchSettlements();
            }
        } catch (error) {
            toast.error('Failed to settle payments');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSettlePayment = async (paymentId, businessId, monthKey) => {
        setActionLoading(true);
        try {
            const res = await axiosInstance.put('/portal/settlements/mark-paid', { paymentIds: [paymentId] });
            if (res.data.success) {
                toast.success('Payment marked as settled');
                
                // Keep dialog selection updated if open
                if (selectedBusiness && selectedBusiness.id === businessId && selectedBusiness.monthKey === monthKey) {
                    const updatedPayments = selectedBusiness.payments.map(p => 
                        p.id === paymentId ? { ...p, settlement_status: 'paid' } : p
                    );
                    const hasUnpaid = updatedPayments.some(p => p.settlement_status === 'unpaid');
                    const updatedBiz = {
                        ...selectedBusiness,
                        status: hasUnpaid ? 'unpaid' : 'paid',
                        payments: updatedPayments
                    };
                    setSelectedBusiness(updatedBiz);
                }

                fetchSettlements();
            }
        } catch (error) {
            toast.error('Failed to settle payment');
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    // Group and aggregate settlements by Business and Month
    const groupedSettlements = [];

    settlements.forEach(biz => {
        const paymentsByMonth = {};

        (biz.payments || []).forEach(p => {
            const date = dayjs(p.created_at);
            const monthKey = date.format('YYYY-MM');
            const monthLabel = date.format('MMMM YYYY');

            if (!paymentsByMonth[monthKey]) {
                paymentsByMonth[monthKey] = {
                    monthKey,
                    monthLabel,
                    payments: []
                };
            }
            paymentsByMonth[monthKey].payments.push(p);
        });

        if (Object.keys(paymentsByMonth).length === 0) {
            groupedSettlements.push({
                id: biz.id,
                business_name: biz.business_name,
                business_type: biz.business_type,
                owner: biz.owner,
                monthKey: null,
                monthLabel: '—',
                totalBookings: 0,
                portalPayment: 0,
                commission: 0,
                payToCustomer: 0,
                status: 'no_payments',
                account_details: biz.account_details,
                payments: []
            });
        } else {
            Object.values(paymentsByMonth).forEach(group => {
                const portalPayment = group.payments.reduce((sum, p) => sum + parseFloat(p.paid_amount || p.amount || 0), 0);
                const commission = group.payments.reduce((sum, p) => sum + parseFloat(p.platform_fees || 0), 0);
                const payToCustomer = group.payments.reduce((sum, p) => sum + parseFloat(p.final_amount || 0), 0);
                const totalBookings = group.payments.length;

                const hasUnpaid = group.payments.some(p => p.settlement_status === 'unpaid');
                const status = hasUnpaid ? 'unpaid' : 'paid';

                groupedSettlements.push({
                    id: biz.id,
                    business_name: biz.business_name,
                    business_type: biz.business_type,
                    owner: biz.owner,
                    monthKey: group.monthKey,
                    monthLabel: group.monthLabel,
                    totalBookings,
                    portalPayment,
                    commission,
                    payToCustomer,
                    status,
                    account_details: biz.account_details,
                    payments: group.payments
                });
            });
        }
    });

    // Filter by selectedMonth if picker is active
    const filteredByMonthSettlements = groupedSettlements.filter(bizGroup => {
        if (!selectedMonth) return true;
        if (!bizGroup.monthKey) return false;
        return bizGroup.monthKey === selectedMonth.format('YYYY-MM');
    });

    // Calculations for overall stats cards
    const totalPortalPayments = filteredByMonthSettlements.reduce((sum, s) => sum + parseFloat(s.portalPayment || 0), 0);
    const totalCommissions = filteredByMonthSettlements.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0);
    
    const totalPendingPayout = filteredByMonthSettlements.reduce((sum, s) => {
        const unpaidPayments = s.payments?.filter(p => p.settlement_status === 'unpaid') || [];
        return sum + unpaidPayments.reduce((pSum, p) => pSum + parseFloat(p.final_amount || 0), 0);
    }, 0);

    const totalSettledPayout = filteredByMonthSettlements.reduce((sum, s) => {
        const paidPayments = s.payments?.filter(p => p.settlement_status === 'paid') || [];
        return sum + paidPayments.reduce((pSum, p) => pSum + parseFloat(p.final_amount || 0), 0);
    }, 0);

    // Filtering businesses
    const filteredSettlements = filteredByMonthSettlements.filter(s => 
        s.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenAccountDialog = (biz) => {
        setSelectedBusiness(biz);
        setOpenAccountDialog(true);
    };

    const handleOpenBreakdownDialog = (bizGroup) => {
        setSelectedBusiness(bizGroup);
        setOpenBreakdownDialog(true);
    };

    return (
        <PageTransition>
            {/* Header section */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Settlements Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage vendor payouts, track portal commissions, and review billing details.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Filter by Month"
                            value={selectedMonth}
                            onChange={(val) => setSelectedMonth(val)}
                            views={['year', 'month']}
                            openTo="month"
                            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
                        />
                    </LocalizationProvider>
                    {selectedMonth && (
                        <Button
                            variant="text"
                            onClick={() => setSelectedMonth(null)}
                            sx={{ fontWeight: 700, textTransform: 'none' }}
                        >
                            All Time
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchSettlements}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, height: 40 }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* Overall stats cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL PORTAL PAYMENT</Typography>
                                <Box sx={{ p: 1, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 2 }}>
                                    <PaymentsIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h5" fontWeight={900}>₹{totalPortalPayments.toLocaleString()}</Typography>
                            <Typography variant="caption" color="text.secondary">Collected from customer bookings</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>COMMISSION (PORTAL CUT)</Typography>
                                <Box sx={{ p: 1, bgcolor: 'success.50', color: 'success.main', borderRadius: 2 }}>
                                    <WalletIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h5" fontWeight={900} color="success.main">₹{totalCommissions.toLocaleString()}</Typography>
                            <Typography variant="caption" color="text.secondary">Platform fees accumulated</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>PAYOUTS SETTLED</Typography>
                                <Box sx={{ p: 1, bgcolor: 'info.50', color: 'info.main', borderRadius: 2 }}>
                                    <CheckCircleIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h5" fontWeight={900} color="info.main">₹{totalSettledPayout.toLocaleString()}</Typography>
                            <Typography variant="caption" color="text.secondary">Transferred to vendor accounts</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: totalPendingPayout > 0 ? 'warning.light' : 'transparent' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>PAYOUTS PENDING</Typography>
                                <Box sx={{ p: 1, bgcolor: 'warning.50', color: 'warning.main', borderRadius: 2 }}>
                                    <SettleIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="h5" fontWeight={900} color="warning.main">₹{totalPendingPayout.toLocaleString()}</Typography>
                            <Typography variant="caption" color="text.secondary">Awaiting manual clearance</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Settlements Table */}
            <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <TextField
                        size="small"
                        placeholder="Search by business name or owner..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: '100%', md: 350 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, width: 60 }}>Sr. No</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Business Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Total Bookings</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Portal Payment</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Commission</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Pay to Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Account Details</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={30} />
                                        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Calculating settlements...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSettlements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">No settlements data available.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSettlements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((biz, index) => (
                                <TableRow key={`${biz.id}-${biz.monthKey || 'none'}`} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                        {page * rowsPerPage + index + 1}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'primary.light' }}>
                                        {biz.monthLabel}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={800}>{biz.business_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{biz.owner?.name || '—'}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{biz.totalBookings}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>₹{biz.portalPayment.toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹{biz.commission.toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>₹{biz.payToCustomer.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {biz.status === 'paid' ? (
                                            <Chip label="Settled" size="small" color="success" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                        ) : biz.status === 'unpaid' ? (
                                            <Chip label="Pending" size="small" color="warning" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                        ) : (
                                            <Chip label="No Transactions" size="small" sx={{ fontWeight: 700, borderRadius: 1.5, opacity: 0.6 }} />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="View Payout Credentials">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenAccountDialog(biz)}
                                                sx={{ bgcolor: 'primary.50' }}
                                            >
                                                <BankIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
                                            <Tooltip title="View Breakdown" arrow>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenBreakdownDialog(biz)}
                                                    sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Checkbox
                                                checked={biz.status === 'paid'}
                                                disabled={biz.status === 'paid' || biz.status === 'no_payments' || actionLoading}
                                                onChange={() => handleSettleAllForGroup(biz)}
                                                color="success"
                                                size="small"
                                            />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredSettlements.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>

            {/* Account Payout Details Dialog */}
            <Dialog
                open={openAccountDialog}
                onClose={() => setOpenAccountDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BankIcon color="primary" />
                        <Typography variant="h6" fontWeight={800}>Payout Account</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setOpenAccountDialog(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedBusiness && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">BUSINESS NAME</Typography>
                                <Typography variant="body1" fontWeight={800}>{selectedBusiness.business_name}</Typography>
                            </Box>

                            {selectedBusiness.account_details?.upi_id ? (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>UPI ID</Typography>
                                        <IconButton size="small" onClick={() => copyToClipboard(selectedBusiness.account_details.upi_id, 'UPI ID')}>
                                            <CopyIcon fontSize="inherit" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                                        {selectedBusiness.account_details.upi_id}
                                    </Typography>
                                </Box>
                            ) : null}

                            {selectedBusiness.account_details?.account_number ? (
                                <>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">ACCOUNT HOLDER</Typography>
                                        <Typography variant="body1" fontWeight={700}>{selectedBusiness.account_details.account_holder_name || '—'}</Typography>
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>ACCOUNT NUMBER</Typography>
                                            <IconButton size="small" onClick={() => copyToClipboard(selectedBusiness.account_details.account_number, 'Account Number')}>
                                                <CopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                                            {selectedBusiness.account_details.account_number}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>IFSC CODE</Typography>
                                            <IconButton size="small" onClick={() => copyToClipboard(selectedBusiness.account_details.ifsc_code, 'IFSC Code')}>
                                                <CopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                                            {selectedBusiness.account_details.ifsc_code}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">BANK NAME</Typography>
                                        <Typography variant="body1" fontWeight={700}>{selectedBusiness.account_details.bank_name || '—'}</Typography>
                                    </Box>
                                </>
                            ) : null}

                            {!selectedBusiness.account_details?.upi_id && !selectedBusiness.account_details?.account_number && (
                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <InfoIcon color="action" />
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        No payout credentials configured by this business.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAccountDialog(false)} variant="contained" fullWidth sx={{ borderRadius: 2, fontWeight: 700 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payout Breakdown/Transactions Dialog */}
            <Dialog
                open={openBreakdownDialog}
                onClose={() => setOpenBreakdownDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WalletIcon color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Payments Breakdown</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mt: -0.5 }}>
                                {selectedBusiness?.business_name} {selectedMonth ? `— ${selectedMonth.format('MMMM YYYY')}` : '— All Time'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setOpenBreakdownDialog(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {selectedBusiness && (
                        <Box sx={{ p: 3 }}>
                            {/* Summary strip */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">TOTAL PAYMENTS</Typography>
                                    <Typography variant="subtitle1" fontWeight={800}>₹{selectedBusiness.portalPayment.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">PLATFORM COMMISSION</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="success.main">₹{selectedBusiness.commission.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">PAYOUT DUE</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">₹{selectedBusiness.payToCustomer.toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {selectedBusiness.status === 'unpaid' && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            disabled={actionLoading}
                                            onClick={() => handleSettleAllForGroup(selectedBusiness)}
                                            startIcon={<SettleIcon />}
                                            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
                                        >
                                            {actionLoading ? 'Settling...' : 'Settle All Pending'}
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 2 }} />

                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Txn ID / Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Paid Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Commission</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Final Payout</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedBusiness.payments?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                    <Typography color="text.secondary" variant="body2">No transactions recorded.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : selectedBusiness.payments.map((p) => (
                                            <TableRow key={p.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                                        {p.transaction_id || '—'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {formatDate(p.created_at)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>#{p.booking_id}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>₹{p.paid_amount.toLocaleString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>₹{p.platform_fees.toLocaleString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>₹{p.final_amount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={p.settlement_status.toUpperCase()}
                                                        size="small"
                                                        color={p.settlement_status === 'paid' ? 'success' : 'warning'}
                                                        sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.65rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Checkbox
                                                        checked={p.settlement_status === 'paid'}
                                                        disabled={p.settlement_status === 'paid' || actionLoading}
                                                        onChange={() => handleSettlePayment(p.id, selectedBusiness.id, selectedBusiness.monthKey)}
                                                        color="success"
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenBreakdownDialog(false)} variant="contained" sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </PageTransition>
    );
};

export default PortalSettlements;
