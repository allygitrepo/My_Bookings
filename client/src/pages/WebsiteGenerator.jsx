import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, MenuItem,
    Switch, FormControlLabel, Divider, CircularProgress, IconButton,
    ToggleButton, ToggleButtonGroup, Card, CardActionArea, CardMedia, CardContent,
    Tooltip, Avatar, ThemeProvider, createTheme
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
import { getTemplates } from '../api/template.api';
import { Chip } from '@mui/material';
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
        description: '',
        business_key: ''
    });

    // Preview Data State (Full business data including services/locations)
    const [previewData, setPreviewData] = useState(null);
    const [viewMode, setViewMode] = useState('desktop');
    const [templates, setTemplates] = useState([]);

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
                        description: currentBiz.description || '',
                        business_key: currentBiz.business_key || ''
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
        const fetchTemplatesList = async () => {
            try {
                const response = await getTemplates();
                if (response.success) {
                    setTemplates(response.data);
                }
            } catch (error) {
                console.error('Failed to load templates', error);
            }
        };
        fetchTemplatesList();
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
                description: biz.description || '',
                business_key: biz.business_key || ''
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
            hideScript: true,
            isPreview: true,
            viewMode: viewMode
        };

        const isExternal = !['template1', 'template2', 'template3', 'portfolio1', 'portfolio2', 'portfolio3'].includes(settings.selected_template);
        if (isExternal) {
            const biz = businesses.find(b => String(b.id) === String(selectedBusinessId));
            const businessKey = biz ? biz.business_key : settings.business_key;
            const siteUrl = businessKey 
                ? `http://localhost/My_Bookings/server/public/site/${businessKey}`
                : null;

            return (
                <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                    <WebsiteIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.8, mb: 1 }} />
                    <Typography variant="h5" fontWeight={900} color="text.primary">
                        External Custom Template Active
                    </Typography>
                    <Typography variant="body2" sx={{ maxWidth: 450, mx: 'auto', mb: 2 }}>
                        Your website is running as an isolated PHP template. All booking widgets, services, and locations sync dynamically.
                    </Typography>
                    {siteUrl ? (
                        <Button
                            variant="contained"
                            startIcon={<OpenIcon />}
                            onClick={() => window.open(siteUrl, '_blank')}
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 800,
                                px: 3,
                                py: 1
                            }}
                        >
                            Open Live Site
                        </Button>
                    ) : (
                        <Typography variant="caption" color="warning.main" fontWeight={700}>
                            ⚠️ Publish changes to generate your live site URL.
                        </Typography>
                    )}
                </Box>
            );
        }

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

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Top Panel: Configuration Settings */}
                    <Box sx={{ width: '100%' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, sm: 4 },
                                borderRadius: '24px',
                                border: '1.5px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                bgcolor: 'background.paper',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                            }}
                        >
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
                                gap: 4
                            }}>
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

                                {/* <Box>
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
                                </Box> */}

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        2. Choose Site Mode
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                                        <Button
                                            fullWidth
                                            variant={settings.website_type === 'website' ? 'contained' : 'outlined'}
                                            onClick={() => setSettings({ ...settings, website_type: 'website', selected_template: 'template1' })}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 1 }}
                                        >
                                            Website
                                        </Button>
                                        <Tooltip title={!businesses.find(b => String(b.id) === String(selectedBusinessId))?.has_multiple_locations ? "" : "Portfolios are for solo providers only."}>
                                            <span style={{ flex: 1 }}>
                                                <Button
                                                    fullWidth
                                                    disabled={businesses.find(b => String(b.id) === String(selectedBusinessId))?.has_multiple_locations}
                                                    variant={settings.website_type === 'portfolio' ? 'contained' : 'outlined'}
                                                    onClick={() => setSettings({ ...settings, website_type: 'portfolio', selected_template: 'portfolio1' })}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 1, height: '100%' }}
                                                >
                                                    Portfolio
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                <Box sx={{ gridColumn: { lg: 'span 2' } }}>
                                    <Typography variant="subtitle2" fontWeight={800} gutterBottom color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        3. Professional Bio
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        size="small"
                                        placeholder={settings.website_type === 'portfolio' ? "Describe your expertise and what you offer..." : "Summary of your business for the homepage..."}
                                        value={settings.description}
                                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>

                                <Box sx={{ gridColumn: { lg: 'span 1' } }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.secondary', mb: 1.5 }}>
                                        5. Choose Template
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                                        {([
                                            // Built-in templates
                                            ...(settings.website_type === 'portfolio' ? [
                                                { id: 'portfolio1', name: 'Studio', img: '/templates/studio.png', category: 'portfolio', is_external: false },
                                                { id: 'portfolio2', name: 'Grid', img: '/templates/grid.png', category: 'portfolio', is_external: false },
                                                { id: 'portfolio3', name: 'Creative', img: '/templates/creative.png', category: 'portfolio', is_external: false },
                                            ] : [
                                                { id: 'template1', name: 'Minimal', img: '/templates/minimal.png', category: 'website', is_external: false },
                                                { id: 'template2', name: 'Premium', img: '/templates/premium.png', category: 'website', is_external: false },
                                                { id: 'template3', name: 'Modern', img: '/templates/modern.png', category: 'website', is_external: false },
                                            ]),
                                            // Dynamic templates from DB
                                            ...templates
                                                .filter(t => t.category === settings.website_type)
                                                .map(t => ({
                                                    id: t.id,
                                                    name: t.name,
                                                    img: t.img || null,
                                                    category: t.category,
                                                    is_external: true
                                                }))
                                        ]).map((tmpl) => {
                                            const isSelected = settings.selected_template === tmpl.id;
                                            return (
                                                <Box
                                                    key={tmpl.id}
                                                    onClick={() => !isSuspended && setSettings({ ...settings, selected_template: tmpl.id })}
                                                    sx={{
                                                        cursor: isSuspended ? 'not-allowed' : 'pointer',
                                                        opacity: isSuspended ? 0.6 : 1, borderRadius: '12px',
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
                                                        borderRadius: 1.5,
                                                        overflow: 'hidden',
                                                        aspectRatio: '1/1',
                                                        boxShadow: isSelected ? '0 8px 16px rgba(99,102,241,0.15)' : 'none',
                                                        position: 'relative'
                                                    }}>
                                                        <CardMedia
                                                            component="img"
                                                            image={tmpl.img || (tmpl.category === 'portfolio' ? '/templates/studio.png' : '/templates/minimal.png')}
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
                                                        {tmpl.is_external && (
                                                            <Chip 
                                                                label="Custom" 
                                                                size="small" 
                                                                color="primary" 
                                                                sx={{ 
                                                                    position: 'absolute', 
                                                                    top: 6, 
                                                                    left: 6, 
                                                                    height: 18, 
                                                                    fontSize: '0.6rem', 
                                                                    fontWeight: 800,
                                                                    borderRadius: '4px'
                                                                }} 
                                                            />
                                                        )}
                                                    </Box>
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
                            </Box>
                        </Paper>
                    </Box>

                    {/* Bottom Panel: Full-Width Preview */}
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
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

                            {/* Mockup Container */}
                            <Box
                                sx={{
                                    width: '100%',
                                    bgcolor: 'transparent',
                                    minHeight: '95vh',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: { xs: 0, md: 2 },
                                    overflow: 'hidden',
                                    transition: 'all 0.5s ease',
                                }}
                            >
                                {/* Device Wrapper */}
                                <Box sx={{
                                    position: 'relative',
                                    width: viewMode === 'mobile' ? 375 + 24 : '100%',
                                    maxWidth: viewMode === 'mobile' ? 399 : 1200,
                                    height: viewMode === 'mobile' ? 780 : '75vh',
                                    bgcolor: '#1a1d21', // Frame color
                                    borderRadius: viewMode === 'mobile' ? '54px' : '16px 16px 8px 8px',
                                    p: viewMode === 'mobile' ? '54px 12px 18px 12px' : '40px 0px 0px 0px', // Mockup bezels
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}>
                                    {/* Mobile Decorations */}
                                    {viewMode === 'mobile' && (
                                        <>
                                            <Box sx={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', width: 60, height: 6, bgcolor: '#2a2e33', borderRadius: 10 }} />
                                            <Box sx={{ position: 'absolute', top: 22, left: '62%', width: 6, height: 6, bgcolor: '#2a2e33', borderRadius: '50%' }} />
                                        </>
                                    )}

                                    {/* Desktop Decorations */}
                                    {viewMode === 'desktop' && (
                                        <Box sx={{ position: 'absolute', top: 16, left: 20, display: 'flex', gap: 1 }}>
                                            <Box sx={{ width: 9, height: 11, borderRadius: '50%', bgcolor: '#FF5F56' }} />
                                            <Box sx={{ width: 9, height: 11, borderRadius: '50%', bgcolor: '#FFBD2E' }} />
                                            <Box sx={{ width: 9, height: 11, borderRadius: '50%', bgcolor: '#27C93F' }} />
                                        </Box>
                                    )}

                                    {/* Inner Screen */}
                                    <Box
                                        sx={{
                                            flexGrow: 1,
                                            position: 'relative',
                                            bgcolor: 'transparent',
                                            borderRadius: viewMode === 'mobile' ? '36px' : '0 0 4px 4px',
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            containerType: 'inline-size',
                                            '&::-webkit-scrollbar': { width: 4 },
                                            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                                            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 10 }
                                        }}
                                    >
                                        {previewLoading ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                                                <CircularProgress size={32} thickness={5} />
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Updating Preview...</Typography>
                                            </Box>
                                        ) : (
                                            <ThemeProvider theme={createTheme({
                                                breakpoints: {
                                                    values: {
                                                        xs: 0,
                                                        sm: viewMode === 'mobile' ? 10000 : 600,
                                                        md: viewMode === 'mobile' ? 10001 : 900,
                                                        lg: viewMode === 'mobile' ? 10002 : 1200,
                                                        xl: viewMode === 'mobile' ? 10003 : 1536,
                                                    }
                                                }
                                            })}>
                                                {renderTemplatePreview()}
                                            </ThemeProvider>
                                        )}
                                    </Box>

                                    {/* Desktop Base Mockup */}
                                    {viewMode === 'desktop' && (
                                        <Box sx={{ height: 4, bgcolor: '#111', width: '40%', mx: 'auto', borderRadius: '0 0 10px 100px', opacity: 0.5 }} />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </PageTransition>
    );
};

export default WebsiteGenerator;
