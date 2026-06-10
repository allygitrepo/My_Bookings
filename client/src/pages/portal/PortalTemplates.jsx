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
    Close as CloseIcon,
    OpenInNew as OpenInNewIcon
} from "@mui/icons-material";
import axiosInstance from "../../api/axiosInstance";
import PageTransition from "../../components/PageTransition";
import toast from "react-hot-toast";
import { getTemplateIconUrl, getApiOrigin } from "../../utils/templateIcon";

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

// Type badge config
const TYPE_CONFIG = {
    portfolio: { label: "Portfolio", color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
    website: { label: "Website", color: "#34D399", bg: "rgba(52,211,153,0.12)" }
};

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

    // Delete Modal State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
            const response = await axiosInstance.post("/templates/portal/deploy", formData, {
                headers: { "Content-Type": "multipart/form-data" }
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
            const errMsg = error.response?.data?.message || "Failed to deploy template";
            toast.error(errMsg);
        } finally {
            setDeploying(false);
        }
    };

    const handleDeployWebsiteChange = (checked) => {
        if (checked) { setDeployWebsite(true); setDeployPortfolio(false); }
        else { setDeployWebsite(false); setDeployPortfolio(true); }
    };

    const handleDeployPortfolioChange = (checked) => {
        if (checked) { setDeployPortfolio(true); setDeployWebsite(false); }
        else { setDeployPortfolio(false); setDeployWebsite(true); }
    };

    const handleEditWebsiteChange = (checked) => {
        if (checked) { setEditWebsite(true); setEditPortfolio(false); }
        else { setEditWebsite(false); setEditPortfolio(true); }
    };

    const handleEditPortfolioChange = (checked) => {
        if (checked) { setEditPortfolio(true); setEditWebsite(false); }
        else { setEditPortfolio(false); setEditWebsite(true); }
    };

    const handleDeleteClick = (template) => {
        setTemplateToDelete(template);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;
        setDeleting(true);
        try {
            const response = await axiosInstance.delete(`/templates/portal/${templateToDelete.id}`);
            if (response.data.success) {
                toast.success("Template purged completely.");
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
                fetchTemplates();
            }
        } catch (error) {
            toast.error("Failed to delete template");
        } finally {
            setDeleting(false);
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

    const filteredTemplates = templates.filter((t) => {
        if (currentTab === "All") return true;
        return t.category === currentTab;
    });

    // ─── Shared dialog paper styles ───────────────────────────────────────────
    const dialogPaperSx = {
        background: "rgba(10, 16, 32, 0.97)",
        backdropFilter: "blur(32px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        color: "text.primary",
        maxWidth: "500px",
        width: "100%"
    };

    // ─── Type selector card (reusable) ────────────────────────────────────────
    const TypeCard = ({ id, checked, onChange, onClick, disabled, emoji, label, sublabel }) => (
        <Box
            onClick={onClick}
            sx={{
                flex: 1,
                cursor: disabled ? "not-allowed" : "pointer",
                p: 1.75,
                borderRadius: "12px",
                border: "1.5px solid",
                borderColor: checked ? "primary.main" : "rgba(255,255,255,0.07)",
                backgroundColor: checked ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.015)",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                transition: "all 0.18s ease",
                "&:hover": {
                    borderColor: checked ? "primary.main" : "rgba(255,255,255,0.14)",
                    backgroundColor: checked ? "rgba(59,130,246,0.09)" : "rgba(255,255,255,0.03)"
                }
            }}
        >
            <Checkbox
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                color="primary"
                size="small"
                sx={{ p: 0 }}
                disabled={disabled}
            />
            <Box>
                <Typography variant="body2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.82rem" }}>
                    {emoji} {label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", mt: 0.15 }}>
                    {sublabel}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <PageTransition>
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <Box
                    display="flex"
                    flexDirection={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    gap={2}
                    mb={3}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary" letterSpacing="-0.5px">
                            Template Catalog
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.4}>
                            Self-contained HTML/PHP ZIP templates deployed to XAMPP Apache.
                        </Typography>
                    </Box>
                    <Button
                        id="btn-deploy-template"
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            px: 2.5,
                            py: 1,
                            whiteSpace: "nowrap",
                            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                            "&:hover": { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }
                        }}
                    >
                        Deploy ZIP
                    </Button>
                </Box>

                <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.07)" }} />

                {/* ── Filter bar ─────────────────────────────────────────── */}
                <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 260 }}>
                        <InputLabel id="category-filter-label" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                            Filter by Category
                        </InputLabel>
                        <Select
                            labelId="category-filter-label"
                            id="category-filter-select"
                            value={currentTab}
                            label="Filter by Category"
                            onChange={(e) => setCurrentTab(e.target.value)}
                            sx={{
                                borderRadius: "10px",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }
                            }}
                        >
                            <MenuItem value="All">
                                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <span>📁</span>
                                        <Typography fontWeight={600} fontSize="0.85rem">All Categories</Typography>
                                    </Box>
                                    <Chip
                                        label={templates.length}
                                        size="small"
                                        sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 800, height: 18, fontSize: "0.68rem" }}
                                    />
                                </Box>
                            </MenuItem>
                            {INDUSTRY_OPTIONS.map((opt) => {
                                const count = templates.filter((t) => t.category === opt.value).length;
                                if (count === 0) return null;
                                return (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <span>{opt.icon}</span>
                                                <Typography fontWeight={600} fontSize="0.85rem">{opt.label}</Typography>
                                            </Box>
                                            <Chip
                                                label={count}
                                                size="small"
                                                sx={{ bgcolor: "rgba(16,185,129,0.15)", color: "#34D399", fontWeight: 800, height: 18, fontSize: "0.68rem", border: "1px solid rgba(16,185,129,0.2)" }}
                                            />
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" fontWeight={500} fontSize="0.82rem">
                        Showing{" "}
                        <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                            {filteredTemplates.length}
                        </Box>{" "}
                        template{filteredTemplates.length !== 1 ? "s" : ""}
                        {currentTab !== "All" ? ` in "${currentTab}"` : ""}
                    </Typography>
                </Box>

                {/* ── Grid ───────────────────────────────────────────────── */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                        <CircularProgress color="primary" size={44} />
                    </Box>
                ) : filteredTemplates.length === 0 ? (
                    <Box
                        sx={{
                            background: "rgba(30,41,59,0.18)",
                            border: "2px dashed rgba(255,255,255,0.07)",
                            borderRadius: "20px",
                            p: 6,
                            textAlign: "center"
                        }}
                    >
                        <FolderIcon sx={{ fontSize: 72, color: "text.disabled", mb: 2 }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">
                            No templates found
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 1, mb: 3 }}>
                            {currentTab === "All"
                                ? "Deploy your first responsive HTML or PHP ZIP template to get started."
                                : `No templates under "${currentTab}" yet.`}
                        </Typography>
                        <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>
                            Upload Template
                        </Button>
                    </Box>
                ) : (
                    /* Responsive grid: 2 → 3 → 4 → 5 columns */
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2.5,
                            gridTemplateColumns: {
                                xs: "repeat(2, 1fr)",
                                sm: "repeat(3, 1fr)",
                                md: "repeat(4, 1fr)",
                                lg: "repeat(5, 1fr)",
                                xl: "repeat(6, 1fr)"
                            }
                        }}
                    >
                        {filteredTemplates.map((t) => {
                            const types = (t.type || "website").split(",").map((s) => s.trim());
                            const primaryType = types[0];
                            const typeConf = TYPE_CONFIG[primaryType] || TYPE_CONFIG.website;

                            return (
                                <Box
                                    key={t.id}
                                    id={`template-card-${t.id}`}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        borderRadius: "14px",
                                        overflow: "hidden",
                                        background: "rgba(13, 20, 38, 0.75)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        backdropFilter: "blur(12px)",
                                        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
                                        "&:hover": {
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
                                            borderColor: "rgba(99,102,241,0.35)"
                                        }
                                    }}
                                >
                                    {/* ── Thumbnail ────────────────────────── */}
                                    <Box
                                        sx={{
                                            position: "relative",
                                            height: "160px",
                                            background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.08) 100%)",
                                            overflow: "hidden",
                                            flexShrink: 0
                                        }}
                                    >
                                        {/* Category pill */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                bgcolor: "#10B981",
                                                color: "#fff",
                                                px: 1.25,
                                                py: 0.4,
                                                borderBottomRightRadius: "10px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.4,
                                                fontWeight: 800,
                                                fontSize: "0.68rem",
                                                zIndex: 2,
                                                letterSpacing: "0.02em"
                                            }}
                                        >
                                            <TemplatesIcon sx={{ fontSize: "0.85rem" }} />
                                            {t.category.split("/")[0].trim()}
                                        </Box>

                                        {/* iframe preview */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                zIndex: 1,
                                                pointerEvents: "none",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <iframe
                                                src={`https://mybookings.allysoftsolutions.com/Templates/${t.templateId || t.id}/`}
                                                title={`Preview of ${t.displayName}`}
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    display: "block",
                                                    width: "400%",
                                                    height: "400%",
                                                    maxWidth: "none",
                                                    maxHeight: "none",
                                                    transform: "scale(0.25)",
                                                    transformOrigin: "top left",
                                                    border: "none",
                                                    background: "#fff",
                                                    margin: 0,
                                                    padding: 0
                                                }}
                                                onLoad={(e) => {
                                                    try {
                                                        const doc = e.target.contentDocument || e.target.contentWindow.document;
                                                        if (doc) {
                                                            const style = doc.createElement("style");
                                                            style.innerHTML = `[data-aos]{opacity:1!important;transform:none!important;}.wow{visibility:visible!important;animation:none!important;}#preloader,.preloader,.loader,.spinner{display:none!important;}`;
                                                            doc.head.appendChild(style);
                                                        }
                                                    } catch (_) { }
                                                }}
                                                scrolling="no"
                                            />
                                        </Box>
                                    </Box>

                                    {/* ── Body ─────────────────────────────── */}
                                    <Box sx={{ p: 1.75, pb: 1.25, flexGrow: 1, minWidth: 0 }}>
                                        {/* Type badge */}
                                        <Box display="flex" gap={0.75} mb={1} flexWrap="wrap">
                                            {types.map((type) => {
                                                const conf = TYPE_CONFIG[type] || TYPE_CONFIG.website;
                                                return (
                                                    <Box
                                                        key={type}
                                                        sx={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            px: 0.9,
                                                            py: 0.25,
                                                            borderRadius: "6px",
                                                            bgcolor: conf.bg,
                                                            border: `1px solid ${conf.color}28`
                                                        }}
                                                    >
                                                        <Typography sx={{ color: conf.color, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                                            {conf.label}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>

                                        {/* Name */}
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            color="text.primary"
                                            sx={{
                                                fontSize: "0.85rem",
                                                lineHeight: 1.35,
                                                overflow: "hidden",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                wordBreak: "break-word",
                                                mb: 0.4
                                            }}
                                        >
                                            {t.displayName}
                                        </Typography>

                                        {/* ID */}
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                            sx={{ fontSize: "0.68rem", fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                            title={t.templateId || t.id || "N/A"}
                                        >
                                            {t.templateId || t.id || "N/A"}
                                        </Typography>
                                    </Box>

                                    {/* ── Footer actions ────────────────────── */}
                                    <Box
                                        sx={{
                                            px: 1.5,
                                            pb: 1.5,
                                            pt: 1,
                                            display: "flex",
                                            gap: 0.75,
                                            alignItems: "center",
                                            borderTop: "1px solid rgba(255,255,255,0.05)"
                                        }}
                                    >
                                        {/* Preview */}
                                        <Tooltip title="Live Preview" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => window.open(`https://mybookings.allysoftsolutions.com/Templates/${t.templateId || t.id}/`, "_blank")}
                                                sx={{
                                                    borderRadius: "6px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    color: "text.secondary",
                                                    width: 28,
                                                    height: 28,
                                                    "&:hover": { color: "#60A5FA", borderColor: "#60A5FA", bgcolor: "rgba(96,165,250,0.08)" }
                                                }}
                                            >
                                                <OpenInNewIcon sx={{ fontSize: "0.9rem" }} />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Delete */}
                                        <Tooltip title="Delete" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(t)}
                                                sx={{
                                                    borderRadius: "6px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    color: "text.secondary",
                                                    width: 28,
                                                    height: 28,
                                                    "&:hover": { color: "#F87171", borderColor: "#F87171", bgcolor: "rgba(248,113,113,0.08)" }
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: "0.9rem" }} />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Edit */}
                                        <Tooltip title="Edit" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEditDialog(t)}
                                                sx={{
                                                    borderRadius: "6px",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    color: "text.secondary",
                                                    width: 28,
                                                    height: 28,
                                                    "&:hover": { color: "#3B82F6", borderColor: "#3B82F6", bgcolor: "rgba(59,130,246,0.08)" }
                                                }}
                                            >
                                                <EditIcon sx={{ fontSize: "0.9rem" }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* ── Deploy Dialog ──────────────────────────────────────── */}
                <Dialog
                    open={openDialog}
                    onClose={() => !deploying && setOpenDialog(false)}
                    PaperProps={{ sx: dialogPaperSx }}
                >
                    <DialogTitle component="div" sx={{ p: 3, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6" fontWeight={800}>Deploy ZIP Template</Typography>
                        <IconButton id="btn-close-deploy-dialog" onClick={() => !deploying && setOpenDialog(false)} disabled={deploying} sx={{ color: "text.secondary" }}>
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
                            sx={{ mb: 2.5 }}
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
                            sx={{ mb: 2.5 }}
                        >
                            {INDUSTRY_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} id={`menu-opt-${opt.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                                    {opt.icon} {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <FormControl component="fieldset" disabled={deploying} sx={{ mb: 2.5, width: "100%" }}>
                            <FormLabel component="legend" sx={{ color: "text.secondary", fontSize: "0.8rem", mb: 1.25, fontWeight: 700 }}>
                                Template Type (Site Mode)
                            </FormLabel>
                            <Box sx={{ display: "flex", gap: 1.5 }}>
                                <TypeCard
                                    id="checkbox-deploy-website"
                                    checked={deployWebsite}
                                    onChange={handleDeployWebsiteChange}
                                    onClick={() => !deploying && handleDeployWebsiteChange(true)}
                                    disabled={deploying}
                                    emoji="🌐"
                                    label="Website"
                                    sublabel="Standard site mode"
                                />
                                <TypeCard
                                    id="checkbox-deploy-portfolio"
                                    checked={deployPortfolio}
                                    onChange={handleDeployPortfolioChange}
                                    onClick={() => !deploying && handleDeployPortfolioChange(true)}
                                    disabled={deploying}
                                    emoji="💼"
                                    label="Portfolio"
                                    sublabel="Solo provider mode"
                                />
                            </Box>
                        </FormControl>

                        {/* ZIP upload zone */}
                        <Button
                            id="btn-select-zip-file"
                            component="label"
                            variant="outlined"
                            disabled={deploying}
                            sx={{
                                width: "100%",
                                py: 3.5,
                                border: "2px dashed",
                                borderColor: zipFile ? "primary.main" : "rgba(255,255,255,0.1)",
                                borderRadius: "14px",
                                textTransform: "none",
                                color: zipFile ? "primary.main" : "text.secondary",
                                background: "rgba(255,255,255,0.015)",
                                "&:hover": { background: "rgba(255,255,255,0.035)", borderColor: "primary.main" }
                            }}
                        >
                            <Box display="flex" flexDirection="column" alignItems="center" gap={1.25}>
                                <UploadIcon sx={{ fontSize: 36 }} />
                                <Box textAlign="center">
                                    <Typography variant="body2" fontWeight={700}>
                                        {fileName || "Click to select ZIP archive"}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        Max 50 MB · index.php / index.html supported
                                    </Typography>
                                </Box>
                            </Box>
                            <input type="file" accept=".zip" hidden onChange={handleFileChange} />
                        </Button>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
                        <Button id="btn-cancel-deploy" onClick={() => setOpenDialog(false)} disabled={deploying} sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            id="btn-submit-deploy"
                            variant="contained"
                            onClick={handleDeploy}
                            disabled={deploying}
                            sx={{
                                borderRadius: "10px", px: 3, py: 1.1, fontWeight: 700, textTransform: "none",
                                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                "&:hover": { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }
                            }}
                        >
                            {deploying ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Deploy & Extract"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ── Edit Dialog ────────────────────────────────────────── */}
                <Dialog
                    open={openEditDialog}
                    onClose={() => !savingEdit && setOpenEditDialog(false)}
                    PaperProps={{ sx: dialogPaperSx }}
                >
                    <DialogTitle component="div" sx={{ p: 3, pb: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6" fontWeight={800}>Edit Template Details</Typography>
                        <IconButton id="btn-close-edit-dialog" onClick={() => !savingEdit && setOpenEditDialog(false)} disabled={savingEdit} sx={{ color: "text.secondary" }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Update metadata only — the underlying folder slug stays constant to avoid breaking active client setups.
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
                            sx={{ mb: 2.5 }}
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
                            sx={{ mb: 2.5 }}
                        >
                            {INDUSTRY_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} id={`menu-edit-opt-${opt.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                                    {opt.icon} {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <FormControl component="fieldset" disabled={savingEdit} sx={{ mb: 1, width: "100%" }}>
                            <FormLabel component="legend" sx={{ color: "text.secondary", fontSize: "0.8rem", mb: 1.25, fontWeight: 700 }}>
                                Template Type (Site Mode)
                            </FormLabel>
                            <Box sx={{ display: "flex", gap: 1.5 }}>
                                <TypeCard
                                    id="checkbox-edit-website"
                                    checked={editWebsite}
                                    onChange={handleEditWebsiteChange}
                                    onClick={() => !savingEdit && handleEditWebsiteChange(true)}
                                    disabled={savingEdit}
                                    emoji="🌐"
                                    label="Website"
                                    sublabel="Standard site mode"
                                />
                                <TypeCard
                                    id="checkbox-edit-portfolio"
                                    checked={editPortfolio}
                                    onChange={handleEditPortfolioChange}
                                    onClick={() => !savingEdit && handleEditPortfolioChange(true)}
                                    disabled={savingEdit}
                                    emoji="💼"
                                    label="Portfolio"
                                    sublabel="Solo provider mode"
                                />
                            </Box>
                        </FormControl>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
                        <Button id="btn-cancel-edit" onClick={() => setOpenEditDialog(false)} disabled={savingEdit} sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            id="btn-submit-edit"
                            variant="contained"
                            onClick={handleEditSubmit}
                            disabled={savingEdit}
                            sx={{ borderRadius: "10px", px: 3, py: 1.1, fontWeight: 700, textTransform: "none" }}
                        >
                            {savingEdit ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Save Changes"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ── Delete Confirmation ────────────────────────────────── */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => !deleting && setDeleteDialogOpen(false)}
                    PaperProps={{ sx: { ...dialogPaperSx, maxWidth: "380px" } }}
                >
                    <DialogTitle sx={{ p: 3, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                        <DeleteIcon color="error" fontSize="small" />
                        <Typography variant="h6" fontWeight={800}>Delete Template</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, pt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Permanently delete <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>{templateToDelete?.displayName}</Box>?
                        </Typography>
                        <Typography variant="caption" color="error.light" sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                            This cannot be undone — all associated files will be removed.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
                        <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDelete}
                            disabled={deleting}
                            sx={{ borderRadius: "10px", px: 2.5, py: 1, fontWeight: 700, textTransform: "none" }}
                        >
                            {deleting ? <CircularProgress size={18} color="inherit" /> : "Delete"}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </PageTransition>
    );
};

export default PortalTemplates;