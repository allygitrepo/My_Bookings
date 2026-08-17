import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Box, Typography, Avatar, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, TablePagination,
    TextField, MenuItem, Card, CircularProgress, Grid, Divider, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    ViewList as ViewListIcon,
    CalendarViewMonth as CalendarViewIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    Sync as SyncIcon,
    FilterList as FilterIcon,
    AccessTimeOutlined as ClockIcon,
    CheckCircleOutline as CheckCircleIcon,
    SyncDisabledOutlined as SyncDisabledIcon,
} from '@mui/icons-material';
import { Switch, FormControlLabel } from '@mui/material';
import { useGoogleLogin } from '@react-oauth/google';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getBookings, updateBooking } from '../api/booking.api';
import { getBusinesses } from '../api/business.api';
import { getLocations } from '../api/location.api';
import { getStaff } from '../api/staff.api';
import { getServices } from '../api/service.api';
import { getCustomers } from '../api/customer.api';
import { getPayments } from '../api/payment.api';
import toast from 'react-hot-toast';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import { useSubscription } from '../context/SubscriptionContext';
import { formatDate } from '../utils/date';
import dayjs from 'dayjs';
import { 
    initiateSocketConnection, 
    disconnectSocket, 
    joinBusinessRoom, 
    subscribeToBookings, 
    unsubscribeFromBookings 
} from '../services/socket';

const statusColors = { Confirmed: 'success', Completed: 'info', Cancelled: 'error', Pending: 'warning' };
const paymentColors = { Paid: 'success', Pending: 'warning', Refunded: 'default', Failed: 'error' };

