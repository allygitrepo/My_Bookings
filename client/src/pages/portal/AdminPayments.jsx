import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    TextField, InputAdornment, TablePagination, CircularProgress,
    IconButton, Tooltip
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

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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

    const filteredPayments = payments.filter(p => 
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.razorpay_order_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.package?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <PageTransition>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Subscription Transactions</Typography>
                    <Typography variant="body2" color="text.secondary">Monitor all SaaS subscription payments and platform revenue.</Typography>
                </Box>
                <Tooltip title="Export CSV">
                    <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <DownloadIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Card sx={{ mb: 4 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <TextField
                        size="small"
                        placeholder="Search by user, order ID or plan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: { xs: '100%', md: 400 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">No transactions found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((payment) => (
                                <TableRow key={payment.id} hover>
                                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700}>{payment.user?.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{payment.user?.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={payment.package?.name} size="small" sx={{ fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.2)', p: 0.5, borderRadius: 1 }}>
                                            {payment.razorpay_order_id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight={800} color="primary">₹{parseFloat(payment.amount).toLocaleString()}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={payment.status.toUpperCase()} 
                                            size="small"
                                            color={payment.status === 'active' ? 'success' : 'warning'}
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                        />
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
