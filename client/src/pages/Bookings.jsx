import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Box, Typography, Avatar, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, TablePagination,
    TextField, MenuItem
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
import { formatDate } from '../utils/date';
import dayjs from 'dayjs';

const statusColors = { Confirmed: 'success', Completed: 'info', Cancelled: 'error', Pending: 'warning' };
const paymentColors = { Paid: 'success', Pending: 'warning', Refunded: 'default', Failed: 'error' };

/*
// Calendar Sync Disabled
const CalendarView = ({ bookings, customers, services, staff }) => {
    ... existing code ...
};
*/

const Bookings = () => {
    const { searchQuery } = useSearch();
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
    const handleToggleSync = () => {};
    const markAsSynced = () => {};
    const login = () => {};
    /*
    const handleToggleSync = async () => {
        ... existing code ...
    };

    const markAsSynced = (id) => {
        ... existing code ...
    };

    const login = useGoogleLogin({
        ... existing code ...
    });
    */

    useEffect(() => {
        if (businesses.length > 0 && businesses[0].google_refresh_token) {
            setIsGoogleConnected(true);
        }
    }, [businesses]);

    useEffect(() => {
        setPage(0);
    }, [filterStatus, startDate, endDate, searchQuery]);

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

    const filteredBookings = [...bookings].reverse().filter(b => {
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
                            {/* 
                            // Calendar Sync Disabled
                            <ToggleButton value="calendar">
                                <CalendarViewIcon sx={{ mr: 1, fontSize: 18 }} />
                                Calendar
                            </ToggleButton> 
                            */}
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
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    {/* // Calendar Sync Disabled */}
                    <Typography variant="body2" color="text.secondary">Calendar View is currently disabled.</Typography>
                </Box>
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

                                    const totalAmount = Number(service?.price || 0);
                                    const paidAmount = Number(payment?.paid_amount || (b.payment_status ? service?.price : 0) || 0);
                                    const remainingAmount = Math.max(0, totalAmount - paidAmount);

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
