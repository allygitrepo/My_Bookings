import React, { useState } from 'react';
import {
    Card, Typography, Box, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Tooltip,
    MenuItem, Select, FormControl, InputLabel, Grid, Divider,
} from '@mui/material';
import {
    ContentCopy as CopyIcon, Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon, Add as AddIcon, Delete as DeleteIcon, Security as SecurityIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useApiKeys, useBusinesses } from '../store';

const ApiKeys = () => {
    const [apiKeys, setApiKeys] = useApiKeys();
    const [businesses] = useBusinesses();
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [visibleKeys, setVisibleKeys] = useState({});

    const { control, handleSubmit, reset } = useForm({
        defaultValues: { business_id: '' },
    });

    const handleOpen = (k = null) => {
        setEditId(k?.id || null);
        reset(k ? { business_id: k.business_id || '' } : { business_id: businesses[0]?.id || '' });
        setOpen(true);
    };

    const onSubmit = (data) => {
        const now = new Date().toISOString();
        if (editId) {
            setApiKeys(apiKeys.map(k => k.id === editId ? { ...k, ...data, updated_at: now } : k));
        } else {
            const newKey = {
                id: Date.now().toString(),
                business_id: data.business_id,
                api_key: 'pk_live_' + crypto.randomUUID().replace(/-/g, ''),
                created_at: now,
                updated_at: now,
            };
            setApiKeys([...apiKeys, newKey]);
            toast.success('New API Key generated!');
        }
        setOpen(false);
    };

    const toggleVisibility = (id) => setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <PageTransition>
            <PageHeader title="API Keys" subtitle="Manage your secret keys for widget integration and API access." />

            <Card sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'flex-start', gap: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <SecurityIcon sx={{ color: 'warning.main', mt: 0.3, flexShrink: 0 }} />
                <Box>
                    <Typography variant="subtitle2" color="warning.dark" fontWeight={700}>Security Notice</Typography>
                    <Typography variant="body2" color="warning.dark" mt={0.3}>
                        Keep your API keys secret. Do not expose them in client-side code, public repositories, or shared environments.
                    </Typography>
                </Box>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} disabled={businesses.length === 0}
                    title={businesses.length === 0 ? 'Create a business first' : ''}>
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
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {apiKeys.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                No API Keys generated yet. Click "Generate New Key" to create one.
                            </TableCell></TableRow>
                        )}
                        {apiKeys.map(k => {
                            const biz = businesses.find(b => b.id === k.business_id);
                            const isVisible = visibleKeys[k.id];
                            return (
                                <TableRow key={k.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{biz?.business_name || '—'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                {isVisible ? k.api_key : k.api_key?.slice(0, 12) + '•••••••••••••••••••••'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title={isVisible ? 'Hide Key' : 'Show Key'}>
                                            <IconButton onClick={() => toggleVisibility(k.id)} size="small" sx={{ mr: 0.5 }}>
                                                {isVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                        <CopyToClipboard text={k.api_key} onCopy={() => toast.success('API Key copied!')}>
                                            <Tooltip title="Copy Key">
                                                <IconButton size="small" color="primary" sx={{ mr: 0.5 }}>
                                                    <CopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </CopyToClipboard>
                                        <IconButton size="small" color="error" onClick={() => setApiKeys(apiKeys.filter(x => x.id !== k.id))}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <FormDrawer open={open} onClose={() => setOpen(false)} title="Generate API Key" subtitle="A unique API key will be generated for the selected business." onSave={handleSubmit(onSubmit)} saveLabel="Generate Key">
                <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>Business</Typography>
                    <Controller name="business_id" control={control} rules={{ required: true }}
                        render={({ field }) => (
                            <FormControl fullWidth>
                                <InputLabel>Business *</InputLabel>
                                <Select {...field} label="Business *">
                                    {businesses.map(b => <MenuItem key={b.id} value={b.id}>{b.business_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )} />
                </Box>
                <Divider sx={{ my: 2.5 }} />
                <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>Status</Typography>
                    <Controller name="status" control={control}
                        render={({ field }) => (
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select {...field} label="Status">
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        )} />
                </Box>
            </FormDrawer>
        </PageTransition>
    );
};

export default ApiKeys;
