import React, { useState } from 'react';
import {
    Card,
    Typography,
    Box,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useBusinesses } from '../store';

const WidgetScript = () => {
    const [businesses] = useBusinesses();
    const [selectedBusiness, setSelectedBusiness] = useState(
        businesses.length > 0 ? businesses[0].id : ''
    );

    const handleCopy = () => {
        toast.success('Widget script copied to clipboard!');
    };

    const scriptTag = `<script 
  src="https://cdn.bookingapp.com/widget.js" 
  data-business-id="${selectedBusiness || 'YOUR_BUSINESS_ID_HERE'}" 
  data-theme="light"
  async>
</script>`;

    return (
        <>
            <PageHeader
                title="Widget Script"
                subtitle="Embed the booking widget directly into your website."
            />

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            1. Select Business
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Choose which business you want to generate the widget script for.
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 4 }}>
                            <InputLabel>Business</InputLabel>
                            <Select
                                value={selectedBusiness}
                                label="Business"
                                onChange={(e) => setSelectedBusiness(e.target.value)}
                            >
                                {businesses.length === 0 && <MenuItem value=""><em>None</em></MenuItem>}
                                {businesses.map((b) => (
                                    <MenuItem key={b.id} value={b.id}>
                                        {b.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="h6" gutterBottom>
                            2. Copy & Paste Script
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Place this script tag just before the closing <code>&lt;/body&gt;</code> tag on your website.
                        </Typography>

                        <Box
                            sx={{
                                bgcolor: '#1e293b',
                                color: '#e2e8f0',
                                p: 3,
                                borderRadius: 2,
                                position: 'relative',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                overflowX: 'auto',
                                whiteSpace: 'pre',
                                mb: 3
                            }}
                        >
                            {scriptTag}
                            <CopyToClipboard text={scriptTag} onCopy={handleCopy}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    sx={{ position: 'absolute', top: 12, right: 12 }}
                                    startIcon={<CopyIcon />}
                                >
                                    Copy
                                </Button>
                            </CopyToClipboard>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 4, bgcolor: 'background.default', border: 'none', boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom>
                            Integration Guide
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, color: 'text.secondary', '& li': { mb: 2 } }}>
                            <li>
                                <Typography variant="body2">
                                    <strong>WordPress:</strong> Use a plugin like "Insert Headers and Footers" or paste into your theme's footer.php.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <strong>Shopify:</strong> Edit your theme.liquid file and paste the script before the closing body tag.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <strong>Squarespace:</strong> Go to Settings {'>'} Advanced {'>'} Code Injection and paste into the Footer section.
                                </Typography>
                            </li>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

export default WidgetScript;
