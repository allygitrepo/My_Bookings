import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, TextField, Button, MenuItem,
    Switch, FormControlLabel, Divider, CircularProgress, IconButton,
    ToggleButton, ToggleButtonGroup, Card, CardActionArea, CardMedia, CardContent,
    Tooltip, Avatar,
} from '@mui/material';
import {
    Language as WebsiteIcon,
    OpenInNew as OpenIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
    PhoneIphone as MobileIcon,
    Laptop as DesktopIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { getBusinesses, updateBusiness, getBusinessById } from '../api/business.api';
import TemplateMinimal from '../templates/TemplateMinimal';
import TemplatePremium from '../templates/TemplatePremium';
import TemplateModern from '../templates/TemplateModern';
import TemplatePortfolioStudio from '../templates/TemplatePortfolioStudio';
import TemplatePortfolioGrid from '../templates/TemplatePortfolioGrid';
import TemplatePortfolioCreative from '../templates/TemplatePortfolioCreative';
import { encodeBusinessId } from '../utils/obfuscation';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';
import { blockEmoji } from '../utils/validators';
import toast from 'react-hot-toast';

const WebsiteGenerator = () => {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Website Settings State
    const [settings, setSettings] = useState({
        slug: '',
        selected_template: 'template1',
        website_enabled: false,
        website_type: 'website',
        description: ''
    });

    // Preview Data State (Full business data including services/locations)
    const [previewData, setPreviewData] = useState(null);
    const [viewMode, setViewMode] = useState('desktop');

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const response = await getBusinesses();
            if (response.success && response.data.length > 0) {
                setBusinesses(response.data);

                // Try to select initial business (from localStorage or first in list)
                const storedUser = JSON.parse(localStorage.getItem('currentUser'));
                const initialId = storedUser?.business_id || response.data[0].id;
                setSelectedBusinessId(initialId);

                const currentBiz = response.data.find(b => String(b.id) === String(initialId));
                if (currentBiz) {
                    setSettings({
                        slug: currentBiz.slug || '',
                        selected_template: currentBiz.selected_template || 'template1',
                        website_enabled: currentBiz.website_enabled || false,
                        website_type: currentBiz.website_type || 'website',
                        description: currentBiz.description || ''
                    });
                }
            }
        } catch (error) {
            toast.error('Failed to fetch businesses');
        } finally {
            setLoading(false);
        }
    };

    const fetchPreviewData = async (bizId) => {
        if (!bizId) return;
        setPreviewLoading(true);
        try {
            // We use the public API logic but specifically for the ID we are editing
            // Since we need services and locations, we can fetch them or use a bulk endpoint
            // For now, let's assume we use the getBusinessBySlug which returns everything
            const biz = businesses.find(b => String(b.id) === String(bizId));
            const response = await getBusinessById(bizId);
            if (response.success) {
                setPreviewData(response.data);
            }
        } catch (error) {
            console.error('Preview data fetch failed', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    useEffect(() => {
        if (selectedBusinessId && businesses.length > 0) {
            fetchPreviewData(selectedBusinessId);
        }
    }, [selectedBusinessId, businesses]);

    const handleBusinessChange = (e) => {
        const id = e.target.value;
        setSelectedBusinessId(id);
        const biz = businesses.find(b => String(b.id) === String(id));
        if (biz) {
            setSettings({
                slug: biz.slug || '',
                selected_template: biz.selected_template || 'template1',
                website_enabled: biz.website_enabled || false,
                website_type: biz.website_type || 'website',
                description: biz.description || ''
            });
        }
    };

    const isSuspended = businesses.find(b => String(b.id) === String(selectedBusinessId))?.status === false;

    const handleSave = async () => {
        if (saving || isSuspended) return;
        if (blockEmoji(settings.slug) !== true) {
            toast.error('Slug contains emojis or invalid characters');
            return;
        }
        setSaving(true);
        showGlobalLoader('Saving website settings...');
        try {
            const response = await updateBusiness(selectedBusinessId, settings);
            if (response.success) {
                toast.success('Website settings updated!');
                // Update local list
                setBusinesses(prev => prev.map(b =>
                    String(b.id) === String(selectedBusinessId) ? { ...b, ...settings } : b
                ));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
            hideGlobalLoader();
        }
    };

    const renderTemplatePreview = () => {
        if (!previewData) return null;

        // Overlay current settings onto preview data
        const displayData = {
            ...previewData,
            business: { ...previewData.business, ...settings },
            hideScript: true
        };

        switch (settings.selected_template) {
            case 'template1': return <TemplateMinimal data={displayData} />;
            case 'template2': return <TemplatePremium data={displayData} />;
            case 'template3': return <TemplateModern data={displayData} />;
            case 'portfolio1': return <TemplatePortfolioStudio data={displayData} />;
            case 'portfolio2': return <TemplatePortfolioGrid data={displayData} />;
            case 'portfolio3': return <TemplatePortfolioCreative data={displayData} />;
            default: return <TemplateMinimal data={displayData} />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <PageTransition>
            <Box sx={{ px: 3, pb: 3 }}>
                <PageHeader
                    title="Website Builder"
                    subtitle="Design and launch your professional booking website in seconds."
                />

                <Grid container spacing={3}>
                    {/* Left Panel: Configuration Sidebar */}
                    <Grid item xs={12} lg={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: '16px',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: 'fit-content',
                                position: { xs: 'static', lg: 'sticky' },
                                top: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3.5,
                                bgcolor: 'background.paper',
                                mb: { xs: 2, lg: 0 }
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    1. Select Business
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={selectedBusinessId}
                                    onChange={handleBusinessChange}
                                    variant="outlined"
                                    sx={{ mt: 1 }}
                                >
                                    {businesses.map(biz => (
                                        <MenuItem key={biz.id} value={biz.id}>
                                            {biz.business_name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    2. Website Identity
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Website Username (Slug)"
                                    value={settings.slug}
                                    placeholder="e.g. shiv-clinic"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (blockEmoji(val) === true) {
                                            setSettings({ ...settings, slug: val });
                                        } else {
                                            toast.error('Emojis are not allowed');
                                        }
                                    }}
                                    helperText={selectedBusinessId ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Link: {window.location.origin}/{encodeBusinessId(selectedBusinessId)}
                                            </Typography>
                                            <Tooltip title="Visit Website">
                                                <IconButton 
                                                    size="small" 
                                                    sx={{ p: 0.2 }}
                                                    onClick={() => window.open(`/${encodeBusinessId(selectedBusinessId)}`, '_blank')}
                                                >
                                                    <OpenIcon sx={{ fontSize: '0.8rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : 'Select a business to get a live link'}
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    3. Choose Site Mode
                                </Typography>
                                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                    <Grid item xs={6}>
                                        <Button 
                                            fullWidth
                                            variant={settings.website_type === 'website' ? 'contained' : 'outlined'}
                                            onClick={() => setSettings({ ...settings, website_type: 'website', selected_template: 'template1' })}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
                                        >
                                            Website
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Tooltip title={!businesses.find(b => String(b.id) === String(selectedBusinessId))?.has_multiple_locations ? "" : "Portfolios are for solo providers only."}>
                                            <span style={{ display: 'block', width: '100%' }}>
                                                <Button 
                                                    fullWidth
                                                    disabled={businesses.find(b => String(b.id) === String(selectedBusinessId))?.has_multiple_locations}
                                                    variant={settings.website_type === 'portfolio' ? 'contained' : 'outlined'}
                                                    onClick={() => setSettings({ ...settings, website_type: 'portfolio', selected_template: 'portfolio1' })}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, height: '100%' }}
                                                >
                                                    Portfolio
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    4. Professional Bio
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    size="small"
                                    placeholder={settings.website_type === 'portfolio' ? "Describe your expertise and what you offer..." : "Summary of your business for the homepage..."}
                                    value={settings.description}
                                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.secondary', mb: 1.5 }}>
                                    5. Choose Template
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                                    {(settings.website_type === 'portfolio' ? [
                                        { id: 'portfolio1', name: 'Studio', img: '/templates/studio.png' },
                                        { id: 'portfolio2', name: 'Grid', img: '/templates/grid.png' },
                                        { id: 'portfolio3', name: 'Creative', img: '/templates/creative.png' },
                                    ] : [
                                        { id: 'template1', name: 'Minimal', img: '/templates/minimal.png' },
                                        { id: 'template2', name: 'Premium', img: '/templates/premium.png' },
                                        { id: 'template3', name: 'Modern', img: '/templates/modern.png' },
                                    ]).map((tmpl) => {
                                        const isSelected = settings.selected_template === tmpl.id;
                                        return (
                                            <Box
                                                key={tmpl.id}
                                                onClick={() => !isSuspended && setSettings({ ...settings, selected_template: tmpl.id })}
                                                sx={{
                                                    cursor: isSuspended ? 'not-allowed' : 'pointer',
                                                    opacity: isSuspended ? 0.6 : 1,                                                    borderRadius: '16px',
                                                    position: 'relative',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    border: '2.5px solid',
                                                    borderColor: isSelected ? 'primary.main' : 'transparent',
                                                    bgcolor: isSelected ? 'rgba(99,102,241,0.05)' : 'transparent',
                                                    p: 0.5,
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    aspectRatio: '1/1',
                                                    boxShadow: isSelected ? '0 8px 16px rgba(99,102,241,0.15)' : 'none'
                                                }}>
                                                    <CardMedia
                                                        component="img"
                                                        image={tmpl.img}
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            objectPosition: 'top',
                                                            filter: isSelected ? 'none' : 'grayscale(20%)',
                                                            opacity: isSelected ? 1 : 0.7,
                                                            transition: 'all 0.3s'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography sx={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    textAlign: 'center',
                                                    mt: 1,
                                                    color: isSelected ? 'primary.main' : 'text.secondary',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {tmpl.name}
                                                </Typography>
                                                {isSelected && (
                                                    <Box sx={{
                                                        position: 'absolute', top: -4, right: -4,
                                                        bgcolor: 'primary.main', color: 'white',
                                                        borderRadius: '50%', width: 16, height: 16,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                        zIndex: 2
                                                    }}>
                                                        <CheckIcon sx={{ fontSize: 10, fontWeight: 900 }} />
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right Panel: Full-Width Preview */}
                    <Grid item xs={12} lg={8}>
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 950, color: 'text.primary' }}>
                                        Live Preview
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ 
                                            px: 1, py: 0.3, borderRadius: 1.5, 
                                            bgcolor: settings.website_enabled ? '#dcfce7' : '#fee2e2', 
                                            color: settings.website_enabled ? '#166534' : '#991b1b', 
                                            fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', 
                                            letterSpacing: 0.5, border: '1px solid', 
                                            borderColor: settings.website_enabled ? '#bbf7d0' : '#fecaca'
                                        }}>
                                            {settings.website_enabled ? 'Live' : 'Draft'}
                                        </Box>
                                        <Switch
                                            size="small"
                                            checked={settings.website_enabled}
                                            disabled={isSuspended}
                                            onChange={async (e) => {
                                                if (isSuspended) return;
                                                const newEnabled = e.target.checked;
                                                setSettings(prev => ({ ...prev, website_enabled: newEnabled }));
                                                
                                                setSaving(true);
                                                try {
                                                    const response = await updateBusiness(selectedBusinessId, { ...settings, website_enabled: newEnabled });
                                                    if (response.success) {
                                                        toast.success(newEnabled ? 'Website Published!' : 'Website Moved to Draft');
                                                        setBusinesses(prev => prev.map(b =>
                                                            String(b.id) === String(selectedBusinessId) ? { ...b, ...settings, website_enabled: newEnabled } : b
                                                        ));
                                                    }
                                                } catch (error) {
                                                    toast.error('Auto-save failed.');
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, v) => v && setViewMode(v)}
                                    size="small"
                                    sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 0.3, border: '1px solid divider', width: { xs: '100%', sm: 'auto' } }}
                                >
                                    <ToggleButton value="desktop" sx={{ flex: 1, px: 2, border: 'none', borderRadius: '6px !important', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <DesktopIcon fontSize="small" sx={{ mr: 1 }} /> Desktop
                                    </ToggleButton>
                                    <ToggleButton value="mobile" sx={{ flex: 1, px: 2, border: 'none', borderRadius: '6px !important', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <MobileIcon fontSize="small" sx={{ mr: 1 }} /> Mobile
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            <Paper
                                elevation={0}
                                sx={{
                                    flexGrow: 1,
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    position: 'relative',
                                    bgcolor: 'transparent',
                                    minHeight: '80vh',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: viewMode === 'mobile' ? 375 : '100%',
                                        height: '100%',
                                        bgcolor: 'white',
                                        overflowY: 'auto',
                                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: viewMode === 'mobile' ? '0 0 64px rgba(0,0,0,0.15)' : 'none',
                                        '&::-webkit-scrollbar': { width: 6 },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 10 }
                                    }}
                                >
                                    {previewLoading ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                                            <CircularProgress size={32} thickness={5} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Updating Preview...</Typography>
                                        </Box>
                                    ) : (
                                        renderTemplatePreview()
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </PageTransition>
    );
};

export default WebsiteGenerator;
