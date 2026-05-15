import React, { useState, useEffect, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import {
    Card, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Avatar, CircularProgress, Divider,
    ToggleButton, ToggleButtonGroup, IconButton, Stack, TextField, Tooltip, Container
} from '@mui/material';
import {
    Business as BusinessIcon, People as StaffIcon,
    EventAvailable as BookingsIcon, Payments as RevenueIcon,
    TrendingUp as TrendIcon, Group as UserIcon,
    Timeline as LineIcon, BarChart as BarIcon,
    CalendarMonth as CalendarIcon, FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    AreaChart, Area, Legend
} from 'recharts';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';
import './PortalDashboard.css';

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={{ height: '100%', width: '100%', display: 'flex' }}>
        <Card className="stat-card-root" sx={{
            background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
            borderColor: `${color}20`,
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box className="stat-card-icon-wrapper" sx={{ bgcolor: `${color}15`, color: color }}>
                    {icon}
                </Box>
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.85rem', mb: 0.5 }}>{title}</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' } }}>{value}</Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, lineHeight: 1.2, fontSize: '0.7rem' }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Card>
    </motion.div>
);

const AnalyticsChart = ({ title, type, color, data, loading, config, onConfigChange }) => {
    const isLine = config.chartType === 'line';

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, border: '1px solid rgba(255,255,255,0.1)', bgcolor: 'background.paper', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        {dayjs(label).format('DD/MM/YYYY')}
                    </Typography>
                    {payload.map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                            <Typography variant="body2" fontWeight={700}>
                                {entry.name}: {type === 'revenue' ? `₹${entry.value.toLocaleString()}` : entry.value}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            );
        }
        return null;
    };

    return (
        <Card className="analytics-card-root">
            <Box sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}>
                <Box className="chart-header-root" sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: color }} />
                        <Typography variant="h6" fontWeight={800}>
                            {title} ({type === 'revenue' ? `₹${data.grandTotal.toLocaleString()}` : data.grandTotal})
                        </Typography>
                    </Box>
                    <Box className="chart-controls" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                        <ToggleButtonGroup
                            size="small"
                            value={config.range}
                            exclusive
                            onChange={(e, v) => v && onConfigChange({ ...config, range: v })}
                            className="custom-toggle-group"
                        >
                            <ToggleButton value="weekly" className="custom-toggle-button">W</ToggleButton>
                            <ToggleButton value="monthly" className="custom-toggle-button">M</ToggleButton>
                        </ToggleButtonGroup>
                        <ToggleButtonGroup
                            size="small"
                            value={config.chartType}
                            exclusive
                            onChange={(e, v) => v && onConfigChange({ ...config, chartType: v })}
                            className="custom-toggle-group"
                        >
                            <ToggleButton value="line" className="custom-toggle-button"><LineIcon sx={{ fontSize: 18 }} /></ToggleButton>
                            <ToggleButton value="bar" className="custom-toggle-button"><BarIcon sx={{ fontSize: 18 }} /></ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>


            </Box>

            <Box className="chart-container">
                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CircularProgress size={30} color="inherit" />
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {isLine ? (
                            <AreaChart data={data.days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`color-${type}-1`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id={`color-${type}-2`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(str) => dayjs(str).format('DD/MM/YYYY')}
                                    minTickGap={20}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(val) => type === 'revenue' ? `₹${val}` : val}
                                />
                                <ChartTooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    name="Total"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill={`url(#color-${type}-1)`}
                                    dot={{ r: 4, fill: color, strokeWidth: 0 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={data.days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(str) => dayjs(str).format('DD/MM/YYYY')}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <ChartTooltip content={<CustomTooltip />} />
                                <Bar name="Total" dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </Box>
        </Card>
    );
};

const PortalDashboard = () => {
    const [stats, setStats] = useState({
        totalBusinesses: 0,
        totalUsers: 0,
        bookingRevenue: 0,
        subscriptionRevenue: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    // Chart States
    const [interactionConfig, setInteractionConfig] = useState({
        range: 'monthly',
        chartType: 'line',
        startDate: dayjs().subtract(30, 'day'),
        endDate: dayjs()
    });
    const [revenueConfig, setRevenueConfig] = useState({
        range: 'monthly',
        chartType: 'line',
        startDate: dayjs().subtract(30, 'day'),
        endDate: dayjs()
    });

    const [interactionData, setInteractionData] = useState({ days: [], grandTotal: 0 });
    const [revenueData, setRevenueData] = useState({ days: [], grandTotal: 0 });
    const [interactionLoading, setInteractionLoading] = useState(false);
    const [revenueLoading, setRevenueLoading] = useState(false);

    const fetchStats = async () => {
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

    const fetchAnalytics = async (type) => {
        const config = type === 'interaction' ? interactionConfig : revenueConfig;
        const setLoadingState = type === 'interaction' ? setInteractionLoading : setRevenueLoading;
        const setDataState = type === 'interaction' ? setInteractionData : setRevenueData;

        setLoadingState(true);
        try {
            const res = await axiosInstance.get('/portal/analytics', {
                params: {
                    type,
                    startDate: config.startDate.format('YYYY-MM-DD'),
                    endDate: config.endDate.format('YYYY-MM-DD')
                }
            });

            if (res.data.success) {
                // Process and align data
                const processed = processChartData(type, res.data.data, config.startDate, config.endDate);
                setDataState(processed);
            }
        } catch (error) {
            console.error(`Failed to fetch ${type} analytics`, error);
        } finally {
            setLoadingState(false);
        }
    };

    const processChartData = (type, rawData, start, end) => {
        const days = [];
        let curr = dayjs(start);
        const last = dayjs(end);
        let grandTotal = 0;

        while (curr.isBefore(last) || curr.isSame(last, 'day')) {
            const dateStr = curr.format('YYYY-MM-DD');
            const item = { date: dateStr };

            if (type === 'interaction') {
                const u = rawData.users.find(d => d.date === dateStr);
                const b = rawData.bookings.find(d => d.date === dateStr);
                const usersCount = u ? parseInt(u.count) : 0;
                const bookingsCount = b ? parseInt(b.count) : 0;
                item.value = usersCount + bookingsCount;
                grandTotal += item.value;
            } else {
                const p = rawData.payments.find(d => d.date === dateStr);
                const s = rawData.subscriptions.find(d => d.date === dateStr);
                const paymentsAmount = p ? parseFloat(p.amount) : 0;
                const subscriptionsAmount = s ? parseFloat(s.amount) : 0;
                item.value = paymentsAmount + subscriptionsAmount;
                grandTotal += item.value;
            }

            days.push(item);
            curr = curr.add(1, 'day');
        }
        return { days, grandTotal };
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchAnalytics('interaction');
    }, [interactionConfig.startDate, interactionConfig.endDate]);

    useEffect(() => {
        fetchAnalytics('revenue');
    }, [revenueConfig.startDate, revenueConfig.endDate]);

    // Handle range shortcuts
    useEffect(() => {
        if (interactionConfig.range === 'weekly') {
            setInteractionConfig(prev => ({ ...prev, startDate: dayjs().subtract(7, 'day'), endDate: dayjs() }));
        } else {
            setInteractionConfig(prev => ({ ...prev, startDate: dayjs().subtract(30, 'day'), endDate: dayjs() }));
        }
    }, [interactionConfig.range]);

    useEffect(() => {
        if (revenueConfig.range === 'weekly') {
            setRevenueConfig(prev => ({ ...prev, startDate: dayjs().subtract(7, 'day'), endDate: dayjs() }));
        } else {
            setRevenueConfig(prev => ({ ...prev, startDate: dayjs().subtract(30, 'day'), endDate: dayjs() }));
        }
    }, [revenueConfig.range]);

    return (
        <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3 }, width: '100%' }}>
            <PageTransition>

                <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                        <StatCard
                            title="Businesses"
                            value={loading ? '...' : stats.totalBusinesses}
                            icon={<BusinessIcon sx={{ fontSize: 26 }} />}
                            color="#6366f1"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                        <StatCard
                            title="Subscription Revenue"
                            value={loading ? '...' : `₹${stats.subscriptionRevenue.toLocaleString()}`}
                            icon={<TrendIcon sx={{ fontSize: 26 }} />}
                            color="#10b981"

                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                        <StatCard
                            title="Booking Revenue"
                            value={loading ? '...' : `₹${stats.bookingRevenue.toLocaleString()}`}
                            icon={<RevenueIcon sx={{ fontSize: 26 }} />}
                            color="#f59e0b"

                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                        <StatCard
                            title="Platform Users"
                            value={loading ? '...' : stats.totalUsers}
                            icon={<UserIcon sx={{ fontSize: 26 }} />}
                            color="#0ea5e9"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} alignItems="stretch">                    <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                    <AnalyticsChart
                        title="System Interactions"
                        type="interaction"
                        color="#6366f1"
                        data={interactionData}
                        loading={interactionLoading}
                        config={interactionConfig}
                        onConfigChange={setInteractionConfig}
                    />
                </Grid>
                    <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>                        <AnalyticsChart
                        title="Revenue Growth"
                        type="revenue"
                        color="#10b981"
                        data={revenueData}
                        loading={revenueLoading}
                        config={revenueConfig}
                        onConfigChange={setRevenueConfig}
                    />
                    </Grid>
                </Grid>
            </PageTransition>
        </Container>
    );
};

export default PortalDashboard;

