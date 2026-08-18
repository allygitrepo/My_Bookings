import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Typography, TablePagination, Box, Grid, Card, Divider, CircularProgress, Button,
    Tabs, Tab, Switch, FormControlLabel, TextField, InputAdornment, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Payments as PayIcon,
    CreditCard as CardIcon,
    QrCode2 as QrIcon,
    LocalAtm as CashIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
    AccountBalance as BankIcon,
    Security as SecurityIcon,
    AddPhotoAlternate as UploadIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getPayments, updatePayment, settlePayments } from '../api/payment.api';
import { getBookings } from '../api/booking.api';
import { getCustomers } from '../api/customer.api';
import { updateBusiness } from '../api/business.api';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/date';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { compressImage } from '../utils/imageHelper';

const Payments = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId, businesses, refreshBusinesses } = useBusiness();
    const { usage } = useSubscription();

    const [activeTab, setActiveTab] = useState(0);
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingGateways, setSavingGateways] = useState(false);
    const [settling, setSettling] = useState(false);
    const [settleDialogOpen, setSettleDialogOpen] = useState(false);
    const [settleAmountInput, setSettleAmountInput] = useState('');
    const [targetPaymentId, setTargetPaymentId] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Selected business payment settings state
    const [gatewayForm, setGatewayForm] = useState({
        razorpay_enabled: false,
        razorpay_key_id: '',
        razorpay_key_secret: '',
        stripe_enabled: false,
        stripe_publishable_key: '',
        stripe_secret_key: '',
        upi_enabled: false,
        upi_id: '',
        upi_qr_code: '',
        cash_on_arrival_enabled: true,
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        bank_name: ''
    });

    const currentBiz = businesses.find(b => String(b.id) === String(selectedBusinessId)) || businesses[0];

    useEffect(() => {
        if (currentBiz) {
            setGatewayForm({
                razorpay_enabled: !!currentBiz.razorpay_enabled,
                razorpay_key_id: currentBiz.razorpay_key_id || '',
                razorpay_key_secret: currentBiz.razorpay_key_secret || '',
                stripe_enabled: !!currentBiz.stripe_enabled,
                stripe_publishable_key: currentBiz.stripe_publishable_key || '',
                stripe_secret_key: currentBiz.stripe_secret_key || '',
                upi_enabled: !!currentBiz.upi_enabled,
                upi_id: currentBiz.upi_id || '',
                upi_qr_code: currentBiz.upi_qr_code || '',
                cash_on_arrival_enabled: currentBiz.cash_on_arrival_enabled !== false,
                account_holder_name: currentBiz.account_holder_name || '',
                account_number: currentBiz.account_number || '',
                ifsc_code: currentBiz.ifsc_code || '',
                bank_name: currentBiz.bank_name || ''
            });
        }
    }, [selectedBusinessId, businesses]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedBusinessId, startDate, endDate]);

    const filteredPayments = payments.filter(p => {
        const matchesBusiness = selectedBusinessId === 'all' || String(p.business_id) === String(selectedBusinessId);
        if (!matchesBusiness) return false;

        const paymentDate = dayjs(p.created_at);
        const matchesStart = !startDate || paymentDate.isAfter(dayjs(startDate).startOf('day')) || paymentDate.isSame(dayjs(startDate).startOf('day'));
        const matchesEnd = !endDate || paymentDate.isBefore(dayjs(endDate).endOf('day')) || paymentDate.isSame(dayjs(endDate).endOf('day'));
        if (!matchesStart || !matchesEnd) return false;

        return p.amount?.toString().includes(searchQuery) ||
            p.paid_amount?.toString().includes(searchQuery) ||
            p.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const totalPendingSettlement = filteredPayments.reduce((sum, p) => {
        const actualPaid = parseFloat(p.paid_amount || p.amount || 0);
        const totalAmt = parseFloat(p.amount || 0);
        const pendingBal = Math.max(0, totalAmt - actualPaid);
        if (p.settlement_status === 'unpaid' && pendingBal > 0) {
            return sum + pendingBal;
        }
        return sum;
    }, 0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, bookRes, custRes] = await Promise.all([getPayments(), getBookings(), getCustomers()]);
            if (payRes.success) setPayments(payRes.data);
            if (bookRes.success) setBookings(bookRes.data);
            if (custRes.success) setCustomers(custRes.data);
        } catch (error) {
            toast.error('Failed to fetch payments data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSettleDialog = (paymentId = null, initialAmount = 0) => {
        setTargetPaymentId(paymentId);
        setSettleAmountInput(initialAmount ? String(initialAmount) : (totalPendingSettlement ? String(totalPendingSettlement) : ''));
        setSettleDialogOpen(true);
    };

    const handleConfirmSettle = async () => {
        const amt = parseFloat(settleAmountInput);
        if (isNaN(amt) || amt <= 0) {
            toast.error('Please enter a valid settlement amount greater than 0');
            return;
        }

        setSettling(true);
        try {
            if (targetPaymentId) {
                const targetP = payments.find(p => p.id === targetPaymentId);
                const currentPaid = parseFloat(targetP?.paid_amount || targetP?.amount || 0);
                const totalAmt = parseFloat(targetP?.amount || 0);
                const newPaid = Math.min(totalAmt, currentPaid + amt);
                const newStatus = newPaid >= totalAmt ? 'paid' : 'unpaid';

                const res = await updatePayment(targetPaymentId, { paid_amount: newPaid });
                if (res.success) {
                    setPayments(prev => prev.map(p => p.id === targetPaymentId ? {
                        ...p,
                        paid_amount: newPaid,
                        settlement_status: newStatus,
                        payment_status: true
                    } : p));
                    toast.success(`Settled ₹${amt.toFixed(2)} payout! (Paid: ₹${newPaid.toFixed(2)} / ₹${totalAmt.toFixed(2)})`);
                    setSettleDialogOpen(false);
                } else {
                    toast.error(res.message || 'Failed to settle payment');
                }
            } else {
                const res = await settlePayments({ 
                    amount: amt, 
                    business_id: selectedBusinessId 
                });
                if (res.success) {
                    if (res.settledIds && res.settledIds.length > 0) {
                        setPayments(prev => prev.map(p => res.settledIds.includes(p.id) ? { ...p, settlement_status: 'paid' } : p));
                    } else {
                        await fetchData();
                    }
                    toast.success(res.message || `Settled ₹${amt.toFixed(2)} payout successfully!`);
                    setSettleDialogOpen(false);
                } else {
                    toast.error(res.message || 'Failed to settle payments');
                }
            }
        } catch (error) {
            toast.error('Error settling payment');
        } finally {
            setSettling(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleQrUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setGatewayForm(prev => ({ ...prev, upi_qr_code: compressed }));
            toast.success('UPI QR Code image uploaded!');
        } catch (err) {
            toast.error('Failed to process QR image');
        }
    };

    const handleSaveGateways = async () => {
        if (!currentBiz) {
            toast.error('Please select a business to update payment gateways');
            return;
        }

        setSavingGateways(true);
        try {
            const res = await updateBusiness(currentBiz.id, gatewayForm);
            if (res.success) {
                toast.success('Payment Gateway settings saved successfully!');
                if (typeof refreshBusinesses === 'function') await refreshBusinesses();
            } else {
                toast.error(res.message || 'Failed to save gateway settings');
            }
        } catch (error) {
            console.error('Save Gateways Error:', error);
            toast.error('Error saving gateway settings');
        } finally {
            setSavingGateways(false);
        }
    };

    return (
        <PageTransition>
            <PageHeader
                title="Payments & Gateway Settings"
                subtitle="Track customer payments or configure custom payment gateways to receive funds directly into your own account."
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
                    <Tab label="Payment Transactions" icon={<PayIcon />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    <Tab label="Payment Gateways Integration" icon={<CardIcon />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
                </Tabs>
            </Box>

            {/* TAB 0: TRANSACTIONS LIST */}
            {activeTab === 0 && (
                <>
                    <Box sx={{ mb: 4, display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="From"
                                    value={startDate}
                                    onChange={(val) => setStartDate(val)}
                                    format="DD/MM/YYYY"
                                    slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                                />
                                <DatePicker
                                    label="To"
                                    value={endDate}
                                    onChange={(val) => setEndDate(val)}
                                    format="DD/MM/YYYY"
                                    slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                                />
                            </LocalizationProvider>
                            {(startDate || endDate) && (
                                <Button
                                    variant="text"
                                    onClick={() => { setStartDate(null); setEndDate(null); }}
                                    sx={{ fontWeight: 700, textTransform: 'none' }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ 
                                height: 40, 
                                borderRadius: '12px', 
                                bgcolor: 'primary.light', 
                                color: 'primary.dark', 
                                px: 2.5, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1.5,
                                border: '1px solid',
                                borderColor: 'primary.main',
                                fontWeight: 800
                            }}>
                                <Typography variant="body2" fontWeight={800}>Pending Settlement Payout:</Typography>
                                <Typography variant="subtitle2" fontWeight={900}>₹{totalPendingSettlement.toFixed(2)}</Typography>
                            </Box>
                            {totalPendingSettlement > 0 && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    disabled={settling}
                                    onClick={() => handleOpenSettleDialog(null, totalPendingSettlement)}
                                    sx={{ borderRadius: '10px', height: 40, px: 2.5, fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                                >
                                    Settle Payout
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Desktop Table View */}
                    <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Paid Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Pending Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Income</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Settlement Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={32} />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                            No payment records found.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p, index) => {
                                    const booking = bookings.find(b => b.id === p.booking_id);
                                    const customer = customers.find(c => String(c.id) === String(booking?.customer_id || p.customer_id));
                                    const totalAmount = parseFloat(p.amount || 0);
                                    const actualPaidAmount = parseFloat(p.paid_amount || p.amount || 0);
                                    const pendingAmt = Math.max(0, totalAmount - actualPaidAmount);
                                    const isSettled = p.settlement_status === 'paid' || pendingAmt === 0;
                                    const netIncome = Math.max(0, actualPaidAmount - parseFloat(p.platform_fees || 0));

                                    return (
                                        <TableRow key={p.id} hover>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>{customer?.name || '—'}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{p.payment_method || 'Razorpay'}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transaction_id || '—'}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>₹{totalAmount}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹{actualPaidAmount}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: pendingAmt > 0 ? 'error.main' : 'text.secondary' }}>₹{pendingAmt.toFixed(2)}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>₹{netIncome.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isSettled ? 'Settled' : 'Unpaid'}
                                                    size="small"
                                                    color={isSettled ? 'success' : 'warning'}
                                                    variant={isSettled ? 'filled' : 'outlined'}
                                                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{formatDate(p.created_at)}</TableCell>
                                            <TableCell>
                                                {!isSettled ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleOpenSettleDialog(p.id, pendingAmt)}
                                                        sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5, py: 0.3, px: 1.5, fontSize: '0.75rem' }}
                                                    >
                                                        Settle
                                                    </Button>
                                                ) : (
                                                    <Chip label="Settled" size="small" variant="outlined" color="default" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                        {loading ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                        ) : filteredPayments.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed', borderColor: 'divider' }}>
                                <Typography variant="body2" color="text.secondary">No payments found</Typography>
                            </Paper>
                        ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => {
                            const booking = bookings.find(b => b.id === p.booking_id);
                            const customer = customers.find(c => String(c.id) === String(booking?.customer_id || p.customer_id));
                            const totalAmount = parseFloat(p.amount || 0);
                            const actualPaidAmount = parseFloat(p.paid_amount || p.amount || 0);
                            const pendingAmt = Math.max(0, totalAmount - actualPaidAmount);
                            const isSettled = p.settlement_status === 'paid' || pendingAmt === 0;
                            return (
                                <Card key={p.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography variant="subtitle2" fontWeight={800}>{customer?.name || 'Customer'}</Typography>
                                        <Chip
                                            label={isSettled ? 'Settled' : 'Unpaid'}
                                            size="small"
                                            color={isSettled ? 'success' : 'warning'}
                                            sx={{ fontWeight: 800 }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Transaction: {p.transaction_id || '—'}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">Date: {formatDate(p.created_at)}</Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">Paid Amount</Typography>
                                        <Typography variant="subtitle2" fontWeight={900} color="success.main">₹{actualPaidAmount}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">Pending Amount</Typography>
                                        <Typography variant="subtitle2" fontWeight={900} color={pendingAmt > 0 ? 'error.main' : 'text.secondary'}>₹{pendingAmt.toFixed(2)}</Typography>
                                    </Box>
                                    {!isSettled && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            fullWidth
                                            onClick={() => handleOpenSettleDialog(p.id, pendingAmt)}
                                            sx={{ mt: 1.5, borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
                                        >
                                            Settle Payment
                                        </Button>
                                    )}
                                </Card>
                            );
                        })}
                    </Box>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20, 30, 50]}
                        component="div"
                        count={filteredPayments.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={(e) => {
                            const rpp = parseInt(e.target.value, 10);
                            setRowsPerPage(rpp);
                            localStorage.setItem('rowsPerPage', rpp);
                            setPage(0);
                        }}
                    />
                </>
            )}

            {/* TAB 1: PAYMENT GATEWAYS INTEGRATION */}
            {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Alert severity="info" icon={<SecurityIcon />} sx={{ borderRadius: 3, fontWeight: 600 }}>
                        Configure your custom payment gateways for <strong>{currentBiz?.business_name || 'Selected Business'}</strong>. Customers will pay directly to your merchant account during booking.
                    </Alert>

                    <Grid container spacing={3}>
                        {/* 1. Custom Razorpay Account */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <PayIcon sx={{ color: '#0052FF', fontSize: 32 }} />
                                            <Box>
                                                <Typography variant="h6" fontWeight={800}>Razorpay Gateway</Typography>
                                                <Typography variant="caption" color="text.secondary">Direct merchant payout via Razorpay</Typography>
                                            </Box>
                                        </Box>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={gatewayForm.razorpay_enabled}
                                                    onChange={(e) => {
                                                        const isEnabling = e.target.checked;
                                                        if (isEnabling) {
                                                            if (!gatewayForm.razorpay_key_id?.trim() || !gatewayForm.razorpay_key_secret?.trim()) {
                                                                toast.error("Please enter both Razorpay Key ID & Key Secret before enabling Razorpay");
                                                                return;
                                                            }
                                                        }
                                                        setGatewayForm(prev => ({ 
                                                            ...prev, 
                                                            razorpay_enabled: isEnabling,
                                                            stripe_enabled: isEnabling ? false : prev.stripe_enabled
                                                        }));
                                                    }}
                                                    color="primary"
                                                />
                                            }
                                            label={gatewayForm.razorpay_enabled ? "Enabled" : "Disabled"}
                                        />
                                    </Box>

                                    <Divider sx={{ mb: 2.5 }} />

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            label="Razorpay Key ID"
                                            placeholder="rzp_live_xxxxxxxxxxxx"
                                            size="small"
                                            fullWidth
                                            value={gatewayForm.razorpay_key_id}
                                            onChange={(e) => setGatewayForm(prev => ({ ...prev, razorpay_key_id: e.target.value }))}
                                            helperText="Found in Razorpay Dashboard > Settings > API Keys"
                                        />
                                        <TextField
                                            label="Razorpay Key Secret"
                                            placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                                            type="password"
                                            size="small"
                                            fullWidth
                                            value={gatewayForm.razorpay_key_secret}
                                            onChange={(e) => setGatewayForm(prev => ({ ...prev, razorpay_key_secret: e.target.value }))}
                                        />
                                    </Box>
                                </Box>
                                {gatewayForm.razorpay_enabled && (
                                    <Chip label="Razorpay Active for Booking Widget" color="success" size="small" sx={{ mt: 2, fontWeight: 700, alignSelf: 'flex-start' }} />
                                )}
                            </Card>
                        </Grid>

                        {/* 2. Custom Stripe Account */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <CardIcon sx={{ color: '#635BFF', fontSize: 32 }} />
                                            <Box>
                                                <Typography variant="h6" fontWeight={800}>Stripe Gateway</Typography>
                                                <Typography variant="caption" color="text.secondary">Accept international card payments</Typography>
                                            </Box>
                                        </Box>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={gatewayForm.stripe_enabled}
                                                    onChange={(e) => {
                                                        const isEnabling = e.target.checked;
                                                        if (isEnabling) {
                                                            if (!gatewayForm.stripe_publishable_key?.trim() || !gatewayForm.stripe_secret_key?.trim()) {
                                                                toast.error("Please enter both Stripe Publishable Key & Secret Key before enabling Stripe");
                                                                return;
                                                            }
                                                        }
                                                        setGatewayForm(prev => ({ 
                                                            ...prev, 
                                                            stripe_enabled: isEnabling,
                                                            razorpay_enabled: isEnabling ? false : prev.razorpay_enabled
                                                        }));
                                                    }}
                                                    color="primary"
                                                />
                                            }
                                            label={gatewayForm.stripe_enabled ? "Enabled" : "Disabled"}
                                        />
                                    </Box>

                                    <Divider sx={{ mb: 2.5 }} />

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            label="Stripe Publishable Key"
                                            placeholder="pk_live_xxxxxxxxxxxx"
                                            size="small"
                                            fullWidth
                                            value={gatewayForm.stripe_publishable_key}
                                            onChange={(e) => setGatewayForm(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                                            helperText="Found in Stripe Dashboard > Developers > API Keys"
                                        />
                                        <TextField
                                            label="Stripe Secret Key"
                                            placeholder="sk_live_xxxxxxxxxxxx"
                                            type="password"
                                            size="small"
                                            fullWidth
                                            value={gatewayForm.stripe_secret_key}
                                            onChange={(e) => setGatewayForm(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                                        />
                                    </Box>
                                </Box>
                                {gatewayForm.stripe_enabled && (
                                    <Chip label="Stripe Active for Booking Widget" color="primary" size="small" sx={{ mt: 2, fontWeight: 700, alignSelf: 'flex-start' }} />
                                )}
                            </Card>
                        </Grid>

                        </Grid>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            disabled={savingGateways}
                            onClick={handleSaveGateways}
                            sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
                        >
                            {savingGateways ? 'Saving Settings...' : 'Save Gateway Settings'}
                        </Button>
                    </Box>
                </Box>
            )}
            {/* SETTLEMENT AMOUNT MODAL DIALOG */}
            <Dialog 
                open={settleDialogOpen} 
                onClose={() => !settling && setSettleDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: { xs: 300, sm: 420 } } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Settle Payment Payout</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {targetPaymentId 
                            ? 'Enter or confirm the settlement amount to mark for this transaction:' 
                            : `Enter the payout amount (₹) you wish to settle. Total pending payout: ₹${totalPendingSettlement.toFixed(2)}`}
                    </Typography>
                    <TextField
                        autoFocus
                        label="Settlement Amount (₹)"
                        type="number"
                        fullWidth
                        size="small"
                        value={settleAmountInput}
                        onChange={(e) => setSettleAmountInput(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        helperText={!targetPaymentId ? `Available pending payout: ₹${totalPendingSettlement.toFixed(2)}` : ''}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={() => setSettleDialogOpen(false)} 
                        disabled={settling} 
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        onClick={handleConfirmSettle} 
                        disabled={settling || !settleAmountInput || parseFloat(settleAmountInput) <= 0}
                        sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        {settling ? 'Processing...' : 'Confirm Settlement'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageTransition>
    );
};

export default Payments;
