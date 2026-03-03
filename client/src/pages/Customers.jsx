import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Avatar, Box, Typography,
} from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customer.api';
import { useSearch } from '../context/SearchContext';
import toast from 'react-hot-toast';

const Customers = () => {
    const { searchQuery } = useSearch();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sr. No.</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography color="text.secondary">Loading customers...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <PersonSearchIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {searchQuery ? 'No customers match your search.' : 'No customers yet.'}
                                </Typography>
                                {!searchQuery && <Typography variant="caption" color="text.disabled">Customers appear here after they complete a booking via the widget.</Typography>}
                            </TableCell></TableRow>
                        ) : filteredCustomers.map((c, index) => (
                            <TableRow key={c.id} hover>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.light', color: 'primary.dark' }}>
                                            {c.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={500}>{c.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{c.phone || '—'}</TableCell>
                                <TableCell>{c.email || '—'}</TableCell>
                                <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageTransition>
    );
};

export default Customers;
