import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Box, Typography, Avatar,
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { useBookings, useBusinesses, useLocations, useStaff, useServices, useCustomers } from '../store';

const statusColors = { Confirmed: 'success', Completed: 'info', Cancelled: 'error', Pending: 'warning' };
const paymentColors = { Paid: 'success', Pending: 'warning', Refunded: 'default', Failed: 'error' };

const Bookings = () => {
    const [bookings] = useBookings();
    const [businesses] = useBusinesses();
    const [locations] = useLocations();
    const [staff] = useStaff();
    const [services] = useServices();
    const [customers] = useCustomers();

    return (
        <PageTransition>
            <PageHeader
                title="Bookings"
                subtitle="All customer appointments. Bookings are created via the widget."
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.length === 0 && (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <CalendarIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">No bookings yet.</Typography>
                                <Typography variant="caption" color="text.disabled">Bookings appear here after customers book via the widget.</Typography>
                            </TableCell></TableRow>
                        )}
                        {[...bookings].reverse().map(b => {
                            const customer = customers.find(c => c.id === b.customer_id);
                            const service = services.find(s => s.id === b.service_id);
                            const staffMember = staff.find(s => s.id === b.staff_id);
                            return (
                                <TableRow key={b.id} hover>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.id}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.light', color: 'primary.dark' }}>
                                                {customer?.name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>{customer?.name || '—'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customer?.phone}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{service?.service_name || '—'}</TableCell>
                                    <TableCell>{staffMember?.staff_name || '—'}</TableCell>
                                    <TableCell>{b.booking_date || '—'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{b.start_time}{b.end_time ? ` – ${b.end_time}` : ''}</TableCell>
                                    <TableCell><Chip label={b.payment_status || 'Pending'} size="small" color={paymentColors[b.payment_status] || 'default'} variant="outlined" /></TableCell>
                                    <TableCell><Chip label={b.status || 'Pending'} size="small" color={statusColors[b.status] || 'default'} /></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageTransition>
    );
};

export default Bookings;
