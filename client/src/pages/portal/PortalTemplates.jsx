import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Avatar,
    IconButton,
    Button,
    Tooltip,
    CircularProgress,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    Card,
    CardContent,
    CardActions,
    Tabs,
    Tab,
    Checkbox,
    FormControlLabel,
    FormGroup,
    FormLabel,
    FormControl
} from "@mui/material";
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Layers as TemplatesIcon,
    Business as BusinessIcon,
    Category as CategoryIcon,
    CheckCircle as ActiveIcon,
    Folder as FolderIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import axiosInstance from "../../api/axiosInstance";
import PageTransition from "../../components/PageTransition";
import toast from "react-hot-toast";
import { getTemplateIconUrl } from "../../utils/templateIcon";

const INDUSTRY_OPTIONS = [
    { label: "Healthcare / Hospital", value: "Healthcare / Hospital", icon: "🏥" },
    { label: "Corporate", value: "Corporate", icon: "🏢" },
    { label: "Salon / Beauty", value: "Salon / Beauty", icon: "✂️" },
    { label: "Gym / Fitness", value: "Gym / Fitness", icon: "💪" },
    { label: "Spa / Wellness", value: "Spa / Wellness", icon: "🧖" },
    { label: "Education / Coaching", value: "Education / Coaching", icon: "🎓" },
    { label: "Professional Services", value: "Professional Services", icon: "💼" },
    { label: "Other", value: "Other", icon: "📁" }
];

const PortalTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("All");

    // Upload Form State
    const [openDialog, setOpenDialog] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [category, setCategory] = useState("Healthcare / Hospital");
    const [deployWebsite, setDeployWebsite] = useState(true);
    const [deployPortfolio, setDeployPortfolio] = useState(false);
    const [zipFile, setZipFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [deploying, setDeploying] = useState(false);

    // Edit Form State
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editCategory, setEditCategory] = useState("Healthcare / Hospital");
    const [editWebsite, setEditWebsite] = useState(true);
    const [editPortfolio, setEditPortfolio] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/templates/portal");
            if (response.data.success) {
                setTemplates(response.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch templates catalog");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.name.endsWith(".zip")) {
                toast.error("Only .zip archives are allowed");
                return;
            }
            setZipFile(file);
            setFileName(file.name);
        }
    };

    const handleDeploy = async () => {
        if (!displayName.trim()) {
            toast.error("Please provide a template name");
            return;
        }
        if (!zipFile) {
            toast.error("Please select a ZIP template file to upload");
            return;
        }

        setDeploying(true);
        const formData = new FormData();
        formData.append("displayName", displayName);
        formData.append("category", category);
        
        const selectedTypes = [];
        if (deployWebsite) selectedTypes.push("website");
        if (deployPortfolio) selectedTypes.push("portfolio");
        formData.append("type", selectedTypes.length > 0 ? selectedTypes.join(",") : "website");
        
        formData.append("zipFile", zipFile);

        try {
            console.log("[Deployment Log] zip uploaded to frontend form");
            console.log("[Deployment Log] sending to backend...");
            const response = await axiosInstance.post("/templates/portal/deploy", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            if (response.data.success) {
                toast.success("Template extracted & deployed successfully!");
                setOpenDialog(false);
                setDisplayName("");
                setCategory("Healthcare / Hospital");
                setDeployWebsite(true);
                setDeployPortfolio(false);
                setZipFile(null);
                setFileName("");
                fetchTemplates();
            }
        } catch (error) {
            console.error("[Deployment Log] error:", error);
            const errMsg = error.response?.data?.message || "Failed to deploy template";
            toast.error(errMsg);
        } finally {
            setDeploying(false);
        }
    };

    const handleDeployWebsiteChange = (checked) => {
        if (checked) {
            setDeployWebsite(true);
            setDeployPortfolio(false);
        } else {
            setDeployWebsite(false);
            setDeployPortfolio(true);
        }
    };

    const handleDeployPortfolioChange = (checked) => {
        if (checked) {
            setDeployPortfolio(true);
            setDeployWebsite(false);
        } else {
            setDeployPortfolio(false);
            setDeployWebsite(true);
        }
    };

    const handleEditWebsiteChange = (checked) => {
        if (checked) {
            setEditWebsite(true);
            setEditPortfolio(false);
        } else {
            setEditWebsite(false);
            setEditPortfolio(true);
        }
    };

    const handleEditPortfolioChange = (checked) => {
        if (checked) {
            setEditPortfolio(true);
            setEditWebsite(false);
        } else {
            setEditPortfolio(false);
            setEditWebsite(true);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axiosInstance.delete(`/templates/portal/${id}`);
            if (response.data.success) {
                toast.success("Template purged completely.");
                fetchTemplates();
            }
        } catch (error) {
            toast.error("Failed to delete template");
        }
    };

    const handleOpenEditDialog = (template) => {
        setEditingTemplateId(template.id);
        setEditDisplayName(template.displayName);
        setEditCategory(template.category);
        const types = (template.type || "website").split(",");
        setEditWebsite(types.includes("website"));
        setEditPortfolio(types.includes("portfolio"));
        setOpenEditDialog(true);
    };

    const handleEditSubmit = async () => {
        if (!editDisplayName.trim()) {
            toast.error("Please provide a template name");
            return;
        }

        setSavingEdit(true);
        try {
            const selectedTypes = [];
            if (editWebsite) selectedTypes.push("website");
            if (editPortfolio) selectedTypes.push("portfolio");
            const response = await axiosInstance.put(`/templates/portal/${editingTemplateId}`, {
                displayName: editDisplayName,
                category: editCategory,
                type: selectedTypes.length > 0 ? selectedTypes.join(",") : "website"
            });
            if (response.data.success) {
                toast.success("Template metadata updated successfully!");
                setOpenEditDialog(false);
                fetchTemplates();
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || "Failed to update template";
            toast.error(errMsg);
        } finally {
            setSavingEdit(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const filteredTemplates = templates.filter((t) => {
        if (currentTab === "All") return true;
        return t.category === currentTab;
    });

    return (
        <PageTransition>
            <Box sx={{ p: 4, minHeight: "100vh" }}>
                {/* Header Section */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary" id="templates-title">
                            Custom ZIP Templates
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            Deploy self-contained HTML/PHP templates to XAMPP Apache for isolated multi-tenant booking sites.
                        </Typography>
                    </Box>
                    <Button
                        id="btn-deploy-template"
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            borderRadius: "12px",
                            py: 1.5,
                            px: 3,
                            fontWeight: 700,
                            textTransform: "none",
                            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                            boxShadow: "0px 8px 24px rgba(16, 185, 129, 0.2)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #059669 0%, #047857 100%)"
                            }
                        }}
                    >
                        Deploy New ZIP
                    </Button>
                </Box>

                <Divider sx={{ mb: 4, borderColor: "rgba(255, 255, 255, 0.08)" }} />

                {/* Categories Dropdown Filter with Counts */}
                <Box display="flex" alignItems="center" gap={2} mb={4} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 300 }}>
                        <InputLabel id="category-filter-label" sx={{ fontWeight: 700 }}>Filter by Category</InputLabel>
                        <Select
                            labelId="category-filter-label"
                            id="category-filter-select"
                            value={currentTab}
                            label="Filter by Category"
                            onChange={(e) => setCurrentTab(e.target.value)}
                            sx={{
                                borderRadius: '12px',
                                fontWeight: 600,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255,255,255,0.12)'
                                }
                            }}
                        >
                            <MenuItem value="All">
                                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <span>📁</span>
                                        <Typography fontWeight={600}>All Categories</Typography>
                                    </Box>
                                    <Chip
                                        label={templates.length}
                                        size="small"
                                        sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 800, height: 20, fontSize: '0.7rem' }}
                                    />
                                </Box>
                            </MenuItem>
                            {INDUSTRY_OPTIONS.map((opt) => {
                                const count = templates.filter(t => t.category === opt.value).length;
                                if (count === 0) return null;
                                return (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <span>{opt.icon}</span>
                                                <Typography fontWeight={600}>{opt.label}</Typography>
                                            </Box>
                                            <Chip
                                                label={count}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#34D399', fontWeight: 800, height: 20, fontSize: '0.7rem', border: '1px solid rgba(16,185,129,0.2)' }}
                                            />
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Showing{' '}
                        <strong style={{ color: '#fff' }}>{filteredTemplates.length}</strong>
                        {' '}template{filteredTemplates.length !== 1 ? 's' : ''}
                        {currentTab !== 'All' ? ` in "${currentTab}"` : ' across all categories'}
                    </Typography>
                </Box>

                {/* Templates Grid catalog */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                        <CircularProgress color="primary" size={50} />
                    </Box>
                ) : filteredTemplates.length === 0 ? (
                    <Box
                        sx={{
                            background: "rgba(30, 41, 59, 0.2)",
                            border: "2px dashed rgba(255, 255, 255, 0.08)",
                            borderRadius: "24px",
                            p: 6,
                            textAlign: "center"
                        }}
                    >
                        <FolderIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">
                            No templates found
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 1, mb: 3 }}>
                            {currentTab === "All"
                                ? "Deploy your first responsive HTML or PHP ZIP template to get started."
                                : `No template deployed under the "${currentTab}" category.`}
                        </Typography>
                        <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: "8px" }}>
                            Upload Template
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {filteredTemplates.map((t) => (
                            <Grid item xs={12} sm={6} md={4} lg={4} key={t.id}>
                                <Card
                                    id={`template-card-${t.id}`}
                                    sx={{
                                        background: "rgba(15, 23, 42, 0.7)",
                                        backdropFilter: "blur(16px)",
                                        border: "1px solid rgba(255, 255, 255, 0.07)",
                                        borderRadius: "16px",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden",
                                        transition: "all 0.25s ease",
                                        "&:hover": {
                                            transform: "translateY(-4px)",
                                            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                                            border: "1px solid rgba(99, 102, 241, 0.3)",
                                        }
                                    }}
                                >
                                    {/* Color accent top bar */}
                                    <Box sx={{
                                        height: "4px",
                                        background: "linear-gradient(90deg, #6366F1 0%, #10B981 100%)",
                                    }} />

                                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                        {/* Header row: Avatar + Name + Slug */}
                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Avatar
                                                src={getTemplateIconUrl(t) || undefined}
                                                sx={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(99,102,241,0.15)",
                                                    border: "1px solid rgba(99,102,241,0.25)",
                                                    fontSize: "1.3rem",
                                                    fontWeight: 800,
                                                    color: "#818CF8",
                                                    flexShrink: 0,
                                                    '& img': { objectFit: 'contain', p: '6px' },
                                                }}
                                            >
                                                {t.displayName?.charAt(0)?.toUpperCase() || "T"}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={800}
                                                    color="text.primary"
                                                    sx={{ fontSize: "1rem", lineHeight: 1.3, mb: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                >
                                                    {t.displayName}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <FolderIcon sx={{ fontSize: "0.75rem", color: "text.disabled" }} />
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                                                        {t.templateId || t.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Tags row */}
                                        <Box display="flex" flexWrap="wrap" gap={0.75}>
                                            <Chip
                                                label={t.category}
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(16,185,129,0.1)",
                                                    color: "#34D399",
                                                    fontWeight: 700,
                                                    fontSize: "0.68rem",
                                                    border: "1px solid rgba(16,185,129,0.2)",
                                                    height: 22,
                                                    borderRadius: "6px",
                                                }}
                                            />
                                            {(t.type || "website").split(",").map((typeVal) => {
                                                const type = typeVal.trim();
                                                return (
                                                    <Chip
                                                        key={type}
                                                        label={type === "portfolio" ? "Portfolio" : "Website"}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: type === "portfolio" ? "rgba(99,102,241,0.12)" : "rgba(59,130,246,0.12)",
                                                            color: type === "portfolio" ? "#818CF8" : "#60A5FA",
                                                            fontWeight: 700,
                                                            fontSize: "0.68rem",
                                                            border: type === "portfolio" ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(59,130,246,0.2)",
                                                            height: 22,
                                                            borderRadius: "6px",
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    </CardContent>

                                    {/* Footer Actions */}
                                    <Box sx={{
                                        borderTop: "1px solid rgba(255,255,255,0.05)",
                                        display: "flex",
                                        overflow: "hidden",
                                        borderRadius: "0 0 16px 16px",
                                    }}>
                                        <Tooltip title="Edit Details" arrow>
                                            <Button
                                                id={`btn-edit-template-${t.id}`}
                                                startIcon={<EditIcon sx={{ fontSize: "0.85rem" }} />}
                                                onClick={() => handleOpenEditDialog(t)}
                                                sx={{
                                                    flex: 1,
                                                    bgcolor: "rgba(59,130,246,0.08)",
                                                    color: "#60A5FA",
                                                    borderRadius: 0,
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    textTransform: "none",
                                                    py: 1.2,
                                                    borderRight: "1px solid rgba(255,255,255,0.05)",
                                                    "&:hover": { bgcolor: "rgba(59,130,246,0.18)" }
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="Delete & Purge" arrow>
                                            <Button
                                                id={`btn-delete-template-${t.id}`}
                                                startIcon={<DeleteIcon sx={{ fontSize: "0.85rem" }} />}
                                                onClick={() => handleDelete(t.id)}
                                                sx={{
                                                    flex: 1,
                                                    bgcolor: "rgba(239,68,68,0.08)",
                                                    color: "#F87171",
                                                    borderRadius: 0,
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    textTransform: "none",
                                                    py: 1.2,
                                                    "&:hover": { bgcolor: "rgba(239,68,68,0.18)" }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Tooltip>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Deploy Template dialog modal */}
                <Dialog
                    open={openDialog}
                    onClose={() => !deploying && setOpenDialog(false)}
                    PaperProps={{
                        sx: {
                            background: "rgba(15, 23, 42, 0.95)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "24px",
                            color: "text.primary",
                            maxWidth: "500px",
                            width: "100%"
                        }
                    }}
                >
                    <DialogTitle component="div" sx={{ p: 3, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h5" fontWeight={800}>
                            Deploy ZIP Template
                        </Typography>
                        <IconButton
                            id="btn-close-deploy-dialog"
                            onClick={() => !deploying && setOpenDialog(false)}
                            disabled={deploying}
                            sx={{ color: "text.secondary" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Upload a ZIP template package to register it in the platform.
                        </Typography>

                        <TextField
                            id="input-template-name"
                            label="Template Name"
                            placeholder="e.g. Dr. Aisha Malik Premium Portfolio"
                            fullWidth
                            variant="outlined"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={deploying}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            id="select-template-category"
                            select
                            label="Target Business Category"
                            fullWidth
                            variant="outlined"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={deploying}
                            sx={{ mb: 3 }}
                        >
                            {INDUSTRY_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} id={`menu-opt-${opt.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                                    {opt.icon} {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <FormControl component="fieldset" disabled={deploying} sx={{ mb: 3, width: "100%", textAlign: "left" }}>
                            <FormLabel component="legend" sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 1.5, fontWeight: 700 }}>
                                Template Type (Site Mode)
                            </FormLabel>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Website Card */}
                                <Box
                                    onClick={() => !deploying && handleDeployWebsiteChange(true)}
                                    sx={{
                                        flex: 1,
                                        cursor: deploying ? 'not-allowed' : 'pointer',
                                        p: 2,
                                        borderRadius: '16px',
                                        border: '1.5px solid',
                                        borderColor: deployWebsite ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                                        backgroundColor: deployWebsite ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: deployWebsite ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
                                            backgroundColor: deployWebsite ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.04)'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        id="checkbox-deploy-website"
                                        checked={deployWebsite}
                                        onChange={(e) => handleDeployWebsiteChange(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        color="primary"
                                        sx={{ p: 0 }}
                                        disabled={deploying}
                                    />
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            🌐 Website
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                                            Standard site mode
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Portfolio Card */}
                                <Box
                                    onClick={() => !deploying && handleDeployPortfolioChange(true)}
                                    sx={{
                                        flex: 1,
                                        cursor: deploying ? 'not-allowed' : 'pointer',
                                        p: 2,
                                        borderRadius: '16px',
                                        border: '1.5px solid',
                                        borderColor: deployPortfolio ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                                        backgroundColor: deployPortfolio ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: deployPortfolio ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
                                            backgroundColor: deployPortfolio ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.04)'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        id="checkbox-deploy-portfolio"
                                        checked={deployPortfolio}
                                        onChange={(e) => handleDeployPortfolioChange(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        color="primary"
                                        sx={{ p: 0 }}
                                        disabled={deploying}
                                    />
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            💼 Portfolio
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                                            Solo provider mode
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </FormControl>

                        {/* File Upload drag area */}
                        <Button
                            id="btn-select-zip-file"
                            component="label"
                            variant="outlined"
                            disabled={deploying}
                            sx={{
                                width: "100%",
                                py: 4,
                                border: "2px dashed rgba(255, 255, 255, 0.12)",
                                borderRadius: "16px",
                                textTransform: "none",
                                color: zipFile ? "primary.main" : "text.secondary",
                                background: "rgba(255, 255, 255, 0.02)",
                                "&:hover": {
                                    background: "rgba(255, 255, 255, 0.04)",
                                    borderColor: "primary.main"
                                }
                            }}
                        >
                            <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                                <UploadIcon sx={{ fontSize: 40 }} />
                                <Box textAlign="center">
                                    <Typography variant="body1" fontWeight={700}>
                                        {fileName ? fileName : "Click to select ZIP Template archive"}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        Max File Size: 50MB (Supports index.php/html & databases)
                                    </Typography>
                                </Box>
                            </Box>
                            <input type="file" accept=".zip" hidden onChange={handleFileChange} />
                        </Button>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0, justifyContent: "flex-end", gap: 1.5 }}>
                        <Button id="btn-cancel-deploy" onClick={() => setOpenDialog(false)} disabled={deploying} sx={{ color: "text.secondary", fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            id="btn-submit-deploy"
                            variant="contained"
                            onClick={handleDeploy}
                            disabled={deploying}
                            sx={{
                                borderRadius: "10px",
                                px: 3,
                                py: 1.2,
                                fontWeight: 700,
                                textTransform: "none",
                                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)"
                                }
                            }}
                        >
                            {deploying ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Deploy & Extract"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Template dialog modal */}
                <Dialog
                    open={openEditDialog}
                    onClose={() => !savingEdit && setOpenEditDialog(false)}
                    PaperProps={{
                        sx: {
                            background: "rgba(15, 23, 42, 0.95)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "24px",
                            color: "text.primary",
                            maxWidth: "500px",
                            width: "100%"
                        }
                    }}
                >
                    <DialogTitle component="div" sx={{ p: 3, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h5" fontWeight={800}>
                            Edit Template Details
                        </Typography>
                        <IconButton
                            id="btn-close-edit-dialog"
                            onClick={() => !savingEdit && setOpenEditDialog(false)}
                            disabled={savingEdit}
                            sx={{ color: "text.secondary" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Update the metadata details of your template. Note that the underlying folder slug/template ID remains constant to prevent breaking active client setups.
                        </Typography>

                        <TextField
                            id="input-edit-template-name"
                            label="Template Name"
                            placeholder="e.g. Dr. Aisha Malik Premium Portfolio"
                            fullWidth
                            variant="outlined"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            disabled={savingEdit}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            id="select-edit-template-category"
                            select
                            label="Target Business Category"
                            fullWidth
                            variant="outlined"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            disabled={savingEdit}
                            sx={{ mb: 3 }}
                        >
                            {INDUSTRY_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} id={`menu-edit-opt-${opt.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                                    {opt.icon} {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <FormControl component="fieldset" disabled={savingEdit} sx={{ mb: 3, width: "100%", textAlign: "left" }}>
                            <FormLabel component="legend" sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 1.5, fontWeight: 700 }}>
                                Template Type (Site Mode)
                            </FormLabel>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Website Card */}
                                <Box
                                    onClick={() => !savingEdit && handleEditWebsiteChange(true)}
                                    sx={{
                                        flex: 1,
                                        cursor: savingEdit ? 'not-allowed' : 'pointer',
                                        p: 2,
                                        borderRadius: '16px',
                                        border: '1.5px solid',
                                        borderColor: editWebsite ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                                        backgroundColor: editWebsite ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: editWebsite ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
                                            backgroundColor: editWebsite ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.04)'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        id="checkbox-edit-website"
                                        checked={editWebsite}
                                        onChange={(e) => handleEditWebsiteChange(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        color="primary"
                                        sx={{ p: 0 }}
                                        disabled={savingEdit}
                                    />
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            🌐 Website
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                                            Standard site mode
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Portfolio Card */}
                                <Box
                                    onClick={() => !savingEdit && handleEditPortfolioChange(true)}
                                    sx={{
                                        flex: 1,
                                        cursor: savingEdit ? 'not-allowed' : 'pointer',
                                        p: 2,
                                        borderRadius: '16px',
                                        border: '1.5px solid',
                                        borderColor: editPortfolio ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                                        backgroundColor: editPortfolio ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: editPortfolio ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
                                            backgroundColor: editPortfolio ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.04)'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        id="checkbox-edit-portfolio"
                                        checked={editPortfolio}
                                        onChange={(e) => handleEditPortfolioChange(e.target.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                        color="primary"
                                        sx={{ p: 0 }}
                                        disabled={savingEdit}
                                    />
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            💼 Portfolio
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                                            Solo provider mode
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0, justifyContent: "flex-end", gap: 1.5 }}>
                        <Button id="btn-cancel-edit" onClick={() => setOpenEditDialog(false)} disabled={savingEdit} sx={{ color: "text.secondary", fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <Button
                            id="btn-submit-edit"
                            variant="contained"
                            onClick={handleEditSubmit}
                            disabled={savingEdit}
                            sx={{
                                borderRadius: "10px",
                                px: 3,
                                py: 1.2,
                                fontWeight: 700,
                                textTransform: "none",
                                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)"
                                }
                            }}
                        >
                            {savingEdit ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Save Changes"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </PageTransition>
    );
};

export default PortalTemplates;
