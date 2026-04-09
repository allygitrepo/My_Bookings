import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Box, Typography, Avatar, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, TablePagination,
    TextField, MenuItem, Card
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
import { getBookings } from '../api/booking.api';
import { getBusinesses } from '../api/business.api';
import { getLocations } from '../api/location.api';
import { getStaff } from '../api/staff.api';
import { getServices } from '../api/service.api';
import { getCustomers } from '../api/customer.api';
import { getPayments } from '../api/payment.api';
import toast from 'react-hot-toast';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/date';
import dayjs from 'dayjs';

const statusColors = { Confirmed: 'success', Completed: 'info', Cancelled: 'error', Pending: 'warning' };
const paymentColors = { Paid: 'success', Pending: 'warning', Refunded: 'default', Failed: 'error' };

const CalendarView = ({ bookings, customers, services, staff }) => {
    const [currentDate, setCurrentDate] = React.useState(dayjs());

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

    return (
        <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
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
                            transition: 'all 0.2s',
                            '&:hover': day ? { bgcolor: 'action.hover', transform: 'translateY(-4px)', zIndex: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } : {}
                        }}>
                            {day && (
                                <>
                                    <Typography variant="body2" fontWeight={isToday ? 800 : 700} color={isToday ? 'primary.main' : 'text.primary'} mb={1.5}>
                                        {day}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {dayBookings.slice(0, 3).map(b => (
                                            <Tooltip key={b.id} title={`${services.find(s => s.id === b.service_id)?.service_name || 'Service'} - ${customers.find(c => c.id === b.customer_id)?.name || 'Guest'}`} arrow>
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
                                                    {b.start_time?.slice(0, 5)} {services.find(s => s.id === b.service_id)?.service_name}
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
        </Paper>
    );
};

const Bookings = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId } = useBusiness();
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
    const [showFilters, setShowFilters] = useState(false);

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
        // Automatic Polling every 30 seconds to fetch new bookings from widget
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredBookings = [...bookings].sort((a, b) => {
        const dateA = a.booking_date || "";
        const dateB = b.booking_date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.start_time || "").localeCompare(b.start_time || "");
    }).filter(b => {
        // Business Filter
        const matchesBusiness = selectedBusinessId === 'all' || b.business_id === selectedBusinessId;
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

        // Status Filter
        const isConfirmed = (b.status === true || b.status === 1);
        const matchesStatus = filterStatus === 'All' ||
            (filterStatus === 'Confirmed' && isConfirmed) ||
            (filterStatus === 'Cancelled' && !isConfirmed);

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
                title="Bookings"
                subtitle="All customer appointments. Bookings are created via the widget."
                extraActions={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

            {/* --- Filters Bar --- */}
            {showFilters && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', animation: 'fadeIn 0.3s ease-in-out' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterIcon size="small" color="action" />
                            <Typography variant="body2" fontWeight={600} color="text.secondary">Filters:</Typography>
                        </Box>

                        <TextField
                            select
                            size="small"
                            label="Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            sx={{ minWidth: 130 }}
                        >
                            <MenuItem value="All">All Status</MenuItem>
                            <MenuItem value="Confirmed">Confirmed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </TextField>

                        <DatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={(val) => setStartDate(val)}
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />

                        <DatePicker
                            label="End Date"
                            value={endDate}
                            onChange={(val) => setEndDate(val)}
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />

                        <Button
                            size="small"
                            onClick={() => {
                                setFilterStatus('All');
                                setStartDate(null);
                                setEndDate(null);
                            }}
                            sx={{ textTransform: 'none', ml: 'auto' }}
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
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Remaining</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    {/* <TableCell sx={{ fontWeight: 500 }}>Sync</TableCell> */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">Loading bookings...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                        {/* <CalendarIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} /> */}
                                        <Typography variant="body2" color="text.secondary">
                                            {searchQuery ? 'No bookings match your search.' : 'No bookings yet.'}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">Bookings appear here after customers book via the widget.</Typography>
                                    </TableCell></TableRow>
                                ) : filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b, index) => {
                                    const customer = customers.find(c => c.id === b.customer_id);
                                    const service = services.find(s => s.id === b.service_id);
                                    const staffMember = staff.find(s => s.id === b.staff_id);
                                    const payment = payments.find(p => p.booking_id === b.id);

                                    // Use the actual amount quoted at booking (from payment record) if available, 
                                    // otherwise fallback to current service price
                                    const totalAmount = Number(payment?.amount || service?.price || 0);
                                    const paidAmount = Number(payment?.paid_amount || (b.payment_status ? service?.price : 0) || 0);
                                    const remainingAmount = totalAmount - paidAmount;

                                    return (
                                        <TableRow key={b.id} hover>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
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
                                            <TableCell>{formatDate(b.booking_date)}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{String(b.start_time || '').slice(0, 5)}{b.end_time ? ` – ${String(b.end_time).slice(0, 5)}` : ''}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>₹{totalAmount}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="success.main">₹{paidAmount}</Typography>

                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color={remainingAmount > 0 ? 'error.main' : 'text.disabled'}>
                                                    ₹{remainingAmount.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={(b.status === true || b.status === 1) ? 'Confirmed' : 'Cancelled'}
                                                    size="small"
                                                    color={(b.status === true || b.status === 1) ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            {/* 
                                            // Calendar Sync Disabled
                                            <TableCell>
                                                {b.google_event_id ? (
                                                    <Tooltip title="Synced to Google Calendar">
                                                        <CheckCircleIcon color="success" sx={{ fontSize: 18, opacity: 0.8 }} />
                                                    </Tooltip>
                                                ) : isGoogleConnected ? (
                                                    isSyncEnabled ? (
                                                        <Tooltip title="Sync Pending">
                                                            <ClockIcon color="warning" sx={{ fontSize: 18, opacity: 0.8 }} />
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Auto-sync Disabled">
                                                            <SyncDisabledIcon color="disabled" sx={{ fontSize: 18, opacity: 0.8 }} />
                                                        </Tooltip>
                                                    )
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                            */}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
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
                    />
                </>
            )}
        </PageTransition>
    );
};

export default Bookings;
