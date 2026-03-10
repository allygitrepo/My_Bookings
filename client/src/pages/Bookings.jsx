import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Box, Typography, Avatar, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Button, TablePagination
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    ViewList as ViewListIcon,
    CalendarViewMonth as CalendarViewIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon
} from '@mui/icons-material';
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
        if (!searchQuery) return true;
        const customer = customers.find(c => c.id === b.customer_id);
        const service = services.find(s => s.id === b.service_id);
        const staffMember = staff.find(s => s.id === b.staff_id);
        const q = searchQuery.toLowerCase();
        return (
            customer?.name?.toLowerCase().includes(q) ||
            customer?.phone?.toLowerCase().includes(q) ||
            service?.service_name?.toLowerCase().includes(q) ||
            staffMember?.staff_name?.toLowerCase().includes(q) ||
            b.booking_date?.toLowerCase().includes(q)
        );
    });

    return (
        <PageTransition>
            <PageHeader
                title="Bookings"
                subtitle="All customer appointments. Bookings are created via the widget."
                extraActions={
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
                }
            />

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
