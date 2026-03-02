import React, { useState } from 'react';
import {
    Card, Typography, Box, Button, FormControl, InputLabel, Select,
    MenuItem, Grid, Alert, Chip,
} from '@mui/material';
import {
    ContentCopy as CopyIcon, Key as KeyIcon, Warning as WarnIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useBusinesses, useApiKeys } from '../store';

const WidgetScript = () => {
    const [businesses] = useBusinesses();
    const [apiKeys] = useApiKeys();

    const [selectedBusinessId, setSelectedBusinessId] = useState(
        businesses.length > 0 ? businesses[0].id : ''
    );

    // Find the active API key for the selected business
    const matchedKey = apiKeys.find(k => k.business_id === selectedBusinessId);
    const apiKeyValue = matchedKey?.api_key || null;
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

    const scriptTag = apiKeyValue
        ? `<script\n  src="https://cdn.mybookings.com/widget.js"\n  data-business-id="${apiKeyValue}"\n  data-theme="light"\n  async>\n</script>`
        : `<!-- No API Key found for this business. Generate one on the API Keys page. -->`;

    const handleCopy = () => toast.success('Widget script copied to clipboard!');

    return (
        <PageTransition>
            <PageHeader
                title="Widget Script"
                subtitle="Embed the booking widget directly on your website."
            />

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 4 }}>

                        {/* Step 1 — select business */}
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            1. Select Business
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Choose which business you want to generate the embed script for.
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 4 }}>
                            <InputLabel>Business</InputLabel>
                            <Select
                                value={selectedBusinessId}
                                label="Business"
                                onChange={e => setSelectedBusinessId(e.target.value)}
                            >
                                {businesses.length === 0 && <MenuItem value=""><em>No businesses added yet</em></MenuItem>}
                                {businesses.map(b => (
                                    <MenuItem key={b.id} value={b.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {b.business_name}
                                            {apiKeys.some(k => k.business_id === b.id) ? (
                                                <Chip icon={<KeyIcon sx={{ fontSize: '0.8rem !important' }} />} label="Key ready" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            ) : (
                                                <Chip label="No key" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* API key status */}
                        {selectedBusinessId && !apiKeyValue && (
                            <Alert severity="warning" icon={<WarnIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                                <strong>{selectedBusiness?.business_name}</strong> doesn't have an API key yet.
                                Go to <strong>API Keys</strong> and click "Generate New Key" for this business first.
                            </Alert>
                        )}

                        {selectedBusinessId && apiKeyValue && (
                            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                Using API key: <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{apiKeyValue.slice(0, 20)}…</code>
                            </Alert>
                        )}

                        {/* Step 2 — script */}
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            2. Copy &amp; Paste Script
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Place this tag just before the closing <code>&lt;/body&gt;</code> tag on your website.
                        </Typography>

                        <Box sx={{
                            bgcolor: '#0f172a', color: '#94a3b8', p: 3, borderRadius: 2,
                            position: 'relative', fontFamily: 'monospace', fontSize: '0.875rem',
                            overflowX: 'auto', whiteSpace: 'pre', mb: 3, lineHeight: 1.7,
                        }}>
                            {/* Syntax highlight: attribute names in blue, values in green */}
                            {apiKeyValue ? (
                                <>
                                    <span style={{ color: '#f472b6' }}>&lt;script</span>{'\n'}
                                    {'  '}<span style={{ color: '#93c5fd' }}>src</span><span style={{ color: '#94a3b8' }}>="</span><span style={{ color: '#86efac' }}>https://cdn.mybookings.com/widget.js</span><span style={{ color: '#94a3b8' }}>"</span>{'\n'}
                                    {'  '}<span style={{ color: '#93c5fd' }}>data-business-id</span><span style={{ color: '#94a3b8' }}>="</span><span style={{ color: '#fde68a' }}>{apiKeyValue}</span><span style={{ color: '#94a3b8' }}>"</span>{'\n'}
                                    {'  '}<span style={{ color: '#93c5fd' }}>data-theme</span><span style={{ color: '#94a3b8' }}>="</span><span style={{ color: '#86efac' }}>light</span><span style={{ color: '#94a3b8' }}>"</span>{'\n'}
                                    {'  '}<span style={{ color: '#93c5fd' }}>async</span><span style={{ color: '#f472b6' }}>{'>'}</span>{'\n'}
                                    <span style={{ color: '#f472b6' }}>&lt;/script&gt;</span>
                                </>
                            ) : (
                                <span style={{ color: '#64748b' }}>
                                    {scriptTag}
                                </span>
                            )}

                            {apiKeyValue && (
                                <CopyToClipboard text={scriptTag} onCopy={handleCopy}>
                                    <Button
                                        variant="contained" size="small"
                                        sx={{ position: 'absolute', top: 12, right: 12 }}
                                        startIcon={<CopyIcon />}
                                    >
                                        Copy
                                    </Button>
                                </CopyToClipboard>
                            )}
                        </Box>
                    </Card>
                </Grid>

                {/* Integration guide */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3.5, bgcolor: 'background.default', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Integration Guide
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, color: 'text.secondary', '& li': { mb: 2 } }}>
                            <li>
                                <Typography variant="body2">
                                    <strong>HTML / Static site:</strong> Paste the script before <code>&lt;/body&gt;</code> in your HTML file.
                                </Typography>
                            </li>

                        </Box>


                    </Card>
                </Grid>
            </Grid>
        </PageTransition>
    );
};

export default WidgetScript;
