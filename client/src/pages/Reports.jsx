import React, { useState, useEffect } from 'react';
import {
    Grid, Card, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Button,
    TextField, MenuItem, Stack, Divider, Tab, Tabs, Avatar
} from '@mui/material';
import {
    Assessment as ReportsIcon,
    FilterList as FilterIcon,
    PictureAsPdf as PdfIcon,
    TrendingUp as RevenueIcon,
    EventAvailable as BookingsIcon,
    CheckCircle as CompletedIcon,
    Cancel as CancelledIcon,
    AccountBalance as LedgerIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getBookings } from '../api/booking.api';
import { getPayments } from '../api/payment.api';
import { getServices } from '../api/service.api';
import { getStaff } from '../api/staff.api';
import { getCustomers } from '../api/customer.api';
import { getBusinesses } from '../api/business.api';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/date';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

// PDF Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SummaryCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{
        p: 3, height: '100%',
        background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
        border: '1px solid', borderColor: `${color}20`,
        boxShadow: 'none', borderRadius: 3
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 48, height: 48, borderRadius: 2,
                bgcolor: `${color}15`, color: color,
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
                {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
        </Box>
    </Card>
);

const Reports = () => {
    const { selectedBusinessId: contextBusinessId } = useBusiness();
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [startDate, setStartDate] = useState(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState(dayjs().endOf('month'));
    const [reportType, setReportType] = useState('bookings'); // 'bookings', 'payments', 'ledger'
    const [filterBusiness, setFilterBusiness] = useState(contextBusinessId || 'all');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterService, setFilterService] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookRes, payRes, svcRes, staffRes, custRes, bizRes] = await Promise.all([
                getBookings(), getPayments(), getServices(), getStaff(), getCustomers(), getBusinesses()
            ]);
            if (bookRes.success) setBookings(bookRes.data);
            if (payRes.success) setPayments(payRes.data);
            if (svcRes.success) setServices(svcRes.data);
            if (staffRes.success) setStaff(staffRes.data);
            if (custRes.success) setCustomers(custRes.data);
            if (bizRes.success) setBusinesses(bizRes.data);
        } catch (error) {
            toast.error('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (contextBusinessId) setFilterBusiness(contextBusinessId);
    }, [contextBusinessId]);

    // Derived Reporting Data
    const filteredBookings = bookings.filter(b => {
        const matchesBusiness = filterBusiness === 'all' || b.business_id === filterBusiness;
        if (!matchesBusiness) return false;

        const bDate = dayjs(b.booking_date);
        const matchesDate = bDate.isAfter(startDate.subtract(1, 'day')) && bDate.isBefore(endDate.add(1, 'day'));

        const isConfirmedInDb = (b.status === true || b.status === 1);
        const bookingDateTime = dayjs(`${b.booking_date} ${b.end_time || b.start_time}`);
        const isPast = bookingDateTime.isBefore(dayjs());
        const status = isConfirmedInDb ? (isPast ? 'Completed' : 'Confirmed') : 'Cancelled';

        const matchesStatus = filterStatus === 'All' || status === filterStatus;
        const matchesService = filterService === 'All' || b.service_id === filterService;

        return matchesDate && matchesStatus && matchesService;
    }).sort((a, b) => dayjs(a.booking_date).diff(dayjs(b.booking_date)));

    const filteredPayments = payments.filter(p => {
        const matchesBusiness = filterBusiness === 'all' || p.business_id === filterBusiness;
        if (!matchesBusiness) return false;
        const pDate = dayjs(p.created_at);
        return pDate.isAfter(startDate.subtract(1, 'day')) && pDate.isBefore(endDate.add(1, 'day'));
    }).sort((a, b) => dayjs(a.created_at).diff(dayjs(b.created_at)));

    const ledgerData = customers.map(customer => {
        const customerBookings = filteredBookings.filter(b => b.customer_id === customer.id);
        const customerPayments = payments.filter(p => p.booking_id && customerBookings.some(b => b.id === p.booking_id));

        const totalDue = customerBookings.reduce((sum, b) => {
            const payment = payments.find(p => p.booking_id === b.id);
            const service = services.find(s => s.id === b.service_id);
            // Use the price recorded in the payment, otherwise fallback to current service price
            return sum + Number(payment?.amount || service?.price || 0);
        }, 0);

        const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

        return {
            ...customer,
            bookingsCount: customerBookings.length,
            totalDue,
            totalPaid,
            balance: totalDue - totalPaid
        };
    }).filter(c => c.bookingsCount > 0);

    // PDF Utilities
    const toBase64 = (url) => fetch(url)
        .then(response => response.blob())
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }));

    const generatePDF = async () => {
        const doc = new jsPDF();
        const business = businesses.find(b => b.id === filterBusiness) || { business_name: 'All Businesses' };

        // Add Header Background
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 40, 'F');

        // Add Logo (if possible)
        try {
            const logo64 = await toBase64(logoImg);
            doc.addImage(logo64, 'PNG', 15, 8, 24, 24);
        } catch (e) {
            console.error('Logo add failed', e);
        }

        // Add Business Info to Header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('MyBookings Reports', 45, 20);
        doc.setFontSize(10);
        doc.text(`Business: ${business.business_name}`, 45, 28);
        doc.text(`Period: ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`, 45, 33);

        // Add Report Title
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        const reportTitle = reportType === 'bookings' ? 'Bookings Summary Report' :
            reportType === 'payments' ? 'Payments Transaction Report' :
                'Customer Ledger Statement';
        doc.text(reportTitle, 15, 55);

        // Table Generation based on Type
        let headers = [];
        let body = [];

        if (reportType === 'bookings') {
            headers = [['Date', 'Customer', 'Service', 'Staff', 'Status', 'Val.']];
            body = filteredBookings.map(b => [
                formatDate(b.booking_date),
                customers.find(c => c.id === b.customer_id)?.name || 'Guest',
                services.find(s => s.id === b.service_id)?.service_name || '—',
                staff.find(s => s.id === b.staff_id)?.staff_name || '—',
                b.status ? 'Conf.' : 'Canc.', // In PDF keep short
                `rs.${services.find(s => s.id === b.service_id)?.price || 0}`
            ]);
        } else if (reportType === 'payments') {
            headers = [['Date', 'Customer', 'Txn ID', 'Method', 'Paid Amount', 'Status']];
            body = filteredPayments.map(p => {
                const booking = bookings.find(b => b.id === p.booking_id);
                const customer = customers.find(c => c.id === booking?.customer_id);
                return [
                    dayjs(p.created_at).format('DD/MM/YYYY'),
                    customer?.name || '—',
                    p.transaction_id || '—',
                    p.payment_method || '—',
                    `rs.${p.paid_amount}`,
                    p.payment_status ? 'Paid' : 'Pend.'
                ];
            });
        } else {
            headers = [['Customer', 'Appts', 'Total Due', 'Paid', 'Pending']];
            body = ledgerData.map(c => [
                c.name,
                c.bookingsCount,
                `rs.${c.totalDue}`,
                `rs.${c.totalPaid}`,
                `rs.${c.balance}`
            ]);
        }

        autoTable(doc, {
            startY: 65,
            head: headers,
            body: body,
            headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        // Add Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Generated on ${dayjs().format('DD/MM/YYYY HH:mm')} | Page ${i} of ${pageCount}`, 15, 285);
            doc.text('© 2025 MyBookings SaaS platform', 150, 285);
        }

        doc.save(`${business.business_name}_Report_${dayjs().format('YYYYMMDD')}.pdf`);
    };

    return (
        <PageTransition>
            <PageHeader
                title="Reports"
                subtitle="High-quality business reports and PDF exports."
                extraActions={
                    <Button
                        variant="contained"
                        startIcon={<PdfIcon />}
                        onClick={generatePDF}
                        sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                        disabled={loading}
                    >
                        Export to PDF
                    </Button>
                }
            />

            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Business"
                            value={filterBusiness}
                            onChange={(e) => setFilterBusiness(e.target.value)}
                        >
                            <MenuItem value="all">All Businesses</MenuItem>
                            {businesses.map(b => (
                                <MenuItem key={b.id} value={b.id}>{b.business_name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2.5}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="From"
                                value={startDate}
                                onChange={setStartDate}
                                format="DD/MM/YYYY"
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={2.5}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="To"
                                value={endDate}
                                onChange={setEndDate}
                                format="DD/MM/YYYY"
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    {reportType === 'bookings' && (
                        <>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Status"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <MenuItem value="All">All Statuses</MenuItem>
                                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                                    <MenuItem value="Completed">Completed</MenuItem>
                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Service"
                                    value={filterService}
                                    onChange={(e) => setFilterService(e.target.value)}
                                >
                                    <MenuItem value="All">All Services</MenuItem>
                                    {services.map(s => (
                                        <MenuItem key={s.id} value={s.id}>{s.service_name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>

            <Box sx={{ mb: 4 }}>
                <Tabs
                    value={reportType}
                    onChange={(e, val) => setReportType(val)}
                    sx={{
                        borderBottom: 1, borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', px: 4 }
                    }}
                >
                    <Tab label="Bookings Report" value="bookings" icon={<BookingsIcon sx={{ mr: 1 }} />} iconPosition="start" />
                    <Tab label="Payments Report" value="payments" icon={<RevenueIcon sx={{ mr: 1 }} />} iconPosition="start" />
                    <Tab label="Customer Ledger" value="ledger" icon={<LedgerIcon sx={{ mr: 1 }} />} iconPosition="start" />
                </Tabs>
            </Box>

            {/* Content Section */}
            <Box sx={{ minHeight: 400 }}>
                {reportType === 'bookings' && (
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No data for selected filters.</TableCell></TableRow>
                                ) : filteredBookings.map((b) => {
                                    const service = services.find(s => s.id === b.service_id);
                                    const isConfirmedInDb = (b.status === true || b.status === 1);
                                    const bookingDateTime = dayjs(`${b.booking_date} ${b.end_time || b.start_time}`);
                                    const isPast = bookingDateTime.isBefore(dayjs());
                                    const statusLabel = isConfirmedInDb ? (isPast ? 'Completed' : 'Confirmed') : 'Cancelled';

                                    return (
                                        <TableRow key={b.id} hover>
                                            <TableCell>{formatDate(b.booking_date)}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{customers.find(c => c.id === b.customer_id)?.name || 'Guest'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customers.find(c => c.id === b.customer_id)?.phone}</Typography>
                                            </TableCell>
                                            <TableCell>{service?.service_name}</TableCell>
                                            <TableCell>{b.start_time?.slice(0, 5)}</TableCell>
                                            <TableCell>
                                                <Chip label={statusLabel} size="small" variant="outlined" color={statusLabel === 'Completed' ? 'info' : statusLabel === 'Confirmed' ? 'success' : 'error'} />
                                            </TableCell>
                                            <TableCell align="right">₹{service?.price || 0}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {reportType === 'payments' && (
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Txn Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Paid Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                                ) : filteredPayments.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No payments found in this period.</TableCell></TableRow>
                                ) : filteredPayments.map((p) => {
                                    const booking = bookings.find(b => b.id === p.booking_id);
                                    const customer = customers.find(c => c.id === booking?.customer_id);
                                    return (
                                        <TableRow key={p.id} hover>
                                            <TableCell>{dayjs(p.created_at).format('DD/MM/YYYY')}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{customer?.name || '—'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customer?.phone}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transaction_id || '—'}</TableCell>
                                            <TableCell>{p.payment_method}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>₹{p.paid_amount}</TableCell>
                                            <TableCell>
                                                <Chip label={p.payment_status ? 'Paid' : 'Pending'} size="small" color={p.payment_status ? 'success' : 'warning'} variant="outlined" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {reportType === 'ledger' && (
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Bookings</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Due</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Pending Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Calculating Ledger...</TableCell></TableRow>
                                ) : ledgerData.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No customer transactions in this period.</TableCell></TableRow>
                                ) : ledgerData.map((c) => (
                                    <TableRow key={c.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.light' }}>{c.name?.charAt(0)}</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">{c.bookingsCount}</TableCell>
                                        <TableCell align="right">₹{c.totalDue}</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>₹{c.totalPaid}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={700} color={c.balance > 0 ? 'error.main' : 'text.disabled'}>
                                                ₹{c.balance.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </PageTransition>
    );
};

export default Reports;
