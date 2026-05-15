import React, { useState, useEffect } from 'react';
import {
    Grid, Card, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Button,
    TextField, MenuItem, Stack, Divider, Tab, Tabs, Avatar, CircularProgress
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
import { useSubscription } from '../context/SubscriptionContext';
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
        boxShadow: 'none', borderRadius: '16px'
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
    const { usage } = useSubscription();
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
        if (contextBusinessId && contextBusinessId !== 'all') {
            setFilterBusiness(contextBusinessId);
        } else if (businesses.length === 1) {
            setFilterBusiness(businesses[0].id);
        }
    }, [contextBusinessId, businesses]);

    // Derived Reporting Data
    const filteredBookings = bookings.filter(b => {
        const matchesBusiness = filterBusiness === 'all' || String(b.business_id) === String(filterBusiness);
        if (!matchesBusiness) return false;

        const bDate = dayjs(b.booking_date);
        const matchesDate = bDate.isAfter(startDate.subtract(1, 'day')) && bDate.isBefore(endDate.add(1, 'day'));

        const isConfirmedInDb = (b.status === true || b.status === 1);
        const bookingDateTime = dayjs(`${b.booking_date} ${b.end_time || b.start_time}`);
        const isPast = bookingDateTime.isBefore(dayjs());
        const status = isConfirmedInDb ? (isPast ? 'Completed' : 'Confirmed') : 'Cancelled';

        const matchesStatus = filterStatus === 'All' || status === filterStatus;
        const matchesService = filterService === 'All' || String(b.service_id) === String(filterService);

        return matchesDate && matchesStatus && matchesService;
    }).sort((a, b) => dayjs(a.booking_date).diff(dayjs(b.booking_date)));

    const filteredPayments = payments.filter(p => {
        const matchesBusiness = filterBusiness === 'all' || String(p.business_id) === String(filterBusiness);
        if (!matchesBusiness) return false;
        const pDate = dayjs(p.created_at);
        return pDate.isAfter(startDate.subtract(1, 'day')) && pDate.isBefore(endDate.add(1, 'day'));
    }).sort((a, b) => dayjs(a.created_at).diff(dayjs(b.created_at)));

    const ledgerData = customers.map(customer => {
        const customerBookings = filteredBookings.filter(b => String(b.customer_id) === String(customer.id));
        const customerPayments = payments.filter(p => p.booking_id && customerBookings.some(b => String(b.id) === String(p.booking_id)));

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

        // Load Business Logo
        const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/mybookings', '');
        const logoUrl = business?.logo 
            ? (business.logo.startsWith('http') ? business.logo : `${apiBase}${business.logo}`)
            : '/logo.png';
            
        let logo64;
        try {
            logo64 = await toBase64(logoUrl);
            doc.addImage(logo64, 'PNG', 15, 8, 25, 25);
        } catch (e) {
            console.warn('Could not load logo for header', e);
        }

        // Add Business Info to Header
        doc.setTextColor(255, 255, 255);
        const reportTitle = reportType === 'bookings' ? 'Bookings Summary Report' :
            reportType === 'payments' ? 'Payments Transaction Report' :
                'Customer Ledger Statement';
        const recordCount = reportType === 'bookings' ? filteredBookings.length :
            reportType === 'payments' ? filteredPayments.length :
                ledgerData.length;

        doc.setFontSize(16);
        doc.text(business.business_name, 45, 15);
        doc.setFontSize(11);
        doc.text(reportTitle, 45, 21);
        doc.setFontSize(9);
        doc.text(`Period: ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`, 45, 27);
        doc.text(`Total Records: ${recordCount}`, 45, 32);

        // Table Generation based on Type
        let headers = [];
        let body = [];
        const chargesPercent = usage?.portal_payment_charges || 0;

        if (reportType === 'bookings') {
            headers = [['Date', 'Customer', 'Service', 'Staff', 'Time', 'Status', 'Charges']];

            body = filteredBookings.map(b => {
                const serviceList = b.services && b.services.length > 0 
                    ? b.services.map(s => s.service_name).join(', ')
                    : (services.find(s => s.id === b.service_id)?.service_name || '—');
                
                const payment = payments.find(p => String(p.booking_id) === String(b.id));
                const totalPrice = Number(payment?.amount || (b.services && b.services.length > 0
                    ? b.services.reduce((sum, s) => sum + Number(s.price || 0), 0)
                    : (services.find(s => s.id === b.service_id)?.price || 0)));

                return [
                    formatDate(b.booking_date),
                    customers.find(c => c.id === b.customer_id)?.name || 'Guest',
                    serviceList,
                    staff.find(s => s.id === b.staff_id)?.staff_name || '—',
                    `${b.start_time?.slice(0, 5)} - ${b.end_time?.slice(0, 5)}`,
                    b.status ? 'Conf.' : 'Canc.',
                    `rs.${totalPrice.toFixed(2)}`
                ];
            });

            // Add Total Row (Only count for Bookings)
            body.push([
                { content: `Total Bookings: ${filteredBookings.length}`, colSpan: 7, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'center' } }
            ]);

        } else if (reportType === 'payments') {
            headers = [['Date', 'Customer', 'Method', 'Paid Amt', 'Platform Fees', 'Final Income', 'Status']];

            let totalPaid = 0;
            let totalCharges = 0;
            let totalIncome = 0;

            body = filteredPayments.map(p => {
                const booking = bookings.find(b => b.id === p.booking_id);
                const customer = customers.find(c => c.id === booking?.customer_id);
                const paidAmt = Number(p.paid_amount || 0);
                const charge = Number(p.platform_fees || 0);
                const income = Number(p.final_amount || 0);

                totalPaid += paidAmt;
                totalCharges += charge;
                totalIncome += income;

                return [
                    dayjs(p.created_at).format('DD/MM/YYYY'),
                    customer?.name || '—',
                    p.payment_method || '—',
                    `rs.${paidAmt.toFixed(2)}`,
                    `rs.${charge.toFixed(2)}`,
                    `rs.${income.toFixed(2)}`,
                    p.payment_status ? 'Paid' : 'Pend.'
                ];
            });

            // Add Total Row
            body.push([
                { content: `Total Transactions: ${filteredPayments.length}`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `rs.${totalPaid.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `rs.${totalCharges.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `rs.${totalIncome.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: '', styles: { fillColor: [240, 240, 240] } }
            ]);

        } else {
            headers = [['Customer', 'Appts', 'Total Due', 'Paid', 'Pending']];

            let totalAppts = 0;
            let sumDue = 0;
            let sumPaid = 0;
            let sumPending = 0;

            body = ledgerData.map(c => {
                totalAppts += c.bookingsCount;
                sumDue += c.totalDue;
                sumPaid += c.totalPaid;
                sumPending += c.balance;

                return [
                    c.name,
                    c.bookingsCount,
                    `rs.${c.totalDue.toFixed(2)}`,
                    `rs.${c.totalPaid.toFixed(2)}`,
                    `rs.${c.balance.toFixed(2)}`
                ];
            });

            // Add Total Row
            body.push([
                { content: `Total Customers: ${ledgerData.length}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: totalAppts.toString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `rs.${sumDue.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `rs.${sumPaid.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `rs.${sumPending.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]);
        }

        autoTable(doc, {
            startY: 50,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: 15, right: 15 },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 'auto' }
            }
        });

        // Add Footer & Watermark
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Add Watermark (Platform Logo at low opacity)
            try {
                const platformLogo64 = await toBase64('/logo.png');
                doc.setGState(new doc.GState({ opacity: 0.1 }));
                doc.addImage(platformLogo64, 'PNG', 55, 100, 100, 100);
                doc.setGState(new doc.GState({ opacity: 1 })); // Reset opacity
            } catch (e) {
                console.error('Watermark failed', e);
            }

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

            <Paper sx={{ p: 2, mb: 4, borderRadius: '16px', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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

            <Box sx={{ mb: 4, overflow: 'hidden' }}>
                <Tabs
                    value={reportType}
                    onChange={(e, val) => setReportType(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1, borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', px: { xs: 2, sm: 4 }, minHeight: 48 }
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
                    <>
                        {/* Desktop Table */}
                        <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '16px', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Staff</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Charges</TableCell>
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
                                                <TableCell sx={{ fontWeight: 500 }}>{formatDate(b.booking_date)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}>{customers.find(c => c.id === b.customer_id)?.name || 'Guest'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customers.find(c => c.id === b.customer_id)?.phone}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {b.services && b.services.length > 0 
                                                            ? b.services.map(s => s.service_name).join(', ')
                                                            : (services.find(s => s.id === b.service_id)?.service_name || '—')
                                                        }
                                                    </Typography>
                                                    {b.services && b.services.length > 1 && (
                                                        <Typography variant="caption" color="primary.main" fontWeight={800}>
                                                            {b.services.length} services selected
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{staff.find(s => s.id === b.staff_id)?.staff_name || '—'}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</TableCell>
                                                <TableCell>
                                                    <Chip label={statusLabel} size="small" variant="outlined" color={statusLabel === 'Completed' ? 'info' : statusLabel === 'Confirmed' ? 'success' : 'error'} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>
                                                    ₹{Number(
                                                        payments.find(p => String(p.booking_id) === String(b.id))?.amount ||
                                                        (b.services && b.services.length > 0 
                                                            ? b.services.reduce((sum, s) => sum + Number(s.price || 0), 0)
                                                            : (services.find(s => s.id === b.service_id)?.price || 0))
                                                    ).toFixed(2)}
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
                                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed divider' }}>
                                    <Typography color="text.secondary">No reports found</Typography>
                                </Paper>
                            ) : filteredBookings.map((b) => {
                                const service = services.find(s => s.id === b.service_id);
                                const isConfirmedInDb = (b.status === true || b.status === 1);
                                const bookingDateTime = dayjs(`${b.booking_date} ${b.end_time || b.start_time}`);
                                const isPast = bookingDateTime.isBefore(dayjs());
                                const statusLabel = isConfirmedInDb ? (isPast ? 'Completed' : 'Confirmed') : 'Cancelled';
                                const statusColor = statusLabel === 'Completed' ? 'info' : statusLabel === 'Confirmed' ? 'success' : 'error';

                                return (
                                    <Card key={b.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={800}>{formatDate(b.booking_date)}</Typography>
                                                <Typography variant="caption" color="text.secondary">{b.start_time?.slice(0, 5)}</Typography>
                                            </Box>
                                            <Chip label={statusLabel} size="small" color={statusColor} sx={{ fontWeight: 800, borderRadius: 1.5 }} />
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{customers.find(c => c.id === b.customer_id)?.name || 'Guest'}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">{service?.service_name}</Typography>
                                            <Typography variant="body2" fontWeight={800}>₹{service?.price || 0}</Typography>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>
                    </>
                )}

                {reportType === 'payments' && (
                    <>
                        {/* Desktop Table */}
                        <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '16px', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Txn Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Paid</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Platform Fees</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Final Income</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                                    ) : filteredPayments.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>No payments found in this period.</TableCell></TableRow>
                                    ) : filteredPayments.map((p) => {
                                        const booking = bookings.find(b => b.id === p.booking_id);
                                        const customer = customers.find(c => c.id === booking?.customer_id);
                                        const chargesPercent = usage?.portal_payment_charges || 0;
                                        const paidAmt = Number(p.paid_amount || 0);
                                        const charge = paidAmt * (chargesPercent / 100);
                                        const income = paidAmt - charge;

                                        return (
                                            <TableRow key={p.id} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{dayjs(p.created_at).format('DD/MM/YYYY')}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}>{customer?.name || '—'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customer?.phone}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transaction_id || '—'}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{p.payment_method}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>₹{paidAmt.toFixed(2)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>₹{Number(p.platform_fees || 0).toFixed(2)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>₹{Number(p.final_amount || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Chip label={p.payment_status ? 'Paid' : 'Pending'} size="small" color={p.payment_status ? 'success' : 'warning'} variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
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
                            ) : filteredPayments.length === 0 ? (
                                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed divider' }}>
                                    <Typography color="text.secondary">No payments found</Typography>
                                </Paper>
                            ) : filteredPayments.map((p) => {
                                const booking = bookings.find(b => b.id === p.booking_id);
                                const customer = customers.find(c => c.id === booking?.customer_id);
                                return (
                                    <Card key={p.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography variant="subtitle2" fontWeight={800}>{dayjs(p.created_at).format('DD/MM/YYYY')}</Typography>
                                            <Chip label={p.payment_status ? 'Paid' : 'Pending'} size="small" color={p.payment_status ? 'success' : 'warning'} sx={{ fontWeight: 800, borderRadius: 1.5 }} />
                                        </Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>{customer?.name || '—'}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">Txn: {p.transaction_id?.slice(-8) || '—'}</Typography>
                                            <Typography variant="body1" fontWeight={900} color="success.main">₹{p.paid_amount}</Typography>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>
                    </>
                )}

                {reportType === 'ledger' && (
                    <>
                        {/* Desktop Table */}
                        <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: '16px', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
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
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 }}>{c.name?.charAt(0)}</Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>{c.bookingsCount}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>₹{c.totalDue}</TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>₹{c.totalPaid}</TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={800} color={c.balance > 0 ? 'error.main' : 'text.disabled'}>
                                                    ₹{c.balance.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Mobile Card View */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                            {loading ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                            ) : ledgerData.length === 0 ? (
                                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed divider' }}>
                                    <Typography color="text.secondary">No ledger data found</Typography>
                                </Paper>
                            ) : ledgerData.map((c) => (
                                <Card key={c.id} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 800 }}>{c.name?.charAt(0)}</Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={800}>{c.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{c.bookingsCount} Total Bookings</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Paid</Typography>
                                            <Typography variant="body2" fontWeight={800} color="success.main">₹{c.totalPaid}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" color="text.secondary">Balance</Typography>
                                            <Typography variant="body2" fontWeight={900} color={c.balance > 0 ? 'error.main' : 'success.main'}>
                                                ₹{c.balance.toFixed(0)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    </>
                )}
            </Box>
        </PageTransition>
    );
};

export default Reports;
