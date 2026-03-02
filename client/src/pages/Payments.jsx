import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Typography,
} from '@mui/material';
import { Payments as PayIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { usePayments, useBookings } from '../store';

const statusColors = { Completed: 'success', Pending: 'warning', Failed: 'error', Refunded: 'default' };

const Payments = () => {
    const [payments] = usePayments();
    const [bookings] = useBookings();

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
                            <TableCell sx={{ fontWeight: 600 }}>Payment ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.length === 0 && (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <PayIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">No payment records yet.</Typography>
                                <Typography variant="caption" color="text.disabled">Payments are recorded automatically when customers complete a booking via the widget.</Typography>
                            </TableCell></TableRow>
                        )}
                        {[...payments].reverse().map(p => (
                            <TableRow key={p.id} hover>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.id}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.booking_id}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹{p.amount}</TableCell>
                                <TableCell>{p.payment_method}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.transaction_id || '—'}</TableCell>
                                <TableCell><Chip label={p.payment_status} size="small" color={statusColors[p.payment_status] || 'default'} /></TableCell>
                                <TableCell>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageTransition>
    );
};

export default Payments;
