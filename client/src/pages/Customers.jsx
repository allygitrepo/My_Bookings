import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Avatar, Box, Typography,
} from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { useCustomers } from '../store';

const Customers = () => {
    const [customers] = useCustomers();

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
                            <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.length === 0 && (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                <PersonSearchIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.25, display: 'block', mx: 'auto' }} />
                                <Typography variant="body2" color="text.secondary">No customers yet.</Typography>
                                <Typography variant="caption" color="text.disabled">Customers appear here after they complete a booking via the widget.</Typography>
                            </TableCell></TableRow>
                        )}
                        {customers.map(c => (
                            <TableRow key={c.id} hover>
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
