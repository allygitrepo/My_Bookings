import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Typography, TablePagination,
} from '@mui/material';
import { Payments as PayIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getPayments } from '../api/payment.api';
import { getBookings } from '../api/booking.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

const statusColors = { Completed: 'success', Pending: 'warning', Failed: 'error', Refunded: 'default' };

const Payments = () => {
    const { searchQuery } = useSearch();
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    const filteredPayments = payments.filter(p =>
        p.amount?.toString().includes(searchQuery) ||
        p.paid_amount?.toString().includes(searchQuery) ||
        p.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, bookRes] = await Promise.all([getPayments(), getBookings()]);
            if (payRes.success) setPayments(payRes.data);
            if (bookRes.success) setBookings(bookRes.data);
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
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
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
                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary">Loading payments...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredPayments.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <PayIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {searchQuery ? 'No payments match your search.' : 'No payment records yet.'}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">Payments are recorded automatically when customers complete a booking via the widget.</Typography>
                            </TableCell></TableRow>
                        ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p, index) => (
                            <TableRow key={p.id} hover>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
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
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
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
