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
import { encodeBusinessId } from '../utils/obfuscation';
import { showGlobalLoader, hideGlobalLoader } from '../utils/loader';
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
            });
        }
    };

    const handleSave = async () => {
        if (saving) return;
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
            business: { ...previewData.business, ...settings }
        };

        switch (settings.selected_template) {
            case 'template1': return <TemplateMinimal data={displayData} />;
            case 'template2': return <TemplatePremium data={displayData} />;
            case 'template3': return <TemplateModern data={displayData} />;
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
                                p: 2,
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                height: 'fit-content',
                                position: 'sticky',
                                top: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3.5,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                                    1. Select Business
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
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
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                                    2. Website Identity
                                </Typography>
                                <TextField
                                    fullWidth
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
                                    helperText={selectedBusinessId ? `Your site will be at: ${window.location.origin}/?biz=${encodeBusinessId(selectedBusinessId)}` : 'Select a business and publish to get a live link'}
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Box>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'text.secondary', mb: 1.5 }}>
                                    3. Choose Style
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    {[
                                        { id: 'template1', name: 'Minimal', img: '/templates/minimal.png' },
                                        { id: 'template2', name: 'Premium', img: '/templates/premium.png' },
                                        { id: 'template3', name: 'Modern', img: '/templates/modern.png' },
                                    ].map((tmpl) => {
                                        const isSelected = settings.selected_template === tmpl.id;
                                        return (
                                            <Box
                                                key={tmpl.id}
                                                onClick={() => setSettings({ ...settings, selected_template: tmpl.id })}
                                                sx={{
                                                    flex: 1,
                                                    cursor: 'pointer',
                                                    borderRadius: 3,
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
                                                    boxShadow: isSelected ? '0 8px 20px rgba(99,102,241,0.15)' : 'none'
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
                                                        position: 'absolute', top: -6, right: -6,
                                                        bgcolor: 'primary.main', color: 'white',
                                                        borderRadius: '50%', width: 18, height: 18,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                        zIndex: 2
                                                    }}>
                                                        <CheckIcon sx={{ fontSize: 12, fontWeight: 900 }} />
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
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, background: 'linear-gradient(90deg, #1e293b, #64748b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Live Preview
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ 
                                            px: 1.5, py: 0.5, borderRadius: 1.5, 
                                            bgcolor: settings.website_enabled ? '#dcfce7' : '#fee2e2', 
                                            color: settings.website_enabled ? '#166534' : '#991b1b', 
                                            fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', 
                                            letterSpacing: 1, border: '1px solid', 
                                            borderColor: settings.website_enabled ? '#bbf7d0' : '#fecaca',
                                            transition: 'all 0.3s'
                                        }}>
                                            {settings.website_enabled ? 'Published' : 'Draft'}
                                        </Box>
                                        <Switch
                                            size="small"
                                            checked={settings.website_enabled}
                                            onChange={async (e) => {
                                                const newEnabled = e.target.checked;
                                                setSettings(prev => ({ ...prev, website_enabled: newEnabled }));
                                                
                                                // Trigger auto-save
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
                                            sx={{ 
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#22c55e' },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#22c55e' }
                                            }}
                                        />
                                    </Box>
                                    {settings.website_enabled && settings.slug && (
                                        <Tooltip title="View Live Site">
                                            <IconButton size="small" onClick={() => window.open(`/?biz=${encodeBusinessId(selectedBusinessId)}`, '_blank')} sx={{ bgcolor: 'action.hover' }}>
                                                <OpenIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>

                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, v) => v && setViewMode(v)}
                                    size="small"
                                    sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 0.5, border: '1px solid divider' }}
                                >
                                    <ToggleButton value="desktop" sx={{ px: 3, border: 'none', borderRadius: '8px !important' }}>
                                        <DesktopIcon fontSize="small" sx={{ mr: 1 }} /> Desktop
                                    </ToggleButton>
                                    <ToggleButton value="mobile" sx={{ px: 3, border: 'none', borderRadius: '8px !important' }}>
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
                                    bgcolor: '#f8fafc',
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
