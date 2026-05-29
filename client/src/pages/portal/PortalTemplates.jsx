import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, TextField,
    InputAdornment, IconButton, Switch, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControlLabel, MenuItem,
    Tooltip, Chip, useTheme, createTheme, ThemeProvider, Avatar, Divider,
    CircularProgress
} from '@mui/material';
import { getTemplates } from '../../api/template.api';
import {
    Palette as TemplateIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Visibility,
    VisibilityOff,
    ContentCopy as CopyIcon,
    Check as CheckIcon,
    Settings as SettingsIcon,
    Language as GlobeIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Lock as LockIcon,
    Laptop as DesktopIcon,
    PhoneIphone as MobileIcon,
    Save as SaveIcon,
    CheckCircle as CheckCircleIcon,
    Layers as LayersIcon,
    CloudUpload as CloudIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxBlankIcon
} from '@mui/icons-material';
import PageTransition from '../../components/PageTransition';
import toast from 'react-hot-toast';

// Templates components
import TemplateMinimal from '../../templates/TemplateMinimal';
import TemplatePremium from '../../templates/TemplatePremium';
import TemplateModern from '../../templates/TemplateModern';
import TemplatePortfolioStudio from '../../templates/TemplatePortfolioStudio';
import TemplatePortfolioGrid from '../../templates/TemplatePortfolioGrid';
import TemplatePortfolioCreative from '../../templates/TemplatePortfolioCreative';

// Mock vendor/business data for the Live Preview Simulator
const MOCK_PREVIEW_DATA = {
    business: {
        business_name: "Triveni Brass Clinic",
        business_type: "Healthcare & Wellness",
        phone: "+91 98765 43210",
        email: "contact@trivenibrass.com",
        description: "Providing world-class medical consulting and custom wellness programs. Committed to precision and dedicated patient care.",
        slug: "triveni-brass",
        upi_id: "triveni@okaxis",
        logo: null
    },
    services: [
        { id: 1, service_name: "Full Body Diagnostic", duration_minutes: 45, price: 1200 },
        { id: 2, service_name: "Physiotherapy Consultation", duration_minutes: 60, price: 800 },
        { id: 3, service_name: "Bespoke Wellness Plan", duration_minutes: 30, price: 500 },
        { id: 4, service_name: "Cardio Assessment", duration_minutes: 40, price: 1000 }
    ],
    locations: [
        { id: 1, location_name: "Super-specialty Wing", address: "101 Highstreet Avenue, Bodakdev", city: "Ahmedabad", state: "Gujarat" },
        { id: 2, location_name: "Wellness & Rehab Center", address: "G-4 Corporate Road, Prahladnagar", city: "Ahmedabad", state: "Gujarat" }
    ]
};

