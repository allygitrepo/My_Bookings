import React, { useState, useEffect } from 'react';
import {
    Grid, Card, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Avatar, TablePagination, CircularProgress, Divider, Alert
} from '@mui/material';
import {
    Business as BusinessIcon, People as StaffIcon,
    EventAvailable as BookingsIcon, Payments as RevenueIcon,
    TrendingUp as TrendIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getBusinesses } from '../api/business.api';
import { getStaff } from '../api/staff.api';
import { getBookings } from '../api/booking.api';
import { getServices } from '../api/service.api';
import { getCustomers } from '../api/customer.api';
import { getPayments } from '../api/payment.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';
import PageTransition from '../components/PageTransition';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/date';

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card sx={{
            p: 3, height: '100%',
            background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
            border: '1px solid', borderColor: `${color}20`,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} mb={0.5}>{title}</Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1 }}>{value}</Typography>
                    {subtitle && <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{subtitle}</Typography>}
                </Box>
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 52, height: 52, borderRadius: 2.5,
                    bgcolor: `${color}15`, color: color,
                }}>
                    {icon}
                </Box>
            </Box>
        </Card>
    </motion.div>
);

const statusColors = {
    Confirmed: 'success', Completed: 'info', Cancelled: 'error', Pending: 'warning',
};
const paymentColors = { Paid: 'success', Pending: 'warning', Refunded: 'default', Failed: 'error' };

