import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import {
    DeleteOutline as DeleteIcon,
    WarningAmber as WarningIcon,
    Logout as LogoutIcon,
    HelpOutline as HelpIcon,
} from '@mui/icons-material';

const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    confirmColor = 'error', // 'error' | 'warning' | 'primary'
    iconType = 'delete', // 'delete' | 'warning' | 'logout' | 'help'
    loading = false,
}) => {
    const getIcon = () => {
        switch (iconType) {
            case 'logout':
                return <LogoutIcon sx={{ fontSize: 28, color: 'warning.main' }} />;
            case 'warning':
                return <WarningIcon sx={{ fontSize: 28, color: 'warning.main' }} />;
            case 'help':
                return <HelpIcon sx={{ fontSize: 28, color: 'primary.main' }} />;
            case 'delete':
            default:
                return <DeleteIcon sx={{ fontSize: 28, color: 'error.main' }} />;
        }
    };

    const getIconBg = () => {
        switch (iconType) {
            case 'logout':
            case 'warning':
                return 'rgba(245, 158, 11, 0.12)';
            case 'help':
                return 'rgba(99, 102, 241, 0.12)';
            case 'delete':
            default:
                return 'rgba(239, 68, 68, 0.12)';
        }
    };

    return (
        <Dialog
            open={Boolean(open)}
            onClose={loading ? undefined : onClose}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    p: 1,
                    maxWidth: 420,
                    width: '100%',
                    bgcolor: 'background.paper',
                    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
                    border: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: getIconBg(),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    }}
                >
                    {getIcon()}
                </Box>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, lineHeight: 1.6 }}>
                    {message}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, gap: 1.5, justifyContent: 'center' }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{
                        borderRadius: 2.5,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        flex: 1,
                        '&:hover': {
                            borderColor: 'text.secondary',
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    color={confirmColor}
                    sx={{
                        borderRadius: 2.5,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: 'none',
                        flex: 1,
                    }}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
