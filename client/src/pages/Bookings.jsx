import React, { useState, useEffect } from 'react';
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
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useGoogleLogin } from '@react-oauth/google';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createCalendarEvent, formatBookingToEvent } from '../services/googleCalendar.service';
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

const CalendarView = ({ bookings, customers, services, staff }) => {
    const [currentDate, setCurrentDate] = useState(dayjs());

    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDay = startOfMonth.startOf('week');
    const endDay = endOfMonth.endOf('week');

    const days = [];
    let day = startDay;
    while (day.isBefore(endDay)) {
        days.push(day);
        day = day.add(1, 'day');
    }

    const bookingsByDate = bookings.reduce((acc, b) => {
        const date = dayjs(b.booking_date).format('YYYY-MM-DD');
        if (!acc[date]) acc[date] = [];
        acc[date].push(b);
        return acc;
    }, {});

    return (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                    {currentDate.format('MMMM YYYY')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}>
                        <PrevIcon />
                    </IconButton>
                    <Button variant="outlined" size="small" onClick={() => setCurrentDate(dayjs())}>Today</Button>
                    <IconButton onClick={() => setCurrentDate(currentDate.add(1, 'month'))}>
                        <NextIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <Typography key={d} variant="subtitle2" textAlign="center" sx={{ fontWeight: 600, color: 'text.secondary', py: 1 }}>
                        {d}
                    </Typography>
                ))}
                {days.map((d, i) => {
                    const isToday = d.isSame(dayjs(), 'day');
                    const isCurrentMonth = d.isSame(currentDate, 'month');
                    const dateStr = d.format('YYYY-MM-DD');
                    const dayBookings = bookingsByDate[dateStr] || [];

                    return (
                        <Box
                            key={i}
                            sx={{
                                minHeight: 120,
                                p: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: isCurrentMonth ? 'background.paper' : 'action.hover',
                                borderRadius: 1,
                                transition: '0.2s',
                                '&:hover': { bgcolor: 'action.selected' }
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: isToday ? 800 : 500,
                                    color: isToday ? 'primary.main' : isCurrentMonth ? 'text.primary' : 'text.disabled',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: isToday ? 'primary.lighter' : 'transparent',
                                    mb: 0.5
                                }}
                            >
                                {d.date()}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {dayBookings.map(b => {
                                    const service = services.find(s => s.id === b.service_id);
                                    const customer = customers.find(c => c.id === b.customer_id);
                                    return (
                                        <Tooltip key={b.id} title={`${customer?.name || 'Customer'} - ${service?.service_name || 'Service'} (${b.start_time})`}>
                                            <Chip
                                                label={service?.service_name || 'Booking'}
                                                size="small"
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    height: 20,
                                                    bgcolor: (b.status === true || b.status === 1) ? 'success.lighter' : 'error.lighter',
                                                    color: (b.status === true || b.status === 1) ? 'success.dark' : 'error.dark',
                                                    border: '1px solid',
                                                    borderColor: (b.status === true || b.status === 1) ? 'success.light' : 'error.light',
                                                    '& .MuiChip-label': { px: 1 }
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

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

    // Google Calendar Sync Logic
    const [googleToken, setGoogleToken] = useState(null);
    const [pendingSync, setPendingSync] = useState(null); // Booking currently being synced
    const [syncedIds, setSyncedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('syncedBookingIds') || '[]');
        } catch (_) { return []; }
    });

    const markAsSynced = (id) => {
        setSyncedIds(prev => {
            const next = [...new Set([...prev, id])];
            localStorage.setItem('syncedBookingIds', JSON.stringify(next));
            return next;
        });
    };

    const login = useGoogleLogin({
        onSuccess: tokenResponse => {
            console.log('Google login success:', tokenResponse);
            setGoogleToken(tokenResponse.access_token);
            if (pendingSync === 'all') {
                const today = dayjs().startOf('day');
                const upcoming = bookings.filter(b => {
                    const isUpcoming = dayjs(b.booking_date).isAfter(today) || (dayjs(b.booking_date).isSame(today, 'day'));
                    return isUpcoming && (b.status === true || b.status === 1);
                });
                syncAllSequence(tokenResponse.access_token, upcoming);
            } else if (pendingSync) {
                performSync(tokenResponse.access_token, pendingSync);
            }
        },
        onError: error => console.error('Google login error:', error),
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const performSync = async (token, b) => {
        const customer = customers.find(c => c.id === b.customer_id);
        const service = services.find(s => s.id === b.service_id);
        const staffMember = staff.find(s => s.id === b.staff_id);
        const location = locations.find(l => l.id === b.location_id);

        const eventData = formatBookingToEvent(b, { customer, service, staff: staffMember, location });
        const business = businesses.find(bz => bz.id === b.business_id);
        const calendarId = business?.sync_email || 'primary';

        try {
            await createCalendarEvent(token, eventData, calendarId);
            markAsSynced(b.id);
            toast.success('Successfully synced to Google Calendar!');
        } catch (error) {
            toast.error(error.message || 'Failed to sync to Google Calendar');
        } finally {
            setPendingSync(null);
        }
    };

    const handleSync = (b) => {
        if (googleToken) {
            performSync(googleToken, b);
        } else {
            setPendingSync(b);
            login();
        }
    };

    const handleSyncAll = () => {
        const today = dayjs().startOf('day');
        const upcoming = bookings.filter(b => {
            const isUpcoming = dayjs(b.booking_date).isAfter(today) || (dayjs(b.booking_date).isSame(today, 'day'));
            const isConfirmed = (b.status === true || b.status === 1);
            return isUpcoming && isConfirmed && !syncedIds.includes(b.id);
        });

        if (upcoming.length === 0) {
            toast.error('No new upcoming confirmed bookings to sync');
            return;
        }

        if (googleToken) {
            syncAllSequence(googleToken, upcoming);
        } else {
            setPendingSync('all'); // Special value to trigger bulk sync after login
            login();
        }
    };

    const syncAllSequence = async (token, items) => {
        toast.loading(`Syncing ${items.length} bookings...`, { id: 'bulk-sync' });
        let successCount = 0;
        for (const b of items) {
            try {
                const customer = customers.find(c => c.id === b.customer_id);
                const service = services.find(s => s.id === b.service_id);
                const staffMember = staff.find(s => s.id === b.staff_id);
                const location = locations.find(l => l.id === b.location_id);
                const eventData = formatBookingToEvent(b, { customer, service, staff: staffMember, location });
                const business = businesses.find(bz => bz.id === b.business_id);
                const calendarId = business?.sync_email || 'primary';

                await createCalendarEvent(token, eventData, calendarId);
                markAsSynced(b.id);
                successCount++;
            } catch (err) {
                console.error(`Failed to sync booking ${b.id}:`, err);
            }
        }
        toast.dismiss('bulk-sync');
        toast.success(`Successfully synced ${successCount} out of ${items.length} bookings!`);
        if (autoSync) {
            localStorage.setItem('lastAutoSync', new Date().toISOString());
        }
    };

    useEffect(() => {
        if (autoSync && bookings.length > 0 && !loading) {
            const today = dayjs().startOf('day');
            const unsynced = bookings.filter(b => {
                const isUpcoming = dayjs(b.booking_date).isAfter(today) || (dayjs(b.booking_date).isSame(today, 'day'));
                const isConfirmed = (b.status === true || b.status === 1);
                return isUpcoming && isConfirmed && !syncedIds.includes(b.id);
            });
            if (unsynced.length > 0 && googleToken) {
                syncAllSequence(googleToken, unsynced);
            }
        }
    }, [bookings, autoSync, loading]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery]);

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
                        <Button
                            variant={autoSync ? "contained" : "outlined"}
                            size="small"
                            color={autoSync ? "success" : "inherit"}
                            startIcon={<SyncIcon className={autoSync ? "animate-spin-slow" : ""} />}
                            onClick={() => {
                                const next = !autoSync;
                                setAutoSync(next);
                                localStorage.setItem('autoSyncEnabled', next);
                                if (next) toast.success('Auto Sync Enabled');
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            {autoSync ? 'Auto Sync ON' : 'Auto Sync OFF'}
                        </Button>
                        Filter
                        <IconButton
                            color={showFilters ? "primary" : "default"}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ bgcolor: showFilters ? 'action.selected' : 'background.paper', borderRadius: 2 }}
                        >
                            <FilterIcon />
                        </IconButton>
                        {hasUnsyncedUpcoming && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<SyncIcon />}
                                onClick={handleSyncAll}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Sync All Upcoming
                            </Button>
                        )}
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
                <CalendarView
                    bookings={filteredBookings}
                    customers={customers}
                    services={services}
                    staff={staff}
                />
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
                                    <TableCell sx={{ fontWeight: 600 }}>Sync</TableCell>
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
                                        <CalendarIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
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
                                            <TableCell>
                                                {(b.status === true || b.status === 1) &&
                                                    !syncedIds.includes(b.id) &&
                                                    (dayjs(b.booking_date).isAfter(dayjs().subtract(1, 'day'), 'day')) ? (
                                                    <Tooltip title="Sync to Google Calendar">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleSync(b)}
                                                        >
                                                            <SyncIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">
                                                        {syncedIds.includes(b.id) ? 'Synced' : '—'}
                                                    </Typography>
                                                )}
                                            </TableCell>
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