const PortalTemplates = () => {
    const theme = useTheme();

    // Template Master State
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplatesList = async () => {
            try {
                const response = await getTemplates();
                if (response.success) {
                    setTemplates(response.data);
                }
            } catch (error) {
                toast.error('Failed to load templates.');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplatesList();
    }, []);

    // Cards inline form edit state (to simulate modification)
    const [cardEdits, setCardEdits] = useState({});

    // Visibility toggles for keys
    const [showTokens, setShowTokens] = useState({});

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Add Template Modal State
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        id: '',
        category: 'website',
        slug: '',
        token: '',
        version: 'v1.0.0',
        status: true
    });
    const [businessCategory, setBusinessCategory] = useState('🏥 Healthcare / Hospital');
    const [zipFile, setZipFile] = useState(null);

    // Edit Template Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState({
        id: '',
        name: '',
        category: 'website',
        bizCategory: ''
    });

    const openEditModal = (tmpl) => {
        setEditingTemplate({
            id: tmpl.id,
            name: tmpl.name,
            category: tmpl.category,
            bizCategory: tmpl.bizCategory || '🏥 Healthcare / Hospital'
        });
        setEditModalOpen(true);
    };

    const handleUpdateTemplate = (e) => {
        e.preventDefault();
        setTemplates(prev => prev.map(tmpl => {
            if (tmpl.id === editingTemplate.id) {
                return {
                    ...tmpl,
                    name: editingTemplate.name,
                    category: editingTemplate.category,
                    bizCategory: editingTemplate.bizCategory
                };
            }
            return tmpl;
        }));
        toast.success(`Template details updated successfully!`);
        setEditModalOpen(false);
    };

    // Delete Template Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);

    // Preview Simulator State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [activePreviewTemplate, setActivePreviewTemplate] = useState(null);
    const [previewDeviceMode, setPreviewDeviceMode] = useState('desktop');

    // Copy to clipboard helper
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    // Handle inline input edits
    const handleInputChange = (templateId, field, value) => {
        setCardEdits(prev => ({
            ...prev,
            [templateId]: {
                ...prev[templateId],
                [field]: value
            }
        }));
    };

    // Save changes for a template
    const handleSaveChanges = (id) => {
        const edits = cardEdits[id];
        if (!edits) {
            toast.success('No changes to save.');
            return;
        }

        setTemplates(prev => prev.map(tmpl => {
            if (tmpl.id === id) {
                return {
                    ...tmpl,
                    slug: edits.slug !== undefined ? edits.slug : tmpl.slug,
                    token: edits.token !== undefined ? edits.token : tmpl.token,
                    version: edits.version !== undefined ? edits.version : tmpl.version
                };
            }
            return tmpl;
        }));

        toast.success(`Settings saved for template ${id}!`);
        // Remove from edit state
        setCardEdits(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    // Toggle template status switch
    const handleStatusToggle = (id) => {
        setTemplates(prev => prev.map(tmpl => {
            if (tmpl.id === id) {
                const nextStatus = !tmpl.status;
                toast.success(`Template ${tmpl.name} is now ${nextStatus ? 'Active' : 'Inactive'}`);
                return { ...tmpl, status: nextStatus };
            }
            return tmpl;
        }));
    };

    // Delete template confirmation trigger
    const triggerDelete = (tmpl) => {
        setTemplateToDelete(tmpl);
        setDeleteConfirmOpen(true);
    };

    // Confirm Delete Action
    const confirmDelete = () => {
        if (templateToDelete) {
            setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            toast.error(`Template ${templateToDelete.name} has been deleted.`);
            setDeleteConfirmOpen(false);
            setTemplateToDelete(null);
        }
    };

    // Toggle token visibility
    const toggleTokenVisibility = (id) => {
        setShowTokens(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Open Live Preview Simulator
    const openPreview = (tmpl) => {
        setActivePreviewTemplate(tmpl);
        setPreviewOpen(true);
    };

    // Create template action
    const handleCreateTemplate = (e) => {
        e.preventDefault();
        if (!newTemplate.name || !newTemplate.id || !newTemplate.slug) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (templates.some(t => t.id.toLowerCase() === newTemplate.id.toLowerCase())) {
            toast.error('A template with this ID already exists!');
            return;
        }

        const newTmpl = {
            id: newTemplate.id,
            name: newTemplate.name,
            category: newTemplate.category,
            slug: newTemplate.slug,
            token: newTemplate.token || 'DEFAULT_CONFIG_HASH',
            activeInstalls: 0,
            status: newTemplate.status,
            version: newTemplate.version || 'v1.0.0'
        };

        setTemplates(prev => [...prev, newTmpl]);
        toast.success(`Template "${newTemplate.name}" added successfully!`);
        setAddModalOpen(false);
        // Reset form
        setNewTemplate({
            name: '',
            id: '',
            category: 'website',
            slug: '',
            token: '',
            version: 'v1.0.0',
            status: true
        });
    };

    // Filter templates based on queries
    const filteredTemplates = templates.filter(tmpl => {
        const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || tmpl.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || tmpl.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && tmpl.status) ||
            (statusFilter === 'inactive' && !tmpl.status);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Stats calculations
    const totalInstalls = templates.reduce((acc, curr) => acc + curr.activeInstalls, 0);
    const activeCount = templates.filter(t => t.status).length;
    const websiteCount = templates.filter(t => t.category === 'website').length;
    const portfolioCount = templates.filter(t => t.category === 'portfolio').length;

    // Render active template in preview screen
    const renderPreviewTemplateContent = () => {
        if (!activePreviewTemplate) return null;

        const displayData = {
            ...MOCK_PREVIEW_DATA,
            business: {
                ...MOCK_PREVIEW_DATA.business,
                business_name: activePreviewTemplate.name + " Live Demo",
                selected_template: activePreviewTemplate.id
            },
            hideScript: true,
            isPreview: true,
            viewMode: previewDeviceMode
        };

        switch (activePreviewTemplate.id) {
            case 'template1': return <TemplateMinimal data={displayData} />;
            case 'template2': return <TemplatePremium data={displayData} />;
            case 'template3': return <TemplateModern data={displayData} />;
            case 'portfolio1': return <TemplatePortfolioStudio data={displayData} />;
            case 'portfolio2': return <TemplatePortfolioGrid data={displayData} />;
            case 'portfolio3': return <TemplatePortfolioCreative data={displayData} />;
            default: return (
                <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                    <LayersIcon sx={{ fontSize: 80, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h5" fontWeight={700}>Custom Template Built</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>Using configuration hash: {activePreviewTemplate.token}</Typography>
                </Box>
            );
        }
    };

    return (
        <PageTransition>
            <Box sx={{ px: { xs: 2, md: 4 }, pb: 5 }}>
                {/* Header Section */}
                <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ maxWidth: 800 }}>
                        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.5, color: '#fff' }}>
                            Custom ZIP Templates
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                            Deploy self-contained HTML/PHP templates to XAMPP Apache for isolated multi-tenant booking sites.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<CloudIcon />}
                        onClick={() => setAddModalOpen(true)}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 800,
                            py: 1.2,
                            px: 3,
                            bgcolor: '#10b981',
                            color: '#fff',
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                            '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
                        }}
                    >
                        Deploy New ZIP
                    </Button>
                </Box>

                {/* Filter and Count Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TextField
                            select
                            size="small"
                            label="Filter by Category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            sx={{
                                minWidth: 240,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    bgcolor: 'rgba(0,0,0,0.15)',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' }
                                }
                            }}
                            SelectProps={{
                                renderValue: (selected) => {
                                    const labels = {
                                        all: '📂 All Categories',
                                        website: '💻 Websites',
                                        portfolio: '💼 Portfolios',
                                        'Salon / Beauty': '💇 Salon & Beauty',
                                        'Healthcare / Hospital': '🏥 Healthcare / Hospital',
                                        'Gym & Fitness': '💪 Gym & Fitness'
                                    };
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={700}>{labels[selected]}</Typography>
                                            <Chip
                                                label={
                                                    selected === 'all' ? templates.length :
                                                    selected === 'website' ? templates.filter(t => t.category === 'website').length :
                                                    selected === 'portfolio' ? templates.filter(t => t.category === 'portfolio').length :
                                                    templates.filter(t => t.bizCategory === selected).length
                                                }
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.65rem',
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    fontWeight: 800,
                                                    ml: 1
                                                }}
                                            />
                                        </Box>
                                    );
                                }
                            }}
                        >
                            <MenuItem value="all">📂 All Categories</MenuItem>
                            <MenuItem value="website">💻 Websites</MenuItem>
                            <MenuItem value="portfolio">💼 Portfolios</MenuItem>
                            <MenuItem value="Salon / Beauty">💇 Salon & Beauty</MenuItem>
                            <MenuItem value="Healthcare / Hospital">🏥 Healthcare / Hospital</MenuItem>
                            <MenuItem value="Gym & Fitness">💪 Gym & Fitness</MenuItem>
                        </TextField>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Showing <strong>{filteredTemplates.length}</strong> template{filteredTemplates.length === 1 ? '' : 's'} across all categories
                    </Typography>
                </Box>

                {/* Templates Cards Grid */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3.5}>
                    {filteredTemplates.map((tmpl) => {
                        return (
                            <Grid item xs={12} sm={6} md={3} key={tmpl.id}>
                                <Card sx={{
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    background: 'rgba(10, 15, 30, 0.5)',
                                    backdropFilter: 'blur(16px)',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        borderColor: 'rgba(99,102,241,0.3)',
                                        boxShadow: '0 16px 36px rgba(0,0,0,0.4)'
                                    }
                                }}>
                                    {/* Card Content Wrapper */}
                                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        {/* Gradient pill indicator */}
                                        <Box sx={{ 
                                            height: 4, 
                                            background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                                            borderRadius: '99px',
                                            width: '100%',
                                            mb: 0.5
                                        }} />

                                        {/* Avatar & Details Row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                variant="rounded"
                                                sx={{
                                                    bgcolor: 'rgba(30, 41, 59, 0.4)',
                                                    border: '1.5px solid rgba(255, 255, 255, 0.05)',
                                                    color: '#818cf8',
                                                    fontWeight: 900,
                                                    fontSize: '1.4rem',
                                                    borderRadius: '20px',
                                                    width: 64,
                                                    height: 64
                                                }}
                                            >
                                                {tmpl.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', fontSize: '1.25rem', lineHeight: 1.2 }}>
                                                    {tmpl.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontWeight: 700, fontSize: '0.85rem' }}>
                                                    📁 {tmpl.id}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Badges Row */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.5,
                                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                                    bgcolor: 'rgba(16, 185, 129, 0.06)',
                                                    color: '#10b981',
                                                    fontWeight: 800,
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {tmpl.bizCategory || 'General'}
                                            </Box>
                                            <Box
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.5,
                                                    border: '1px solid rgba(59, 130, 246, 0.25)',
                                                    bgcolor: 'rgba(59, 130, 246, 0.06)',
                                                    color: '#3b82f6',
                                                    fontWeight: 800,
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {tmpl.category === 'portfolio' ? 'Portfolio' : 'Website'}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Action Buttons bottom row (flush) */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                        height: 52,
                                        width: '100%'
                                    }}>
                                        <Button
                                            onClick={() => openEditModal(tmpl)}
                                            startIcon={<EditIcon sx={{ fontSize: '1rem' }} />}
                                            sx={{
                                                flex: 1,
                                                borderRadius: 0,
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                textTransform: 'none',
                                                bgcolor: 'rgba(99, 102, 241, 0.05)',
                                                color: '#818cf8',
                                                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                                                py: 1.5,
                                                '&:hover': { 
                                                    bgcolor: 'rgba(99, 102, 241, 0.15)' 
                                                }
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => triggerDelete(tmpl)}
                                            startIcon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
                                            sx={{
                                                flex: 1,
                                                borderRadius: 0,
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                textTransform: 'none',
                                                bgcolor: 'rgba(239, 68, 68, 0.05)',
                                                color: '#ef4444',
                                                py: 1.5,
                                                '&:hover': { 
                                                    bgcolor: 'rgba(239, 68, 68, 0.15)' 
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
                )}

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'rgba(30, 41, 59, 0.1)', borderRadius: '24px', border: '1.5px dashed rgba(255,255,255,0.08)' }}>
                        <LayersIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                        <Typography variant="h6" fontWeight={700}>No templates found</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Try adjusting your filters or search query.</Typography>
                    </Box>
                )}

                {/* Add Template Modal Dialog */}
                <Dialog
                    open={addModalOpen}
                    onClose={() => { setAddModalOpen(false); setZipFile(null); }}
                    PaperProps={{
                        sx: {
                            bgcolor: 'rgba(21, 28, 45, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '24px',
                            maxWidth: 500,
                            width: '100%',
                            p: 1.5
                        }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5, color: '#fff' }}>
                                Deploy ZIP Template
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Upload a ZIP template package to register it in the platform.
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => { setAddModalOpen(false); setZipFile(null); }} sx={{ color: 'text.secondary', mt: -3 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newTemplate.name) {
                            toast.error('Please enter a Template Name.');
                            return;
                        }
                        if (!zipFile) {
                            toast.error('Please upload a ZIP Template archive.');
                            return;
                        }

                        // Simulate deployment
                        const toastId = toast.loading('Extracting and deploying ZIP archive...');
                        setTimeout(() => {
                            const newTmpl = {
                                id: 'custom_' + Math.random().toString(36).substr(2, 5),
                                name: newTemplate.name,
                                category: newTemplate.category,
                                slug: 'demo-' + newTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                                token: 'CONFIG_' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                                activeInstalls: 0,
                                status: true,
                                version: 'v1.0.0'
                            };
                            setTemplates(prev => [...prev, newTmpl]);
                            toast.success(`Template "${newTemplate.name}" deployed and extracted!`, { id: toastId });
                            setAddModalOpen(false);
                            // Reset
                            setNewTemplate({
                                name: '',
                                id: '',
                                category: 'website',
                                slug: '',
                                token: '',
                                version: 'v1.0.0',
                                status: true
                            });
                            setZipFile(null);
                        }, 2000);
                    }}>
                        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                            {/* Template Name Input */}
                            <Box>
                                <TextField
                                    fullWidth
                                    required
                                    placeholder="Template Name"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                />
                            </Box>

                            {/* Target Business Category Dropdown */}
                            <Box>
                                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Target Business Category
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={businessCategory}
                                    onChange={(e) => setBusinessCategory(e.target.value)}
                                >
                                    <MenuItem value="🏥 Healthcare / Hospital">🏥 Healthcare / Hospital</MenuItem>
                                    <MenuItem value="💇 Salon & Beauty">💇 Salon & Beauty</MenuItem>
                                    <MenuItem value="💪 Gym & Fitness">💪 Gym & Fitness</MenuItem>
                                    <MenuItem value="🎓 Education & Tutors">🎓 Education & Tutors</MenuItem>
                                    <MenuItem value="⚖️ Legal & Consulting">⚖️ Legal & Consulting</MenuItem>
                                    <MenuItem value="🍽️ Food & Restaurant">🍽️ Food & Restaurant</MenuItem>
                                    <MenuItem value="💻 IT & Coding">💻 IT & Coding</MenuItem>
                                </TextField>
                            </Box>

                            {/* Template Type (Site Mode) */}
                            <Box>
                                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Template Type (Site Mode)
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Website Card */}
                                    <Grid item xs={6}>
                                        <Card
                                            onClick={() => setNewTemplate({ ...newTemplate, category: 'website' })}
                                            sx={{
                                                cursor: 'pointer',
                                                border: newTemplate.category === 'website' ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                                                bgcolor: newTemplate.category === 'website' ? 'rgba(99,102,241,0.04)' : 'rgba(0,0,0,0.1)',
                                                p: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                borderRadius: '16px',
                                                transition: 'all 0.2s',
                                                '&:hover': { borderColor: newTemplate.category === 'website' ? '#6366f1' : 'rgba(255,255,255,0.2)' }
                                            }}
                                        >
                                            {newTemplate.category === 'website' ? (
                                                <CheckBoxIcon sx={{ color: '#6366f1' }} />
                                            ) : (
                                                <CheckBoxBlankIcon sx={{ color: 'rgba(255,255,255,0.2)' }} />
                                            )}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <GlobeIcon sx={{ fontSize: '1rem', color: 'primary.light' }} />
                                                    <Typography variant="subtitle2" fontWeight={800}>Website</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Standard site mode</Typography>
                                            </Box>
                                        </Card>
                                    </Grid>

                                    {/* Portfolio Card */}
                                    <Grid item xs={6}>
                                        <Card
                                            onClick={() => setNewTemplate({ ...newTemplate, category: 'portfolio' })}
                                            sx={{
                                                cursor: 'pointer',
                                                border: newTemplate.category === 'portfolio' ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                                                bgcolor: newTemplate.category === 'portfolio' ? 'rgba(99,102,241,0.04)' : 'rgba(0,0,0,0.1)',
                                                p: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                borderRadius: '16px',
                                                transition: 'all 0.2s',
                                                '&:hover': { borderColor: newTemplate.category === 'portfolio' ? '#6366f1' : 'rgba(255,255,255,0.2)' }
                                            }}
                                        >
                                            {newTemplate.category === 'portfolio' ? (
                                                <CheckBoxIcon sx={{ color: '#6366f1' }} />
                                            ) : (
                                                <CheckBoxBlankIcon sx={{ color: 'rgba(255,255,255,0.2)' }} />
                                            )}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LayersIcon sx={{ fontSize: '1rem', color: 'secondary.light' }} />
                                                    <Typography variant="subtitle2" fontWeight={800}>Portfolio</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Solo provider mode</Typography>
                                            </Box>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* ZIP Upload Selector Area */}
                            <Box>
                                <input
                                    type="file"
                                    accept=".zip"
                                    id="zip-template-file-input"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            setZipFile(e.target.files[0].name);
                                        }
                                    }}
                                />
                                <Box
                                    onClick={() => document.getElementById('zip-template-file-input').click()}
                                    sx={{
                                        cursor: 'pointer',
                                        border: '1.5px dashed rgba(255,255,255,0.12)',
                                        bgcolor: 'rgba(0,0,0,0.2)',
                                        borderRadius: '16px',
                                        p: 4,
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'rgba(255,255,255,0.3)',
                                            bgcolor: 'rgba(255,255,255,0.02)'
                                        }
                                    }}
                                >
                                    <CloudIcon sx={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.4)' }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                                            Click to select ZIP Template archive
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            Max File Size: 50MB (Supports index.php/html & databases)
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* File Name display */}
                                {zipFile && (
                                    <Box sx={{
                                        mt: 1.5,
                                        px: 2,
                                        py: 1,
                                        borderRadius: '10px',
                                        bgcolor: 'rgba(16,185,129,0.08)',
                                        border: '1px solid rgba(16,185,129,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Typography variant="caption" fontWeight={700} color="success.light" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            📦 {zipFile}
                                        </Typography>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setZipFile(null); }} sx={{ color: 'error.light', p: 0.2 }}>
                                            <CloseIcon sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                            <Button onClick={() => { setAddModalOpen(false); setZipFile(null); }} sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'none' }}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    px: 4,
                                    py: 1.2,
                                    bgcolor: '#10b981',
                                    color: 'white',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                                    '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
                                }}
                            >
                                Deploy & Extract
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Delete Template Confirmation Dialog */}
                <Dialog
                    open={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    PaperProps={{
                        sx: {
                            bgcolor: 'rgba(30, 41, 59, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            maxWidth: 400,
                            p: 1
                        }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirm Template Deletion</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            Are you sure you want to delete template <strong>{templateToDelete?.name}</strong>?
                            <br />This will hide it from vendor profiles.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={confirmDelete} sx={{ borderRadius: '10px', fontWeight: 700 }}>Delete</Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Template Details Dialog */}
                <Dialog
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    PaperProps={{
                        sx: {
                            bgcolor: 'rgba(21, 28, 45, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '24px',
                            maxWidth: 500,
                            width: '100%',
                            p: 1.5
                        }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5, color: '#fff' }}>
                                Edit Template Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.85rem', lineHeight: 1.4 }}>
                                Update the metadata details of your template. Note that the underlying folder slug/template ID remains constant to prevent breaking active client setups.
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setEditModalOpen(false)} sx={{ color: 'text.secondary', alignSelf: 'flex-start', mt: -0.5 }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <form onSubmit={handleUpdateTemplate}>
                        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                            {/* Template Name Input */}
                            <Box>
                                <TextField
                                    fullWidth
                                    required
                                    label="Template Name"
                                    placeholder="Template Name"
                                    value={editingTemplate.name}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                            bgcolor: 'rgba(0,0,0,0.15)',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'text.secondary',
                                            '&.Mui-focused': { color: '#3b82f6' }
                                        }
                                    }}
                                />
                            </Box>

                            {/* Target Business Category Dropdown */}
                            <Box>
                                <TextField
                                    select
                                    fullWidth
                                    label="Target Business Category"
                                    value={editingTemplate.bizCategory}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, bizCategory: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                            bgcolor: 'rgba(0,0,0,0.15)',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'text.secondary',
                                            '&.Mui-focused': { color: '#3b82f6' }
                                        }
                                    }}
                                >
                                    <MenuItem value="Salon / Beauty">✂️ Salon / Beauty</MenuItem>
                                    <MenuItem value="Healthcare / Hospital">🏥 Healthcare / Hospital</MenuItem>
                                    <MenuItem value="Gym & Fitness">💪 Gym & Fitness</MenuItem>
                                    <MenuItem value="Education / Tutor">🎓 Education & Tutors</MenuItem>
                                    <MenuItem value="Legal / Consulting">⚖️ Legal & Consulting</MenuItem>
                                    <MenuItem value="Food / Restaurant">🍽️ Food & Restaurant</MenuItem>
                                    <MenuItem value="IT / Coding">💻 IT & Coding</MenuItem>
                                </TextField>
                            </Box>

                            {/* Template Type (Site Mode) */}
                            <Box>
                                <Typography variant="caption" fontWeight={750} sx={{ color: 'text.secondary', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Template Type (Site Mode)
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Website Card */}
                                    <Grid item xs={6}>
                                        <Card
                                            onClick={() => setEditingTemplate({ ...editingTemplate, category: 'website' })}
                                            sx={{
                                                cursor: 'pointer',
                                                border: editingTemplate.category === 'website' ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                                                bgcolor: editingTemplate.category === 'website' ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.15)',
                                                p: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                borderRadius: '16px',
                                                transition: 'all 0.2s',
                                                '&:hover': { borderColor: editingTemplate.category === 'website' ? '#3b82f6' : 'rgba(255,255,255,0.2)' }
                                            }}
                                        >
                                            {editingTemplate.category === 'website' ? (
                                                <CheckBoxIcon sx={{ color: '#3b82f6' }} />
                                            ) : (
                                                <CheckBoxBlankIcon sx={{ color: 'rgba(255,255,255,0.2)' }} />
                                            )}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <span style={{ fontSize: '1rem' }}>🌐</span>
                                                    <Typography variant="subtitle2" fontWeight={800}>Website</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Standard site mode</Typography>
                                            </Box>
                                        </Card>
                                    </Grid>

                                    {/* Portfolio Card */}
                                    <Grid item xs={6}>
                                        <Card
                                            onClick={() => setEditingTemplate({ ...editingTemplate, category: 'portfolio' })}
                                            sx={{
                                                cursor: 'pointer',
                                                border: editingTemplate.category === 'portfolio' ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                                                bgcolor: editingTemplate.category === 'portfolio' ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.15)',
                                                p: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                borderRadius: '16px',
                                                transition: 'all 0.2s',
                                                '&:hover': { borderColor: editingTemplate.category === 'portfolio' ? '#3b82f6' : 'rgba(255,255,255,0.2)' }
                                            }}
                                        >
                                            {editingTemplate.category === 'portfolio' ? (
                                                <CheckBoxIcon sx={{ color: '#3b82f6' }} />
                                            ) : (
                                                <CheckBoxBlankIcon sx={{ color: 'rgba(255,255,255,0.2)' }} />
                                            )}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <span style={{ fontSize: '1rem' }}>💼</span>
                                                    <Typography variant="subtitle2" fontWeight={800}>Portfolio</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Solo provider mode</Typography>
                                            </Box>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 2, justifyContent: 'flex-end' }}>
                            <Button onClick={() => setEditModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'none' }}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    px: 4,
                                    py: 1.2,
                                    bgcolor: '#2563eb',
                                    color: 'white',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                                    '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
                                }}
                            >
                                Save Changes
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Live Preview Device Simulator Dialog */}
                <Dialog
                    fullScreen
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    PaperProps={{
                        sx: {
                            background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
                            color: '#fff',
                            p: 0
                        }
                    }}
                >
                    <Box sx={{
                        p: 2,
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: '#0a0f1d',
                        zIndex: 10
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: 'text.secondary' }}>
                                <CloseIcon />
                            </IconButton>
                            <Box>
                                <Typography variant="h6" fontWeight={850} color="text.primary">
                                    Live Simulator: {activePreviewTemplate?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Displaying template rendering with dummy business data
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, bgcolor: 'rgba(255,255,255,0.03)', p: 0.5, borderRadius: '10px' }}>
                            <Tooltip title="Desktop Viewport">
                                <IconButton
                                    size="small"
                                    onClick={() => setPreviewDeviceMode('desktop')}
                                    sx={{
                                        color: previewDeviceMode === 'desktop' ? 'primary.main' : 'text.secondary',
                                        bgcolor: previewDeviceMode === 'desktop' ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        borderRadius: '8px',
                                        p: 1
                                    }}
                                >
                                    <DesktopIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Mobile Viewport">
                                <IconButton
                                    size="small"
                                    onClick={() => setPreviewDeviceMode('mobile')}
                                    sx={{
                                        color: previewDeviceMode === 'mobile' ? 'primary.main' : 'text.secondary',
                                        bgcolor: previewDeviceMode === 'mobile' ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        borderRadius: '8px',
                                        p: 1
                                    }}
                                >
                                    <MobileIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={() => setPreviewOpen(false)}
                                sx={{ textTransform: 'none', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                Exit Preview
                            </Button>
                        </Box>
                    </Box>

                    {/* Simulator screen container */}
                    <Box sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 0, md: 3 },
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* Device Frame */}
                        <Box sx={{
                            position: 'relative',
                            width: previewDeviceMode === 'mobile' ? 375 + 24 : '100%',
                            maxWidth: previewDeviceMode === 'mobile' ? 399 : 1280,
                            height: previewDeviceMode === 'mobile' ? '82vh' : '100%',
                            bgcolor: '#1a1d21',
                            borderRadius: previewDeviceMode === 'mobile' ? '54px' : '12px 12px 0px 0px',
                            p: previewDeviceMode === 'mobile' ? '50px 12px 18px 12px' : '0px',
                            border: '1.5px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            {/* Device camera hole */}
                            {previewDeviceMode === 'mobile' && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 22,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 70,
                                    height: 10,
                                    bgcolor: '#2d3238',
                                    borderRadius: '10px',
                                    zIndex: 20
                                }} />
                            )}

                            {/* Inner simulation screen */}
                            <Box sx={{
                                flexGrow: 1,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                bgcolor: '#000',
                                borderRadius: previewDeviceMode === 'mobile' ? '38px' : '0px',
                                '&::-webkit-scrollbar': { width: 4 },
                                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 10 }
                            }}>
                                {/* Customize nested breakpoints theme for accurate mobile layouts */}
                                <ThemeProvider theme={createTheme({
                                    breakpoints: {
                                        values: {
                                            xs: 0,
                                            sm: previewDeviceMode === 'mobile' ? 10000 : 600,
                                            md: previewDeviceMode === 'mobile' ? 10001 : 900,
                                            lg: previewDeviceMode === 'mobile' ? 10002 : 1200,
                                            xl: previewDeviceMode === 'mobile' ? 10003 : 1536,
                                        }
                                    }
                                })}>
                                    {renderPreviewTemplateContent()}
                                </ThemeProvider>
                            </Box>
                        </Box>
                    </Box>
                </Dialog>
            </Box>
        </PageTransition>
    );
};

export default PortalTemplates;
