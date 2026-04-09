import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Avatar, Box, Typography, TablePagination, CircularProgress, Card, Divider
} from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customer.api';
import { useSearch } from '../context/SearchContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';

const Customers = () => {
    const { searchQuery } = useSearch();
    const { selectedBusinessId } = useBusiness();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(() => parseInt(localStorage.getItem('rowsPerPage'), 10) || 10);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, selectedBusinessId]);

    const filteredCustomers = customers.filter(c => {
        const matchesBusiness = selectedBusinessId === 'all' || c.business_id === selectedBusinessId;
        if (!matchesBusiness) return false;

        return c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getCustomers();
            if (response.success) setCustomers(response.data);
        } catch (error) {
            toast.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    return (
        <PageTransition>
            <PageHeader
                title="Customers"
                subtitle="Customers are created automatically when a booking is made via the widget."
            />
            {/* Desktop Table */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={32} />
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <PersonSearchIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                                    {searchQuery ? 'No customers match your search.' : 'No customers yet.'}
                                </Typography>
                                {!searchQuery && <Typography variant="caption" color="text.disabled">Customers appear here after they complete a booking via the widget.</Typography>}
                            </TableCell></TableRow>
                        ) : filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c, index) => (
                            <TableRow key={c.id} hover>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 800 }}>
                                            {c.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{c.phone || '—'}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                {loading ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : filteredCustomers.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed divider' }}>
                        <Typography color="text.secondary">No customers found</Typography>
                    </Paper>
                ) : filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
                    <Card key={c.id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 800 }}>{c.name?.charAt(0)?.toUpperCase()}</Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={900}>{c.name}</Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>{c.phone || 'No phone provided'}</Typography>
                            </Box>
                        </Box>
                        <Divider sx={{ my: 1.5, borderStyle: 'dotted' }} />
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'right' }}>
                            Joined on {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                        </Typography>
                    </Card>
                ))}
            </Box>
            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50]}
                component="div"
                count={filteredCustomers.length}
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
        </PageTransition>
    );
};

export default Customers;
