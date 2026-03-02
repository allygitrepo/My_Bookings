import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import { usePayments, useBookings } from '../store';

const Payments = () => {
    const [payments] = usePayments();
    const [bookings] = useBookings();

    return (
        <>
            <PageHeader
                title="Payments"
                subtitle="Track revenue and transaction history."
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Payment ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Booking Ref</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    No payment records found.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {[...payments].reverse().map((payment) => {
                            const booking = bookings.find((b) => b.id === payment.bookingId);

                            return (
                                <TableRow key={payment.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{payment.id}</TableCell>
                                    <TableCell>{booking ? booking.id : payment.bookingId}</TableCell>
                                    <TableCell>${payment.amount}</TableCell>
                                    <TableCell>{payment.method}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{payment.transactionId}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={payment.status}
                                            size="small"
                                            color={payment.status === 'Completed' ? 'success' : 'warning'}
                                        />
                                    </TableCell>
                                    <TableCell>{payment.date}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default Payments;
