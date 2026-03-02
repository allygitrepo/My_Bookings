import React from 'react';
import {
    Grid,
    Card,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import {
    Business as BusinessIcon,
    People as StaffIcon,
    Book as BookingsIcon,
    AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { useBusinesses, useStaff, useBookings, useServices, useCustomers } from '../store';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: `${color}.light`,
                color: `${color}.main`,
                mr: 2,
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
                {value}
            </Typography>
        </Box>
    </Card>
);

const Dashboard = () => {
    const [businesses] = useBusinesses();
    const [staff] = useStaff();
    const [bookings] = useBookings();
    const [services] = useServices();
    const [customers] = useCustomers();

    const totalRevenue = bookings
        .filter((b) => b.paymentStatus === 'Paid')
        .reduce((sum, b) => {
            const service = services.find((s) => s.id === b.serviceId);
            return sum + (service ? Number(service.price) : 0);
        }, 0);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Dashboard Overview
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Businesses" value={businesses.length} icon={<BusinessIcon />} color="primary" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Staff" value={staff.length} icon={<StaffIcon />} color="secondary" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Bookings" value={bookings.length} icon={<BookingsIcon />} color="success" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<RevenueIcon />} color="warning" />
                </Grid>
            </Grid>

            <Typography variant="h5" sx={{ mb: 2 }}>
                Recent Bookings
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Booking Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No bookings found. Try booking a service via the widget!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            [...bookings].reverse().slice(0, 5).map((booking) => {
                                const customer = customers.find((c) => c.id === booking.customerId);
                                const staffMember = staff.find((s) => s.id === booking.staffId);
                                const service = services.find((s) => s.id === booking.serviceId);

                                return (
                                    <TableRow key={booking.id} hover>
                                        <TableCell>{booking.id}</TableCell>
                                        <TableCell>{customer?.name || 'Unknown'}</TableCell>
                                        <TableCell>{staffMember?.name || 'Unknown'}</TableCell>
                                        <TableCell>{service?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            {booking.date} <br />
                                            <Typography variant="caption" color="text.secondary">
                                                {booking.time}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={booking.paymentStatus}
                                                size="small"
                                                color={
                                                    booking.paymentStatus === 'Paid'
                                                        ? 'success'
                                                        : booking.paymentStatus === 'Pending'
                                                            ? 'warning'
                                                            : 'error'
                                                }
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={booking.bookingStatus}
                                                size="small"
                                                color={
                                                    booking.bookingStatus === 'Confirmed'
                                                        ? 'success'
                                                        : booking.bookingStatus === 'Scheduled'
                                                            ? 'info'
                                                            : 'error'
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Dashboard;
