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
    Card,
    CardContent,
    CardActions,
    Tabs,
    Tab
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
    const [templateType, setTemplateType] = useState("website");
    const [zipFile, setZipFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [deploying, setDeploying] = useState(false);

    // Edit Form State
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editCategory, setEditCategory] = useState("Healthcare / Hospital");
    const [editTemplateType, setEditTemplateType] = useState("website");
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
        formData.append("type", templateType);
        formData.append("zipFile", zipFile);

        try {
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
                setTemplateType("website");
                setZipFile(null);
                setFileName("");
                fetchTemplates();
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || "Failed to deploy template";
            toast.error(errMsg);
        } finally {
            setDeploying(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete and purge this template? This cannot be undone.")) {
            return;
        }

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
        setEditTemplateType(template.type || "website");
        setOpenEditDialog(true);
    };

    const handleEditSubmit = async () => {
        if (!editDisplayName.trim()) {
            toast.error("Please provide a template name");
            return;
        }

        setSavingEdit(true);
        try {
            const response = await axiosInstance.put(`/templates/portal/${editingTemplateId}`, {
                displayName: editDisplayName,
                category: editCategory,
                type: editTemplateType
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
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                            <TemplatesIcon fontSize="large" />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight={800} color="text.primary" id="templates-title">
                                Custom ZIP Templates
                            </Typography>
                            <Typography variant="subtitle2" color="text.secondary">
                                Deploy self-contained HTML/PHP templates to XAMPP Apache for isolated multi-tenant booking sites.
                            </Typography>
                        </Box>
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

                {/* Categories Tabs Filter */}
                <Paper
                    sx={{
                        background: "rgba(30, 41, 59, 0.4)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: "16px",
                        mb: 4,
                        p: 1
                    }}
                >
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            "& .MuiTabs-indicator": {
                                backgroundColor: "primary.main",
                                height: "3px",
                                borderRadius: "4px"
                            },
                            "& .MuiTab-root": {
                                color: "text.secondary",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                minWidth: 100,
                                textTransform: "none",
                                "&.Mui-selected": {
                                    color: "primary.main"
                                }
                            }
                        }}
                    >
                        <Tab label="📁 All Categories" value="All" id="tab-all" />
                        {INDUSTRY_OPTIONS.map((opt) => (
                            <Tab
                                key={opt.value}
                                label={`${opt.icon} ${opt.label}`}
                                value={opt.value}
                                id={`tab-${opt.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                            />
                        ))}
                    </Tabs>
                </Paper>

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
                            <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
                                <Card
                                    id={`template-card-${t.id}`}
                                    sx={{
                                        background: "rgba(30, 41, 59, 0.45)",
                                        backdropFilter: "blur(12px)",
                                        border: "1px solid rgba(255, 255, 255, 0.06)",
                                        borderRadius: "20px",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                        "&:hover": {
                                            transform: "translateY(-6px)",
                                            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)",
                                            border: "1px solid rgba(16, 185, 129, 0.25)"
                                        }
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1.5 }}>
                                        {/* Top Meta info */}
                                        <Box display="flex" flexWrap="wrap" gap={0.75} alignItems="center" mb={2}>
                                            <Chip
                                                icon={<CategoryIcon sx={{ fontSize: "0.8rem" }} />}
                                                label={t.category}
                                                size="small"
                                                sx={{
                                                    background: "rgba(16, 185, 129, 0.1)",
                                                    color: "#34D399",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    border: "1px solid rgba(16, 185, 129, 0.15)",
                                                    height: 20
                                                }}
                                            />
                                            <Chip
                                                label={t.type === "portfolio" ? "Portfolio" : "Website"}
                                                size="small"
                                                sx={{
                                                    background: t.type === "portfolio" ? "rgba(99, 102, 241, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                                    color: t.type === "portfolio" ? "#818CF8" : "#60A5FA",
                                                    fontWeight: 600,
                                                    fontSize: "0.7rem",
                                                    border: t.type === "portfolio" ? "1px solid rgba(99, 102, 241, 0.15)" : "1px solid rgba(59, 130, 246, 0.15)",
                                                    height: 20
                                                }}
                                            />
                                        </Box>

                                        {/* Icon & Title */}
                                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                            <Avatar
                                                src={t.icon ? `${import.meta.env.VITE_APACHE_BASE_URL || 'http://localhost:8080'}${t.icon}` : undefined}
                                                alt={t.displayName}
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: "12px",
                                                    bgcolor: "rgba(255, 255, 255, 0.05)",
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                    boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)"
                                                }}
                                            >
                                                {!t.icon && <BusinessIcon sx={{ fontSize: 24, color: "#10B981" }} />}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                                <Typography variant="body1" fontWeight={800} color="text.primary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {t.displayName}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
                                                    Slug: <code>{t.templateId || t.id}</code>
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>

                                    <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)", mt: "auto" }} />

                                    <CardActions sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Tooltip title={`Pool Path: ${t.path}`} arrow>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontFamily: "monospace",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    maxWidth: "110px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                    fontSize: "0.7rem",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <FolderIcon sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }} /> {t.templateId || t.id}
                                            </Typography>
                                        </Tooltip>

                                        <Box display="flex" gap={1}>
                                            <Tooltip title="Edit Details" arrow>
                                                <IconButton
                                                    id={`btn-edit-template-${t.id}`}
                                                    onClick={() => handleOpenEditDialog(t)}
                                                    size="small"
                                                    sx={{
                                                        background: "rgba(59, 130, 246, 0.1)",
                                                        color: "#60A5FA",
                                                        p: 0.75,
                                                        "&:hover": {
                                                            background: "rgba(59, 130, 246, 0.2)"
                                                        }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete & Purge Folder" arrow>
                                                <IconButton
                                                    id={`btn-delete-template-${t.id}`}
                                                    color="error"
                                                    onClick={() => handleDelete(t.id)}
                                                    size="small"
                                                    sx={{
                                                        background: "rgba(239, 68, 68, 0.1)",
                                                        color: "#EF4444",
                                                        p: 0.75,
                                                        "&:hover": {
                                                            background: "rgba(239, 68, 68, 0.2)"
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </CardActions>
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
                            Select a rich template package (ZIP file containing standard site directories, index files, or custom databases) to register it in the platform.
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

                        <TextField
                            id="select-template-type"
                            select
                            label="Template Type (Site Mode)"
                            fullWidth
                            variant="outlined"
                            value={templateType}
                            onChange={(e) => setTemplateType(e.target.value)}
                            disabled={deploying}
                            sx={{ mb: 3 }}
                        >
                            <MenuItem value="website" id="menu-opt-type-website">
                                🌐 Website
                            </MenuItem>
                            <MenuItem value="portfolio" id="menu-opt-type-portfolio">
                                💼 Portfolio
                            </MenuItem>
                        </TextField>

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

                        <TextField
                            id="select-edit-template-type"
                            select
                            label="Template Type (Site Mode)"
                            fullWidth
                            variant="outlined"
                            value={editTemplateType}
                            onChange={(e) => setEditTemplateType(e.target.value)}
                            disabled={savingEdit}
                            sx={{ mb: 3 }}
                        >
                            <MenuItem value="website" id="menu-edit-opt-type-website">
                                🌐 Website
                            </MenuItem>
                            <MenuItem value="portfolio" id="menu-edit-opt-type-portfolio">
                                💼 Portfolio
                            </MenuItem>
                        </TextField>
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