const CalendarView = ({ bookings, customers, services, staff }) => {
    const [currentDate, setCurrentDate] = React.useState(dayjs());
    const [dayDetailOpen, setDayDetailOpen] = React.useState(false);
    const [selectedDayBookings, setSelectedDayBookings] = React.useState([]);
    const [selectedDateLabel, setSelectedDateLabel] = React.useState('');

    const startOfMonth = currentDate.startOf('month');
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = startOfMonth.day();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getBookingsByDay = (day) => {
        if (!day) return [];
        const dateStr = currentDate.date(day).format('YYYY-MM-DD');
        return bookings.filter(b => b.booking_date === dateStr);
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const dayBookings = getBookingsByDay(day);
        if (dayBookings.length > 0) {
            setSelectedDayBookings(dayBookings);
            setSelectedDateLabel(currentDate.date(day).format('DD MMMM YYYY'));
            setDayDetailOpen(true);
        }
    };

    return (
        <Paper sx={{ p: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h5" fontWeight={800} color="primary">
                    {MONTH_NAMES[currentDate.month()]} {currentDate.year()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <PrevIcon />
                    </IconButton>
                    <Button variant="outlined" size="small" onClick={() => setCurrentDate(dayjs())} sx={{ fontWeight: 600 }}>Today</Button>
                    <IconButton onClick={() => setCurrentDate(currentDate.add(1, 'month'))} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <NextIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
                {DAY_LABELS.map(label => (
                    <Box key={label} sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
                    </Box>
                ))}
                {days.map((day, idx) => {
                    const dayBookings = getBookingsByDay(day);
                    const isToday = day && currentDate.date(day).isSame(dayjs(), 'day');

                    return (
                        <Card key={idx} sx={{
                            minHeight: 120,
                            p: 1.5,
                            border: '1px solid',
                            borderColor: isToday ? 'primary.main' : 'divider',
                            bgcolor: day ? 'background.paper' : 'transparent',
                            boxShadow: 'none',
                            opacity: day ? 1 : 1,
                            cursor: day && dayBookings.length > 0 ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            '&:hover': day ? { bgcolor: 'action.hover', transform: 'translateY(-4px)', zIndex: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } : {}
                        }}
                        onClick={() => handleDayClick(day)}
                        >
                            {day && (
                                <>
                                    <Typography variant="body2" fontWeight={isToday ? 800 : 700} color={isToday ? 'primary.main' : 'text.primary'} mb={1.5}>
                                        {day}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {dayBookings.slice(0, 3).map(b => (
                                            <Tooltip key={b.id} title={`${b.services && b.services.length > 0 ? b.services.map(s => s.service_name).join(', ') : (services.find(s => s.id === b.service_id)?.service_name || 'Service')} - ${customers.find(c => c.id === b.customer_id)?.name || 'Guest'}`} arrow>
                                                <Box sx={{
                                                    fontSize: '0.68rem',
                                                    p: 0.7,
                                                    borderRadius: 1.5,
                                                    bgcolor: (b.status === true || b.status === 1) ? 'success.light' : 'error.light',
                                                    color: (b.status === true || b.status === 1) ? 'success.dark' : 'error.dark',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    border: '1px solid',
                                                    borderColor: (b.status === true || b.status === 1) ? 'success.main' : 'error.main',
                                                    opacity: 0.9
                                                }}>
                                                    {b.start_time?.slice(0, 5)} {b.services && b.services.length > 0 ? (b.services.length > 1 ? `${b.services[0].service_name} (+${b.services.length - 1})` : b.services[0].service_name) : services.find(s => s.id === b.service_id)?.service_name}
                                                </Box>
                                            </Tooltip>
                                        ))}
                                        {dayBookings.length > 3 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 800, pl: 0.5, pt: 0.5 }}>
                                                +{dayBookings.length - 3} more
                                            </Typography>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Card>
                    );
                })}
            </Box>

            {/* Day Detail Dialog */}
            <Dialog 
                open={dayDetailOpen} 
                onClose={() => setDayDetailOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 1 }}>
                    Bookings for {selectedDateLabel}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {selectedDayBookings.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map((b) => {
                            const customer = customers.find(c => c.id === b.customer_id);
                            const staffMember = staff.find(s => s.id === b.staff_id);
                            const isConfirmed = (b.status === true || b.status === 1);

                            return (
                                <Card key={b.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '16px' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                                                {customer?.name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={800}>{customer?.name || 'Guest'}</Typography>
                                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                    {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)} • {staffMember?.staff_name || 'No Staff'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip 
                                            label={isConfirmed ? 'Confirmed' : 'Cancelled'} 
                                            size="small" 
                                            color={isConfirmed ? 'success' : 'error'}
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                        />
                                    </Box>
                                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                                    <Typography variant="body2" fontWeight={700} color="primary">
                                        {b.services && b.services.length > 0 
                                            ? b.services.map(s => s.service_name).join(', ')
                                            : (services.find(s => s.id === b.service_id)?.service_name || 'Service')
                                        }
                                    </Typography>
                                </Card>
                            );
                        })}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDayDetailOpen(false)} variant="contained" fullWidth sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

const Bookings = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId } = useBusiness();
    const { usage } = useSubscription();
    const [view, setView] = useState(localStorage.getItem('bookingsView') || 'table');
    const [bookings, setBookings] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [staff, setStaff] = useState([]);
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => {
        return parseInt(localStorage.getItem('rowsPerPage'), 10) || 10;
    });

    const [filterStatus, setFilterStatus] = useState('All');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [autoSync, setAutoSync] = useState(() => localStorage.getItem('autoSyncEnabled') === 'true');
    const [showFilters, setShowFilters] = useState(true);

    const [syncedIds, setSyncedIds] = useState([]); // No longer needed for logic, but keeping state for compatibility if used elsewhere
    const [isSyncingInProgress, setIsSyncingInProgress] = useState(false);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [isSyncEnabled, setIsSyncEnabled] = useState(true);

    useEffect(() => {
        if (businesses.length > 0) {
            const biz = businesses[0];
            setIsGoogleConnected(!!biz.google_refresh_token);
            setIsSyncEnabled(biz.google_sync_enabled !== false);
        }
    }, [businesses]);

    // Calendar Sync Disabled
    const handleToggleSync = () => { };
    const markAsSynced = () => { };
    const login = () => { };

    useEffect(() => {
        if (businesses.length > 0 && businesses[0].google_refresh_token) {
            setIsGoogleConnected(true);
        }
    }, [businesses]);

    useEffect(() => {
        setPage(0);
    }, [filterStatus, startDate, endDate, searchQuery, selectedBusinessId]);

    const handleViewChange = (event, nextView) => {
        if (nextView !== null) {
            setView(nextView);
            localStorage.setItem('bookingsView', nextView);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookRes, bizRes, locRes, staffRes, svcRes, custRes, payRes] = await Promise.all([
                getBookings(), getBusinesses(), getLocations(), getStaff(), getServices(), getCustomers(), getPayments()
            ]);
            if (bookRes.success) setBookings(bookRes.data);
            if (bizRes.success) setBusinesses(bizRes.data);
            if (locRes.success) setLocations(locRes.data);
            if (staffRes.success) setStaff(staffRes.data);
            if (svcRes.success) setServices(svcRes.data);
            if (custRes.success) setCustomers(custRes.data);
            if (payRes.success) setPayments(payRes.data);
        } catch (error) {
            toast.error('Failed to fetch bookings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (typeof refreshUsage === 'function') refreshUsage();

        const socket = initiateSocketConnection();
        
        subscribeToBookings(({ type, data }) => {
            if (type === 'CREATED') {
                setBookings(prev => {
                    const exists = prev.find(b => b.id === data.id);
                    if (exists) return prev;
                    return [data, ...prev];
                });
                
                // Add new customer if included
                if (data.customer) {
                    setCustomers(prev => {
                        const exists = prev.find(c => c.id === data.customer.id);
                        if (exists) return prev;
                        return [...prev, data.customer];
                    });
                }
                
                toast.success('New booking received!', { icon: '📅' });
            } else if (type === 'UPDATED') {
                setBookings(prev => prev.map(b => b.id === data.id ? { ...b, ...data } : b));
            } else if (type === 'CANCELLED') {
                setBookings(prev => prev.filter(b => b.id !== data.id));
            } else if (type === 'PAYMENT_UPDATED') {
                setPayments(prev => {
                    const exists = prev.find(p => p.id === data.id);
                    if (exists) return prev.map(p => p.id === data.id ? data : p);
                    return [...prev, data];
                });
            }
        });

        return () => {
            unsubscribeFromBookings();
            disconnectSocket();
        };
    }, []);

    useEffect(() => {
        if (selectedBusinessId && selectedBusinessId !== 'all') {
            joinBusinessRoom(selectedBusinessId);
        }
    }, [selectedBusinessId]);

    // ... (rest of the filteredBookings logic) ...


    const getBookingStatus = (b) => {
        if (b.booking_status) return b.booking_status;
        const isConfirmedInDb = (b.status === true || b.status === 1);
        if (!isConfirmedInDb) return 'Cancelled';
        const bookingDateTime = dayjs(`${b.booking_date} ${b.end_time || b.start_time}`);
        if (bookingDateTime.isBefore(dayjs())) return 'Completed';
        return 'Confirmed';
    };

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            const res = await updateBooking(bookingId, { booking_status: newStatus });
            if (res.success) {
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_status: newStatus, status: newStatus !== 'Cancelled' } : b));
                toast.success(`Booking status updated to ${newStatus}`);
            } else {
                toast.error(res.message || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredBookings = [...bookings].sort((a, b) => {
        const dateA = a.booking_date || "";
        const dateB = b.booking_date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.start_time || "").localeCompare(a.start_time || "");
    }).filter(b => {
        // Business Filter
        const matchesBusiness = selectedBusinessId === 'all' || String(b.business_id) === String(selectedBusinessId);
        if (!matchesBusiness) return false;

        const customer = customers.find(c => c.id === b.customer_id);
        const service = services.find(s => s.id === b.service_id);
        const staffMember = staff.find(s => s.id === b.staff_id);

        // Search Filter
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || (
            customer?.name?.toLowerCase().includes(q) ||
            customer?.phone?.toLowerCase().includes(q) ||
            service?.service_name?.toLowerCase().includes(q) ||
            staffMember?.staff_name?.toLowerCase().includes(q) ||
            b.booking_date?.toLowerCase().includes(q)
        );

        // Status Logic
        const currentStatus = getBookingStatus(b);

        // Status Filter
        const matchesStatus = filterStatus === 'All' || filterStatus === currentStatus;

        // Date Filter
        const bDate = dayjs(b.booking_date);
        const matchesDate = (!startDate || bDate.isAfter(startDate.subtract(1, 'day'))) &&
            (!endDate || bDate.isBefore(endDate.add(1, 'day')));

        return matchesSearch && matchesStatus && matchesDate;
    });

    const today = dayjs().startOf('day');
    const hasUnsyncedUpcoming = bookings.some(b => {
        const isUpcoming = dayjs(b.booking_date).isAfter(today) || (dayjs(b.booking_date).isSame(today, 'day'));
        const isConfirmed = (b.status === true || b.status === 1);
        return isUpcoming && isConfirmed && !syncedIds.includes(b.id);
    });

    return (
        <PageTransition>
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        Bookings
                    </Box>
                }
                subtitle="All customer appointments. Bookings are created via the widget."
                extraActions={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {usage && usage.limits.bookings !== -1 && (
                            <Box sx={{ minWidth: 140, display: { xs: 'none', lg: 'block' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" fontWeight={800} color="text.secondary">
                                        Quota: {usage.usage.bookings}/{usage.limits.bookings}
                                    </Typography>
                                    {usage.usage.bookings >= usage.limits.bookings && (
                                        <Typography variant="caption" fontWeight={900} color="error.main" sx={{ fontSize: '0.65rem' }}>LIMIT</Typography>
                                    )}
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min((usage.usage.bookings / usage.limits.bookings) * 100, 100)} 
                                    sx={{ 
                                        height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            bgcolor: usage.usage.bookings >= usage.limits.bookings ? 'error.main' : 'primary.main',
                                            boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                                        }
                                    }}
                                />
                            </Box>
                        )}
                        {/* 
                        // Calendar Sync Disabled
                        isGoogleConnected && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isSyncEnabled}
                                        onChange={handleToggleSync}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: isSyncEnabled ? 'primary.main' : 'text.secondary' }}>
                                        {isSyncEnabled ? 'Auto Sync ON' : 'Auto Sync OFF'}
                                    </Typography>
                                }
                                sx={{ mr: 1 }}
                            />
                        ) */}
                        {/* 
                        // Calendar Sync Disabled
                        isGoogleConnected ? (
                            <Tooltip 
                                title={businesses[0]?.sync_email || 'Account details unavailable. Re-link to verify email.'} 
                                arrow 
                                placement="top"
                            >
                                <Chip 
                                    label="Google Calendar Linked" 
                                    color="success" 
                                    variant="outlined" 
                                    icon={<SyncIcon />}
                                    size="small"
                                    sx={{ borderRadius: 2, fontWeight: 600, cursor: 'help' }}
                                />
                            </Tooltip>
                        ) : (
                            <Button
                                variant="contained"
                                size="small"
                                color="warning"
                                startIcon={<SyncIcon />}
                                onClick={() => login()}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Link Google Calendar
                            </Button>
                        ) */}
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: showFilters ? 'primary.main' : 'divider',
                                color: showFilters ? 'primary.main' : 'text.secondary',
                                bgcolor: showFilters ? 'primary.50' : 'transparent',
                                '&:hover': {
                                    bgcolor: showFilters ? 'primary.100' : 'action.hover'
                                }
                            }}
                        >
                            {showFilters ? 'Hide Filters' : 'Filters'}
                        </Button>

                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={handleViewChange}
                            size="small"
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            <ToggleButton value="table">
                                <ViewListIcon sx={{ mr: 1, fontSize: 18 }} />
                                Table
                            </ToggleButton>

                            <ToggleButton value="calendar">
                                <CalendarViewIcon sx={{ mr: 1, fontSize: 18 }} />
                                Calendar
                            </ToggleButton>

                        </ToggleButtonGroup>
                    </Box>
                }
            />

            {/* Quota limit warning */}
            {usage && usage.limits.bookings !== -1 && usage.usage.bookings >= usage.limits.bookings && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontWeight: 700 }}>
                    You have reached your booking limit. Your widget is now disabled. Please upgrade to accept more bookings.
                </Alert>
            )}

            {/* Expiration warning */}
            {usage && usage.isExpired && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px', fontWeight: 700 }}>
                    Your subscription has expired. Please renew your plan to continue receiving bookings and accessing all features.
                </Alert>
            )}

            {/* --- Filters Bar --- */}
            {showFilters && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Paper sx={{ 
                        p: 2, 
                        mb: 3, 
                        borderRadius: '16px', 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2, 
                        flexWrap: 'wrap', 
                        alignItems: { xs: 'stretch', sm: 'center' }, 
                        animation: 'fadeIn 0.3s ease-in-out',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterIcon size="small" color="action" />
                            <Typography variant="body2" fontWeight={800} color="text.secondary">FILTERS:</Typography>
                        </Box>

                        <TextField
                            select
                            size="small"
                            label="Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            sx={{ minWidth: { xs: '100%', sm: 140 } }}
                        >
                            <MenuItem value="All">All Status</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Confirmed">Confirmed</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </TextField>

                        <DatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={(val) => setStartDate(val)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { size: 'small', sx: { width: { xs: '100%', sm: 150 } } } }}
                        />

                        <DatePicker
                            label="End Date"
                            value={endDate}
                            onChange={(val) => setEndDate(val)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { size: 'small', sx: { width: { xs: '100%', sm: 150 } } } }}
                        />

                        <Button
                            size="small"
                            onClick={() => {
                                setFilterStatus('All');
                                setStartDate(null);
                                setEndDate(null);
                            }}
                            sx={{ textTransform: 'none', ml: { sm: 'auto' }, fontWeight: 700 }}
                        >
                            Reset Filters
                        </Button>
                    </Paper>
                </LocalizationProvider>
            )}

            {view === 'calendar' ? (
                <CalendarView bookings={filteredBookings} customers={customers} services={services} staff={staff} />
            ) : (
                <>
                    {/* Desktop Table View */}
                    <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', mb: 4 }}>
                        <Table>
                            <TableHead >
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Staff</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={32} />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchQuery ? 'No bookings match your search.' : 'No bookings yet.'}
                                        </Typography>
                                    </TableCell></TableRow>
                                ) : filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b, index) => {
                                    const customer = customers.find(c => c.id === b.customer_id);
                                    const service = services.find(s => s.id === b.service_id);
                                    const staffMember = staff.find(s => s.id === b.staff_id);
                                    const payment = payments.find(p => p.booking_id === b.id);

                                    const totalAmount = Number(payment?.amount || service?.price || 0);
                                    const paidAmount = Number(payment?.paid_amount || (b.payment_status ? service?.price : 0) || 0);
                                    const remainingAmount = totalAmount - paidAmount;
                                    const currentBookingStatus = getBookingStatus(b);

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
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {b.services && b.services.length > 0 ? (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {b.services.map(s => s.service_name).join(', ')}
                                                        </Typography>
                                                        {b.services.length > 1 && (
                                                            <Typography variant="caption" color="primary.main" fontWeight={800}>
                                                                {b.services.length} services selected
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    service?.service_name || '—'
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{staffMember?.staff_name || '—'}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{formatDate(b.booking_date)}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{String(b.start_time || '').slice(0, 5)}{b.end_time ? ` – ${String(b.end_time).slice(0, 5)}` : ''}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>₹{totalAmount}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹{paidAmount}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: remainingAmount > 0 ? 'error.main' : 'text.disabled' }}>₹{remainingAmount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    select
                                                    size="small"
                                                    value={currentBookingStatus}
                                                    onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                                    sx={{
                                                        minWidth: 125,
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            height: 32,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 800,
                                                            bgcolor: 
                                                                currentBookingStatus === 'Confirmed' ? 'rgba(34, 197, 94, 0.12)' :
                                                                currentBookingStatus === 'Completed' ? 'rgba(59, 130, 246, 0.12)' :
                                                                currentBookingStatus === 'Pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                                            color:
                                                                currentBookingStatus === 'Confirmed' ? 'success.main' :
                                                                currentBookingStatus === 'Completed' ? 'info.main' :
                                                                currentBookingStatus === 'Pending' ? 'warning.main' : 'error.main',
                                                            '& fieldset': { border: 'none' }
                                                        },
                                                        '& .MuiSelect-select': { py: '4px', px: '8px' }
                                                    }}
                                                >
                                                    <MenuItem value="Pending" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'warning.main' }}>Pending</MenuItem>
                                                    <MenuItem value="Confirmed" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'success.main' }}>Confirmed</MenuItem>
                                                    <MenuItem value="Completed" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'info.main' }}>Completed</MenuItem>
                                                    <MenuItem value="Cancelled" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'error.main' }}>Cancelled</MenuItem>
                                                </TextField>
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
                        ) : filteredBookings.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed', borderColor: 'divider', boxShadow: 'none' }}>
                                <Typography variant="body2" color="text.secondary">No bookings found</Typography>
                            </Paper>
                        ) : filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => {
                            const customer = customers.find(c => c.id === b.customer_id);
                            const service = services.find(s => s.id === b.service_id);
                            const staffMember = staff.find(s => s.id === b.staff_id);
                            const payment = payments.find(p => p.booking_id === b.id);

                            const totalAmount = Number(payment?.amount || service?.price || 0);
                            const paidAmount = Number(payment?.paid_amount || (b.payment_status ? service?.price : 0) || 0);
                            const remainingAmount = totalAmount - paidAmount;
                            const currentBookingStatus = getBookingStatus(b);

                            return (
                                <Card key={b.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{customer?.name?.charAt(0)}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={800}>{customer?.name || 'Guest'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{formatDate(b.booking_date)} • {b.start_time?.slice(0, 5)}</Typography>
                                            </Box>
                                        </Box>
                                        <TextField
                                            select
                                            size="small"
                                            value={currentBookingStatus}
                                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                            sx={{
                                                minWidth: 120,
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    height: 32,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    bgcolor: 
                                                        currentBookingStatus === 'Confirmed' ? 'rgba(34, 197, 94, 0.12)' :
                                                        currentBookingStatus === 'Completed' ? 'rgba(59, 130, 246, 0.12)' :
                                                        currentBookingStatus === 'Pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                                    color:
                                                        currentBookingStatus === 'Confirmed' ? 'success.main' :
                                                        currentBookingStatus === 'Completed' ? 'info.main' :
                                                        currentBookingStatus === 'Pending' ? 'warning.main' : 'error.main',
                                                    '& fieldset': { border: 'none' }
                                                },
                                                '& .MuiSelect-select': { py: '4px', px: '8px' }
                                            }}
                                        >
                                            <MenuItem value="Pending" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'warning.main' }}>Pending</MenuItem>
                                            <MenuItem value="Confirmed" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'success.main' }}>Confirmed</MenuItem>
                                            <MenuItem value="Completed" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'info.main' }}>Completed</MenuItem>
                                            <MenuItem value="Cancelled" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'error.main' }}>Cancelled</MenuItem>
                                        </TextField>
                                    </Box>

                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary" display="block">Service</Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                {b.services && b.services.length > 0 
                                                    ? b.services.map(s => s.service_name).join(', ')
                                                    : (service?.service_name || '—')
                                                }
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary" display="block">Staff</Typography>
                                            <Typography variant="body2" fontWeight={700}>{staffMember?.staff_name || '—'}</Typography>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Amount</Typography>
                                            <Typography variant="body2" fontWeight={800}>₹{totalAmount}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">Balance</Typography>
                                            <Typography variant="body2" fontWeight={800} color={remainingAmount > 0 ? 'error.main' : 'success.main'}>
                                                ₹{remainingAmount.toFixed(0)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            );
                        })}
                    </Box>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 20, 30, 50]}
                        component="div"
                        count={filteredBookings.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={(e) => {
                            const rpp = parseInt(e.target.value, 10);
                            setRowsPerPage(rpp);
                            localStorage.setItem('rowsPerPage', rpp);
                            setPage(0);
                        }}
                        sx={{
                            '& .MuiTablePagination-toolbar': {
                                justifyContent: 'flex-start',
                                pl: { xs: 2, md: 0 }
                            },
                            '& .MuiTablePagination-spacer': {
                                display: 'none'
                            }
                        }}
                    />
                </>
            )}
        </PageTransition>
    );
};

export default Bookings;
