import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    Typography,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import { useBookings, useCustomers, useStaff, useServices } from '../store';

const Bookings = () => {
    const [bookings] = useBookings();
    const [customers] = useCustomers();
    const [staff] = useStaff();
    const [services] = useServices();

    return (
        <>
            <PageHeader
                title="Bookings"
                subtitle="View and manage all customer appointments."
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    No bookings available. Have your customers use the widget to book services.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {[...bookings].reverse().map((booking) => {
                            const customer = customers.find((c) => c.id === booking.customerId);
                            const service = services.find((s) => s.id === booking.serviceId);
                            const staffMember = staff.find((s) => s.id === booking.staffId);

                            return (
                                <TableRow key={booking.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{booking.id}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{customer?.name || 'Unknown'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{customer?.email}</Typography>
                                    </TableCell>
                                    <TableCell>{service?.name || 'Unknown'}</TableCell>
                                    <TableCell>{staffMember?.name || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">{booking.date}</Typography>
                                            <Typography variant="caption" color="text.secondary">{booking.time}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={booking.bookingStatus}
                                            size="small"
                                            color={booking.bookingStatus === 'Confirmed' ? 'success' : 'info'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={booking.paymentStatus}
                                            size="small"
                                            variant="outlined"
                                            color={booking.paymentStatus === 'Paid' ? 'success' : 'warning'}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default Bookings;
