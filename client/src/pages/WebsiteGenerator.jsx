import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, MenuItem,
    Switch, FormControlLabel, Divider, CircularProgress, IconButton,
    ToggleButton, ToggleButtonGroup, Card, CardActionArea, CardMedia, CardContent,
    Tooltip, Avatar, ThemeProvider, createTheme, Chip
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
import axiosInstance from '../api/axiosInstance';
import TemplateMinimal from '../templates/TemplateMinimal';
import TemplatePremium from '../templates/TemplatePremium';
import TemplateModern from '../templates/TemplateModern';
import TemplatePortfolioStudio from '../templates/TemplatePortfolioStudio';
import TemplatePortfolioGrid from '../templates/TemplatePortfolioGrid';
import TemplatePortfolioCreative from '../templates/TemplatePortfolioCreative';
import { encodeBusinessId } from '../utils/obfuscation';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';
import { blockEmoji } from '../utils/validators';
import { getTemplateIconUrl } from '../utils/templateIcon';
import toast from 'react-hot-toast';

const WebsiteGenerator = () => {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [customTemplates, setCustomTemplates] = useState([]);
    const [failedTemplateIcons, setFailedTemplateIcons] = useState({});

    // Website Settings State
    const [settings, setSettings] = useState({
        slug: '',
        selected_template: '',
        website_enabled: false,
        website_type: 'website',
        description: ''
    });

    // Preview Data State (Full business data including services/locations)
    const [previewData, setPreviewData] = useState(null);
    const [viewMode, setViewMode] = useState('desktop');

    const fetchCustomTemplates = async () => {
        try {
            const response = await axiosInstance.get('/templates/active');
            if (response.data.success) {
                setCustomTemplates(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch active custom templates:', error);
        }
    };

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
                        selected_template: currentBiz.selected_template || '',
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
        fetchCustomTemplates();
    }, []);

    useEffect(() => {
        setFailedTemplateIcons({});
    }, [customTemplates]);

    useEffect(() => {
        if (selectedBusinessId && businesses.length > 0) {
            fetchPreviewData(selectedBusinessId);
        }
    }, [selectedBusinessId, businesses]);

    // Auto-select template if the currently selected one is filtered out
    useEffect(() => {
        if (!selectedBusinessId || businesses.length === 0) return;
        const currentBiz = businesses.find(b => String(b.id) === String(selectedBusinessId));
        if (!currentBiz) return;

        const bizCategory = currentBiz.business_type;

        const defaultTemplates = [];

        const filteredCustom = customTemplates.filter(c => {
            const matchCategory = c.category === bizCategory;
            const templateType = c.type || 'website';
            const matchType = templateType.split(',').map(t => t.trim()).includes(settings.website_type);
            return matchCategory && matchType;
        });

        const allFilteredIds = [...defaultTemplates.map(t => t.id), ...filteredCustom.map(c => c.id)];

        if (!allFilteredIds.includes(settings.selected_template)) {
            const defaultId = filteredCustom[0]?.id || '';
            setSettings(prev => ({ ...prev, selected_template: defaultId }));
        }
    }, [selectedBusinessId, settings.website_type, customTemplates, businesses]);

    const handleBusinessChange = (e) => {
        const id = e.target.value;
        setSelectedBusinessId(id);
        const biz = businesses.find(b => String(b.id) === String(id));
        if (biz) {
            setSettings({
                slug: biz.slug || '',
                selected_template: biz.selected_template || '',
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

    const currentBiz = businesses.find(b => String(b.id) === String(selectedBusinessId));
    const hasUnsavedChanges = currentBiz && (
        settings.selected_template !== (currentBiz.selected_template || '') ||
        settings.slug !== (currentBiz.slug || '') ||
        settings.website_enabled !== (currentBiz.website_enabled || false) ||
        settings.website_type !== (currentBiz.website_type || 'website') ||
        settings.description !== (currentBiz.description || '')
    );

    const handleVisitLiveWebsite = (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            toast.error("Please click 'Save Changes' before viewing the live website!");
            return;
        }
        window.open(`/${encodeBusinessId(selectedBusinessId)}`, '_blank');
    };

    const renderTemplatePreview = () => {
        if (!previewData) return null;

        if (!settings.selected_template) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1, p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={850} color="#ffffff">
                        Please Select a Template First
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
                        Choose one of the templates above to see its live preview here.
                    </Typography>
                </Box>
            );
        }

        // Overlay current settings onto preview data
        const displayData = {
            ...previewData,
            business: { ...previewData.business, ...settings },
            hideScript: true,
            isPreview: true,
            viewMode: viewMode
        };

        const standardTemplates = ['template1', 'template2', 'template3', 'portfolio1', 'portfolio2', 'portfolio3'];
        if (!standardTemplates.includes(settings.selected_template)) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/mybookings';
            return (
                <iframe
                    src={`${apiBase}/templates/${settings.selected_template}/${selectedBusinessId}/?preview=true`}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: '#ffffff'
                    }}
                    title="Live Preview"
                />
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <PageHeader
                        title="Website Builder"
                        subtitle="Design and launch your professional booking website in seconds."
                        sx={{ m: 0 }}
                    />
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => window.open('/docs#website', '_blank')}
                        startIcon={<WebsiteIcon />}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 800,
                            textTransform: 'none',
                            py: 1,
                            px: 2.5,
                            borderWidth: '1.5px',
                            borderColor: 'secondary.main',
                            color: 'secondary.main',
                            '&:hover': {
                                borderWidth: '1.5px',
                                background: 'rgba(156, 39, 176, 0.08)',
                            }
                        }}
                    >
                        Read User Guide
                    </Button>
                </Box>

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
                                        <span style={{ flex: 1 }}>
                                            <Button
                                                fullWidth
                                                variant={settings.website_type === 'website' ? 'contained' : 'outlined'}
                                                onClick={() => setSettings({ ...settings, website_type: 'website', selected_template: '' })}
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 1 }}
                                            >
                                                Website
                                            </Button>
                                        </span>
                                        <Tooltip title={!businesses.find(b => String(b.id) === String(selectedBusinessId))?.has_multiple_locations ? "" : "Portfolios are for solo providers only."}>
                                            <span style={{ flex: 1 }}>
                                                <Button
                                                    fullWidth
                                                    disabled={businesses.find(b => String(b.id) === String(selectedBusinessId))?.has_multiple_locations}
                                                    variant={settings.website_type === 'portfolio' ? 'contained' : 'outlined'}
                                                    onClick={() => setSettings({ ...settings, website_type: 'portfolio', selected_template: '' })}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 1 }}
                                                >
                                                    Portfolio
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                <Box sx={{ gridColumn: '1 / -1' }}>
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
                            </Box>

                            <Divider sx={{ borderColor: 'divider' }} />

                            <Box>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'primary.main', mb: 2 }}>
                                    5. Choose Template
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: 'repeat(2, 1fr)',
                                        sm: 'repeat(3, 1fr)',
                                        md: 'repeat(4, 1fr)',
                                        lg: 'repeat(6, 1fr)'
                                    },
                                    gap: 2.5
                                }}>
                                    {(() => {
                                        const currentBiz = businesses.find(b => String(b.id) === String(selectedBusinessId));
                                        const bizCategory = currentBiz?.business_type;

                                        const defaultTemplates = [];

                                        const filteredCustom = customTemplates
                                            .filter(c => {
                                                const matchCategory = c.category === bizCategory;
                                                const templateType = c.type || 'website';
                                                const matchType = templateType.split(',').map(t => t.trim()).includes(settings.website_type);
                                                return matchCategory && matchType;
                                            })
                                            .map(c => ({
                                                id: c.id,
                                                name: c.displayName,
                                                img: getTemplateIconUrl(c),
                                                isCustom: true,
                                                category: c.category,
                                                templateId: c.templateId || c.id,
                                            }));

                                        const list = [...defaultTemplates, ...filteredCustom];
                                        if (list.length === 0) {
                                            return (
                                                <Box sx={{ gridColumn: '1 / -1', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    <Typography variant="h6" fontWeight={800} color="text.secondary">
                                                        Templates Coming Soon
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                                                        No custom templates are available for this business type yet.
                                                    </Typography>
                                                </Box>
                                            );
                                        }

                                        return list.map((tmpl) => {
                                            const isSelected = settings.selected_template === tmpl.id;
                                            return (
                                                <Tooltip title={tmpl.name + (tmpl.isCustom ? ` (Custom - ${tmpl.category})` : "")} key={tmpl.id} arrow>
                                                    <Box
                                                        onClick={() => !isSuspended && setSettings({ ...settings, selected_template: tmpl.id })}
                                                        sx={{
                                                            cursor: isSuspended ? 'not-allowed' : 'pointer',
                                                            opacity: isSuspended ? 0.6 : 1,
                                                            borderRadius: '16px',
                                                            position: 'relative',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            border: '2.5px solid',
                                                            borderColor: isSelected ? 'primary.main' : 'transparent',
                                                            bgcolor: isSelected ? 'rgba(99,102,241,0.05)' : 'transparent',
                                                            p: 0.75,
                                                            '&:hover': {
                                                                transform: 'translateY(-4px)',
                                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                                                            }
                                                        }}
                                                    >
                                                        {tmpl.isCustom && (
                                                            <Chip
                                                                label="Custom"
                                                                size="small"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: 6,
                                                                    left: 6,
                                                                    fontSize: '0.6rem',
                                                                    height: 16,
                                                                    fontWeight: 900,
                                                                    backgroundColor: '#10B981',
                                                                    color: '#ffffff',
                                                                    zIndex: 3,
                                                                    border: 'none',
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        )}
                                                        <Box sx={{
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            aspectRatio: '1/1',
                                                            boxShadow: isSelected ? '0 8px 20px rgba(99,102,241,0.18)' : 'none',
                                                            bgcolor: tmpl.isCustom ? 'rgba(10,12,22,0.8)' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}>
                                                            {tmpl.isCustom && (failedTemplateIcons[tmpl.id] || !tmpl.img) ? (
                                                                <Avatar
                                                                    sx={{
                                                                        width: '60%',
                                                                        height: '60%',
                                                                        bgcolor: 'rgba(99,102,241,0.2)',
                                                                        color: 'primary.main',
                                                                        fontWeight: 800,
                                                                        fontSize: '1.5rem',
                                                                    }}
                                                                >
                                                                    {tmpl.name?.charAt(0)?.toUpperCase() || 'T'}
                                                                </Avatar>
                                                            ) : (
                                                                <CardMedia
                                                                    component="img"
                                                                    image={tmpl.img}
                                                                    onError={() => {
                                                                        if (tmpl.isCustom) {
                                                                            setFailedTemplateIcons((prev) => ({ ...prev, [tmpl.id]: true }));
                                                                        }
                                                                    }}
                                                                    sx={{
                                                                        width: tmpl.isCustom ? '60%' : '100%',
                                                                        height: tmpl.isCustom ? '60%' : '100%',
                                                                        objectFit: tmpl.isCustom ? 'contain' : 'cover',
                                                                        objectPosition: 'top',
                                                                        filter: isSelected ? 'none' : 'grayscale(15%)',
                                                                        opacity: isSelected ? 1 : 0.75,
                                                                        transition: 'all 0.3s'
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>

                                                        {/* Template Name Label Below Thumbnail */}
                                                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                                                            <Typography variant="caption" fontWeight={750} display="block" color={isSelected ? 'primary.main' : 'text.primary'} sx={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {tmpl.name}
                                                            </Typography>
                                                            {tmpl.isCustom && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {tmpl.category}
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {isSelected && (
                                                            <Box sx={{
                                                                position: 'absolute', top: -4, right: -4,
                                                                bgcolor: 'primary.main', color: 'white',
                                                                borderRadius: '50%', width: 18, height: 18,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                                zIndex: 2
                                                            }}>
                                                                <CheckIcon sx={{ fontSize: 11, fontWeight: 900 }} />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Tooltip>
                                            );
                                        });
                                    })()}
                                </Box>
                            </Box>

                            <Divider sx={{ borderColor: 'divider' }} />

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    onClick={handleSave}
                                    disabled={saving || isSuspended}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.5,
                                        px: 4,
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                        boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)'
                                        }
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
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
                                        {settings.website_enabled && (
                                            <>
                                                <Tooltip title="Visit Live Website">
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleVisitLiveWebsite}
                                                        sx={{ p: 0.5, color: 'primary.main' }}
                                                    >
                                                        <OpenIcon sx={{ fontSize: '1.1rem' }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        color: 'text.secondary', 
                                                        fontFamily: 'monospace', 
                                                        bgcolor: 'rgba(255,255,255,0.05)', 
                                                        px: 1.2, 
                                                        py: 0.5, 
                                                        borderRadius: 1,
                                                        border: '1px dashed rgba(255,255,255,0.1)',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            color: 'primary.main',
                                                            borderColor: 'primary.main',
                                                            bgcolor: 'rgba(99,102,241,0.05)'
                                                        }
                                                    }}
                                                    onClick={handleVisitLiveWebsite}
                                                >
                                                    {window.location.origin}/{encodeBusinessId(selectedBusinessId)}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                </Box>

                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, v) => v && setViewMode(v)}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '12px',
                                        p: '4px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    <ToggleButton
                                        value="desktop"
                                        sx={{
                                            flex: 1,
                                            px: 2.5,
                                            py: 0.75,
                                            border: 'none',
                                            borderRadius: '8px !important',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            transition: 'all 0.2s ease',
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                                color: '#fff',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.12)'
                                                }
                                            },
                                            '&:hover': {
                                                color: '#fff',
                                                bgcolor: 'rgba(255, 255, 255, 0.04)'
                                            }
                                        }}
                                    >
                                        <DesktopIcon fontSize="small" sx={{ mr: 1 }} /> Desktop
                                    </ToggleButton>
                                    <ToggleButton
                                        value="mobile"
                                        sx={{
                                            flex: 1,
                                            px: 2.5,
                                            py: 0.75,
                                            border: 'none',
                                            borderRadius: '8px !important',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            transition: 'all 0.2s ease',
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                                color: '#fff',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.12)'
                                                }
                                            },
                                            '&:hover': {
                                                color: '#fff',
                                                bgcolor: 'rgba(255, 255, 255, 0.04)'
                                            }
                                        }}
                                    >
                                        <MobileIcon fontSize="small" sx={{ mr: 1 }} /> Mobile
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* Mockup Container */}
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    mt: 1,
                                    overflow: 'visible',
                                    transition: 'all 0.5s ease',
                                    // In mobile mode, add a dark background only around the phone
                                    ...(viewMode === 'mobile' ? {
                                        bgcolor: 'rgba(10,12,18,0.6)',
                                        borderRadius: '64px',
                                        p: '24px',
                                        width: 'fit-content',
                                        mx: 'auto',
                                        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
                                    } : {
                                        bgcolor: 'transparent',
                                    })
                                }}
                            >
                                {/* Device Wrapper */}
                                <Box sx={{
                                    position: 'relative',
                                    width: viewMode === 'mobile' ? 375 : '100%',
                                    maxWidth: viewMode === 'mobile' ? 375 : '100%',
                                    height: viewMode === 'mobile' ? 780 : '110vh',
                                    bgcolor: '#1a1d21',
                                    borderRadius: viewMode === 'mobile' ? '48px' : '16px 16px 8px 8px',
                                    p: viewMode === 'mobile' ? '52px 10px 16px 10px' : '40px 0px 0px 0px',
                                    boxShadow: viewMode === 'mobile'
                                        ? '0 0 0 2px rgba(255,255,255,0.08), 0 30px 80px -10px rgba(0,0,0,0.6)'
                                        : '0 40px 100px -20px rgba(0,0,0,0.3)',
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
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: 40,
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 2.5
                                        }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF5F56' }} />
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FFBD2E' }} />
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27C93F' }} />
                                            </Box>
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
                                            '&::-webkit-scrollbar': { display: 'none', width: 0 },
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                            // Dark strip to cover iframe scrollbar
                                            '&::after': viewMode === 'mobile' ? {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: '10px',
                                                height: '100%',
                                                bgcolor: '#1a1d21',
                                                zIndex: 10,
                                                borderRadius: '0 36px 36px 0',
                                                pointerEvents: 'none',
                                            } : {},
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
