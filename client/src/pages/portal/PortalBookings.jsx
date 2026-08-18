import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar,
    CircularProgress, TextField, InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    Business as BusinessIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';
import toast from 'react-hot-toast';

const PortalBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/portal/bookings');
            if (response.data.success) {
                setBookings(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch platform bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b => 
        Boolean(b.payment_status) && (
            b.business?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.booking_date?.includes(searchTerm) ||
            b.status_text?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <PageTransition>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Platform Bookings</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Global list of all appointments scheduled across all tenants.
                    </Typography>
                </Box>
                <TextField 
                    size="small" 
                    placeholder="Search by business or date..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ width: { xs: '100%', md: 300 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </Box>

            <TableContainer component={Paper} sx={{ overflow: 'hidden', mb: 4 }}>
                <Table>
                    <TableHead >
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Schedule</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : filteredBookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                                    No bookings found.
                                </TableCell>
                            </TableRow>
                        ) : filteredBookings.map((b) => (
                            <TableRow key={b.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ p: 1, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 1.5 }}>
                                            <BusinessIcon fontSize="small" />
                                        </Box>
                                        <Typography variant="body2" fontWeight={800}>{b.business?.business_name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{formatDate(b.booking_date)}</Typography>
                                            <Typography variant="caption" color="text.secondary">{b.start_time} - {b.end_time || '...'}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{b.customer_id}</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>₹{parseFloat(b.total_amount || 0).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={!b.status || b.booking_status === 'Cancelled' ? 'Cancelled' : (!b.payment_status ? 'Pending' : 'Confirmed')} 
                                        size="small" 
                                        color={!b.status || b.booking_status === 'Cancelled' ? 'error' : (!b.payment_status ? 'warning' : 'success')} 
                                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageTransition>
    );
};

export default PortalBookings;
