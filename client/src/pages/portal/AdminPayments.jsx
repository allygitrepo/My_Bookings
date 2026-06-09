import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    TextField, InputAdornment, TablePagination, CircularProgress,
    IconButton, Tooltip, Button
} from '@mui/material';
import {
    Search as SearchIcon,
    Payments as PaymentsIcon,
    FileDownload as DownloadIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../../assets/logo.png';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/portal/payments');
            if (res.data.success) {
                setPayments(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch transaction history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const filteredPayments = payments.filter(p => {
        const matchesSearch = 
            p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.razorpay_order_id?.toLowerCase().includes(search.toLowerCase()) ||
            p.package?.name?.toLowerCase().includes(search.toLowerCase());
        
        const paymentDate = dayjs(p.created_at);
        const matchesStart = !startDate || paymentDate.isAfter(dayjs(startDate).startOf('day'));
        const matchesEnd = !endDate || paymentDate.isBefore(dayjs(endDate).endOf('day'));

        return matchesSearch && matchesStart && matchesEnd;
    });

    const totalRevenue = filteredPayments.reduce((sum, p) => {
        if (p.razorpay_payment_id === 'MANUAL_ASSIGN' || p.status !== 'active') return sum;
        return sum + parseFloat(p.platform_fees || 0);
    }, 0);

    const generatePDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Subscription Transactions Report', 15, 20);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 15, 28);
        const dateRange = (startDate || endDate) 
            ? `Period: ${startDate ? dayjs(startDate).format('DD/MM/YYYY') : 'Start'} - ${endDate ? dayjs(endDate).format('DD/MM/YYYY') : 'End'}`
            : 'Period: All Time';
        doc.text(dateRange, 15, 34);
        
        doc.setFontSize(14);
        doc.text(`Platform Revenue: Rs. ${totalRevenue.toLocaleString()}`, 140, 25);

        const headers = [['Sr.', 'Date', 'Customer', 'Plan', 'Paid', 'Admin Cut', 'Status']];
        const body = filteredPayments.map((p, index) => [
            index + 1,
            dayjs(p.created_at).format('DD/MM/YYYY'),
            p.user?.name || '—',
            p.package?.name || '—',
            p.razorpay_payment_id === 'MANUAL_ASSIGN' ? 'Free' : `Rs. ${parseFloat(p.paid_amount || p.amount).toLocaleString()}`,
            p.razorpay_payment_id === 'MANUAL_ASSIGN' ? '0' : `Rs. ${parseFloat(p.platform_fees || 0).toLocaleString()}`,
            p.status.toUpperCase()
        ]);

        autoTable(doc, {
            startY: 50,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
        });

        doc.save(`SaaS_Revenue_Report_${dayjs().format('YYYYMMDD')}.pdf`);
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <PageTransition>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Subscription Transactions</Typography>
                    <Typography variant="body2" color="text.secondary">Monitor all SaaS subscription payments and platform revenue.</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="From"
                            value={startDate}
                            onChange={(val) => setStartDate(val)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />
                        <DatePicker
                            label="To"
                            value={endDate}
                            onChange={(val) => setEndDate(val)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />
                    </LocalizationProvider>
                </Box>
            </Box>

            <Card sx={{ mb: 4 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search by user, order ID or plan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: { xs: '100%', md: 350 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: -0.5 }}>PLATFORM REVENUE</Typography>
                            <Typography variant="h5" fontWeight={900} color="primary.main">₹{totalRevenue.toLocaleString()}</Typography>
                        </Box>
                        
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={generatePDF}
                            sx={{ borderRadius: 2, fontWeight: 700, height: 40, px: 3 }}
                        >
                            Download PDF
                        </Button>
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, width: 60 }}>Sr. No</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Admin Cut</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">No transactions found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((payment, index) => (
                                <TableRow key={payment.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                        {page * rowsPerPage + index + 1}
                                    </TableCell>
                                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700}>{payment.user?.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{payment.user?.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={payment.package?.name} size="small" sx={{ fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>
                                        {payment.razorpay_payment_id === 'MANUAL_ASSIGN' ? (
                                            <Chip 
                                                label="ADMIN ASSIGNED" 
                                                size="small" 
                                                variant="filled" 
                                                color="secondary"
                                                sx={{ fontWeight: 800, borderRadius: 1, fontSize: '0.65rem' }} 
                                            />
                                        ) : (
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.1)', p: 0.5, borderRadius: 1 }}>
                                                {payment.razorpay_order_id || '—'}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={800}>
                                            {payment.razorpay_payment_id === 'MANUAL_ASSIGN' ? 'Free' : `₹${parseFloat(payment.paid_amount || payment.amount).toLocaleString()}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={800} color="primary.main">
                                            {payment.razorpay_payment_id === 'MANUAL_ASSIGN' ? '—' : `₹${parseFloat(payment.platform_fees || 0).toLocaleString()}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Chip
                                                label={payment.status.toUpperCase()}
                                                size="small"
                                                color={payment.status === 'active' ? 'success' : 'warning'}
                                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                            />
                                            {payment.razorpay_payment_id === 'MANUAL_ASSIGN' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                                                    Assigned without payment
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredPayments.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>
        </PageTransition>
    );
};

export default AdminPayments;
