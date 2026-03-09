import React, { useState, useEffect } from 'react';
import {
    Grid, Card, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Avatar,
} from '@mui/material';
import {
    Business as BusinessIcon, People as StaffIcon,
    EventAvailable as BookingsIcon, Payments as RevenueIcon,
    TrendingUp as TrendIcon,
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
    const [businesses, setBusinesses] = useState([]);
    const [staff, setStaff] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const recentBookings = [...filteredDashboardBookings].reverse().slice(0, 5);

    return (
        <PageTransition>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800}>Dashboard</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Overview of your booking platform performance
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Businesses" value={loading ? '...' : businesses.length} icon={<BusinessIcon sx={{ fontSize: 26 }} />} color="#6366f1" subtitle={loading ? 'Loading...' : `${businesses.filter(b => b.status === 'Active').length} active`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Staff" value={loading ? '...' : staff.length} icon={<StaffIcon sx={{ fontSize: 26 }} />} color="#0ea5e9" subtitle={loading ? 'Loading...' : `${staff.filter(s => s.status === 'Active').length} active`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Bookings" value={loading ? '...' : bookings.length} icon={<BookingsIcon sx={{ fontSize: 26 }} />} color="#10b981" subtitle={loading ? 'Loading...' : `${customers.length} customers`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Payments" value={loading ? '...' : `₹${totalRevenue.toLocaleString()}`} icon={<RevenueIcon sx={{ fontSize: 26 }} />} color="#f59e0b" subtitle={loading ? 'Loading...' : `${payments.length} transactions`} />
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <TrendIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>Recent Bookings</Typography>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
                                <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    {searchQuery ? 'No bookings match your search.' : 'No bookings yet. Go to the Bookings page to create one!'}
                                </TableCell>
                            </TableRow>
                        ) : recentBookings.map((b, index) => {
                            const customer = customers.find(c => c.id === b.customer_id);
                            const staffMember = staff.find(s => s.id === b.staff_id);
                            const service = services.find(s => s.id === b.service_id);
                            return (
                                <TableRow key={b.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: 'primary.light', color: 'primary.dark' }}>
                                                {customer?.name?.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={500}>{customer?.name || '—'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{staffMember?.staff_name || '—'}</TableCell>
                                    <TableCell>{service?.service_name || '—'}</TableCell>
                                    <TableCell>{formatDate(b.booking_date)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={(b.payment_status === true || b.payment_status === 1) ? 'Paid' : 'Pending'}
                                            size="small"
                                            color={(b.payment_status === true || b.payment_status === 1) ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={(b.status === true || b.status === 1) ? 'Confirmed' : 'Cancelled'}
                                            size="small"
                                            color={(b.status === true || b.status === 1) ? 'success' : 'error'}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageTransition>
    );
};

export default Dashboard;
