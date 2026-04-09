import React, { useState, useEffect } from 'react';
import {
    Grid, Card, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Avatar, CircularProgress, Divider
} from '@mui/material';
import {
    Business as BusinessIcon, People as StaffIcon,
    EventAvailable as BookingsIcon, Payments as RevenueIcon,
    TrendingUp as TrendIcon, Group as UserIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';

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

const PortalDashboard = () => {
    const [stats, setStats] = useState({
        totalBusinesses: 0,
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, bookingsRes] = await Promise.all([
                axiosInstance.get('/portal/dashboard'),
                axiosInstance.get('/portal/bookings')
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (bookingsRes.data.success) setRecentBookings(bookingsRes.data.data.slice(0, 10)); // Top 10
        } catch (error) {
            toast.error('Failed to fetch platform metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <PageTransition>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800}>System Overview</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Platform-wide performance and metrics across all businesses.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Businesses"
                        value={loading ? '...' : stats.totalBusinesses}
                        icon={<BusinessIcon sx={{ fontSize: 26 }} />}
                        color="#6366f1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Registered Users"
                        value={loading ? '...' : stats.totalUsers}
                        icon={<UserIcon sx={{ fontSize: 26 }} />}
                        color="#0ea5e9"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Bookings"
                        value={loading ? '...' : stats.totalBookings}
                        icon={<BookingsIcon sx={{ fontSize: 26 }} />}
                        color="#10b981"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Platform Revenue"
                        value={loading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}
                        icon={<RevenueIcon sx={{ fontSize: 26 }} />}
                        color="#f59e0b"
                        subtitle="Total processed payments"
                    />
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <TrendIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={800}>Recent Platform Activity</Typography>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : recentBookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    No activity recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : recentBookings.map((b) => (
                            <TableRow key={b.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {b.business?.business_name || 'System'}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{b.customer?.name || 'Guest'}</Typography>
                                    <Typography variant="caption" color="text.secondary">{b.service?.service_name}</Typography>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{formatDate(b.booking_date)}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>₹{parseFloat(b.service?.price || 0).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={b.status ? 'Confirmed' : 'Cancelled'} 
                                        size="small" 
                                        color={b.status ? 'success' : 'error'} 
                                        sx={{ fontWeight: 700, borderRadius: 1.5 }} 
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </PageTransition>
    );
};

export default PortalDashboard;