const Dashboard = () => {
    const { searchQuery } = useSearch();
    const { isSuspended, suspendedReason } = useBusiness();
    const [businesses, setBusinesses] = useState([]);
    const [staff, setStaff] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    const filteredDashboardBookings = bookings.filter(b => {
        const customer = customers.find(c => c.id === b.customer_id);
        const staffMember = staff.find(s => s.id === b.staff_id);
        const service = services.find(s => s.id === b.service_id);
        const q = searchQuery.toLowerCase();
        return (
            customer?.name?.toLowerCase().includes(q) ||
            staffMember?.staff_name?.toLowerCase().includes(q) ||
            service?.service_name?.toLowerCase().includes(q) ||
            b.booking_date?.toLowerCase().includes(q)
        );
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bizRes, staffRes, bookRes, svcRes, custRes, payRes] = await Promise.all([
                getBusinesses(), getStaff(), getBookings(), getServices(), getCustomers(), getPayments()
            ]);
            if (bizRes.success) setBusinesses(bizRes.data);
            if (staffRes.success) setStaff(staffRes.data);
            if (bookRes.success) setBookings(bookRes.data);
            if (svcRes.success) setServices(svcRes.data);
            if (custRes.success) setCustomers(custRes.data);
            if (payRes.success) setPayments(payRes.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const totalRevenue = payments
        .filter(p => p.payment_status === true || p.payment_status === 1)
        .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

    const recentBookings = [...filteredDashboardBookings].sort((a, b) => {
        const dateA = a.booking_date || "";
        const dateB = b.booking_date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.start_time || "").localeCompare(b.start_time || "");
    });

    return (
        <PageTransition>
            {isSuspended && (
                <Alert 
                    severity="error" 
                    variant="filled"
                    icon={<WarningIcon />}
                    sx={{ 
                        mb: 4, 
                        borderRadius: 3, 
                        fontWeight: 700,
                        boxShadow: '0 8px 24px -12px rgba(239, 68, 68, 0.5)',
                        '& .MuiAlert-message': { width: '100%' }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                THIS BUSINESS IS CURRENTLY SUSPENDED
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Reason: {suspendedReason || "Violation of platform policies. Public pages and booking systems are disabled."}
                            </Typography>
                        </Box>
                    </Box>
                </Alert>
            )}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800}>Dashboard</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Overview of your booking platform performance
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Businesses" value={loading ? '...' : businesses.length} icon={<BusinessIcon sx={{ fontSize: 26 }} />} color="#6366f1" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Staff" value={loading ? '...' : staff.length} icon={<StaffIcon sx={{ fontSize: 26 }} />} color="#0ea5e9" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Bookings" value={loading ? '...' : bookings.length} icon={<BookingsIcon sx={{ fontSize: 26 }} />} color="#10b981" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Payments" value={loading ? '...' : `₹${totalRevenue.toLocaleString()}`} icon={<RevenueIcon sx={{ fontSize: 26 }} />} color="#f59e0b" />
                </Grid>
            </Grid>            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <TrendIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={800}>Recent Bookings</Typography>
            </Box>

            {/* Desktop Table View */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Staff</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                    <Typography color="text.secondary">Loading recent bookings...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : recentBookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    {searchQuery ? 'No bookings match your search.' : 'No bookings yet. Go to the Bookings page to create one!'}
                                </TableCell>
                            </TableRow>
                        ) : recentBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b, index) => {
                            const customer = customers.find(c => c.id === b.customer_id);
                            const staffMember = staff.find(s => s.id === b.staff_id);
                            const service = services.find(s => s.id === b.service_id);
                            const isConfirmedInDb = (b.status === true || b.status === 1);
                            const bookingDateTime = new Date(`${b.booking_date} ${b.end_time || b.start_time}`);
                            const isPast = bookingDateTime < new Date();
                            const statusLabel = isConfirmedInDb ? (isPast ? 'Completed' : 'Confirmed') : 'Cancelled';
                            const statusColor = isConfirmedInDb ? (isPast ? 'info' : 'success') : 'error';

                            return (
                                <TableRow key={b.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 }}>
                                                {customer?.name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>{customer?.name || '—'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customer?.phone}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{staffMember?.staff_name || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{service?.service_name || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{formatDate(b.booking_date)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={(b.payment_status === true || b.payment_status === 1) ? 'Paid' : 'Pending'}
                                            size="small"
                                            color={(b.payment_status === true || b.payment_status === 1) ? 'success' : 'warning'}
                                            variant="outlined"
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={statusLabel} size="small" color={statusColor} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
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
                ) : recentBookings.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed divider' }}>
                        <Typography color="text.secondary">No bookings found</Typography>
                    </Paper>
                ) : recentBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => {
                    const customer = customers.find(c => c.id === b.customer_id);
                    const staffMember = staff.find(s => s.id === b.staff_id);
                    const service = services.find(s => s.id === b.service_id);
                    const isConfirmedInDb = (b.status === true || b.status === 1);
                    const bookingDateTime = new Date(`${b.booking_date} ${b.end_time || b.start_time}`);
                    const isPast = bookingDateTime < new Date();
                    const statusLabel = isConfirmedInDb ? (isPast ? 'Completed' : 'Confirmed') : 'Cancelled';
                    const statusColor = isConfirmedInDb ? (isPast ? 'info' : 'success') : 'error';

                    return (
                        <Card key={b.id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700 }}>
                                        {customer?.name?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800}>{customer?.name || 'Guest'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{formatDate(b.booking_date)} • {b.start_time?.slice(0, 5)}</Typography>
                                    </Box>
                                </Box>
                                <Chip label={statusLabel} size="small" color={statusColor} sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }} />
                            </Box>

                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Service</Typography>
                                    <Typography variant="body2" fontWeight={700}>{service?.service_name || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Staff</Typography>
                                    <Typography variant="body2" fontWeight={700}>{staffMember?.staff_name || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Payment</Typography>
                                    <Chip
                                        label={(b.payment_status === true || b.payment_status === 1) ? 'Paid' : 'Pending'}
                                        size="small"
                                        variant="filled"
                                        color={(b.payment_status === true || b.payment_status === 1) ? 'success' : 'warning'}
                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                                    />
                                </Grid>
                            </Grid>
                        </Card>
                    );
                })}
            </Box>

            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50]}
                component="div"
                count={recentBookings.length}
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

export default Dashboard;
