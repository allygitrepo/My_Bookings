import React, { useState } from 'react';
import {
    Card,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Add as AddIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useApiKeys, useBusinesses } from '../store';

const ApiKeys = () => {
    const [apiKeys, setApiKeys] = useApiKeys();
    const [businesses] = useBusinesses();

    const [visibleKeys, setVisibleKeys] = useState({});

    const toggleVisibility = (id) => {
        setVisibleKeys((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleCopy = () => {
        toast.success('API Key copied to clipboard');
    };

    const generateNewKey = () => {
        if (businesses.length === 0) {
            toast.error('Please create a business first to generate an API key.');
            return;
        }

        const newKey = {
            id: Date.now().toString(),
            businessId: businesses[0].id,
            key: 'pk_live_' + crypto.randomUUID().replace(/-/g, ''),
            createdAt: new Date().toISOString().split('T')[0],
            status: 'Active'
        };

        setApiKeys([...apiKeys, newKey]);
        toast.success('New API Key generated!');
    };

    return (
        <>
            <PageHeader
                title="API Keys"
                subtitle="Manage your secret keys for widget integration and API access."
            />

            <Card sx={{ p: 4, mb: 4, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="h6" color="primary.900" gutterBottom>
                    ⚠️ Security Notice
                </Typography>
                <Typography variant="body2" color="primary.800">
                    Your API keys carry significant privileges. Keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
                </Typography>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={generateNewKey}>
                    Generate New Key
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>API Key</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {apiKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    No API Keys generated yet. Click "Generate New Key" to create one.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {apiKeys.map((apiKey) => {
                            const business = businesses.find((b) => b.id === apiKey.businessId);
                            const isVisible = visibleKeys[apiKey.id];

                            return (
                                <TableRow key={apiKey.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{business?.name || 'Unknown'}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {isVisible ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                                    </TableCell>
                                    <TableCell>{apiKey.createdAt}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={apiKey.status}
                                            size="small"
                                            color={apiKey.status === 'Active' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title={isVisible ? "Hide Key" : "Show Key"}>
                                            <IconButton onClick={() => toggleVisibility(apiKey.id)} size="small" sx={{ mr: 1 }}>
                                                {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </Tooltip>

                                        <CopyToClipboard text={apiKey.key} onCopy={handleCopy}>
                                            <Tooltip title="Copy Key">
                                                <IconButton size="small" color="primary">
                                                    <CopyIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </CopyToClipboard>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default ApiKeys;
