import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Typography, TablePagination, Box, Grid, Card, Divider, CircularProgress,
} from '@mui/material';
import { Payments as PayIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getPayments } from '../api/payment.api';
import { getBookings } from '../api/booking.api';
import { getCustomers } from '../api/customer.api';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';

const statusColors = { Completed: 'success', Pending: 'warning', Failed: 'error', Refunded: 'default' };

const Payments = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId } = useBusiness();
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedBusinessId]);

    const filteredPayments = payments.filter(p => {
        const matchesBusiness = selectedBusinessId === 'all' || String(p.business_id) === String(selectedBusinessId);
        if (!matchesBusiness) return false;

        return p.amount?.toString().includes(searchQuery) ||
            p.paid_amount?.toString().includes(searchQuery) ||
            p.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    }).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

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

    React.useEffect(() => {
        fetchData();
    }, []);

    return (
        <PageTransition>
            <PageHeader
                title="Payments"
                subtitle="Payment records are created automatically when a booking is completed via the widget."
            />
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Paid Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Remaining</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={32} />
                                </TableCell>
                            </TableRow>
                        ) : filteredPayments.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <PayIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {searchQuery ? 'No payments match your search.' : 'No payment records yet.'}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">Payments are recorded automatically when customers complete a booking via the widget.</Typography>
                            </TableCell></TableRow>
                        ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p, index) => {
                            const booking = bookings.find(b => b.id === p.booking_id);
                            const customer = customers.find(c => c.id === booking?.customer_id);
                            return (
                                <TableRow key={p.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{customer?.name || '—'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{customer?.phone}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>₹{p.amount}</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'success.main' }}>₹{p.paid_amount || p.amount}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>
                                    ₹{(Number(p.amount) - Number(p.paid_amount || p.amount)).toFixed(2)}
                                </TableCell>
                                <TableCell>{p.payment_method}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.transaction_id || '—'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={(p.payment_status === true || p.payment_status === 1) ? 'Paid' : 'Pending'}
                                        size="small"
                                        color={(p.payment_status === true || p.payment_status === 1) ? 'success' : 'warning'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</TableCell>
                            </TableRow>
                        );})}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                {loading ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : filteredPayments.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed divider' }}>
                        <Typography color="text.secondary">No payment records found</Typography>
                    </Paper>
                ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => {
                    const booking = bookings.find(b => b.id === p.booking_id);
                    const customer = customers.find(c => c.id === booking?.customer_id);
                    const isPaid = (p.payment_status === true || p.payment_status === 1);
                    const remaining = (Number(p.amount) - Number(p.paid_amount || p.amount)).toFixed(0);

                    return (
                        <Card key={p.id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={800}>{customer?.name || '—'}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                                    </Typography>
                                </Box>
                                <Chip 
                                    label={isPaid ? 'Paid' : 'Pending'} 
                                    size="small" 
                                    color={isPaid ? 'success' : 'warning'} 
                                    variant={isPaid ? 'contained' : 'outlined'}
                                    sx={{ fontWeight: 800, borderRadius: 1.5 }} 
                                />
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Paid Amount</Typography>
                                    <Typography variant="body2" fontWeight={800} color="success.main">₹{p.paid_amount || p.amount}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Method</Typography>
                                    <Typography variant="body2" fontWeight={700}>{p.payment_method}</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Total Due</Typography>
                                    <Typography variant="body2" fontWeight={700}>₹{p.amount}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Balance</Typography>
                                    <Typography variant="body2" fontWeight={900} color={Number(remaining) > 0 ? 'error.main' : 'success.main'}>
                                        ₹{remaining}
                                    </Typography>
                                </Box>
                            </Box>
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
        </PageTransition>
    );
};

export default Payments;
