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
        bookingRevenue: 0,
        subscriptionRevenue: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsRes = await axiosInstance.get('/portal/dashboard');
            if (statsRes.data.success) setStats(statsRes.data.data);
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
                        title="Businesses"
                        value={loading ? '...' : stats.totalBusinesses}
                        icon={<BusinessIcon sx={{ fontSize: 26 }} />}
                        color="#6366f1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Subscription Revenue"
                        value={loading ? '...' : `₹${stats.subscriptionRevenue.toLocaleString()}`}
                        icon={<TrendIcon sx={{ fontSize: 26 }} />}
                        color="#10b981"
                        subtitle="Revenue from SaaS plans"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Booking Revenue"
                        value={loading ? '...' : `₹${stats.bookingRevenue.toLocaleString()}`}
                        icon={<RevenueIcon sx={{ fontSize: 26 }} />}
                        color="#f59e0b"
                        subtitle="Revenue from transactions"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Platform Users"
                        value={loading ? '...' : stats.totalUsers}
                        icon={<UserIcon sx={{ fontSize: 26 }} />}
                        color="#0ea5e9"
                    />
                </Grid>
            </Grid>


        </PageTransition>
    );
};

export default PortalDashboard;
