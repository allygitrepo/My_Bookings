import React from 'react';
import { Drawer, Box, Typography, IconButton, Button, Divider, CircularProgress } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const DRAWER_WIDTH = 768; // max-w-3xl equivalent

/**
 * Premium slide-in FormDrawer with Framer Motion entrance and sticky header/footer.
 * Used in place of Dialog popups for all entity CRUD forms.
 */
const FormDrawer = ({ open, onClose, title, subtitle, onSave, saveLabel = 'Save', children, isLoading = false, width = DRAWER_WIDTH }) => {
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: width },
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-8px 0 48px rgba(0,0,0,0.12)',
                },
            }}
        >
            {/* Sticky Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    px: 3.5,
                    pt: 3,
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 100%)',
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'text.secondary', mt: 0.25, bgcolor: 'action.hover', borderRadius: 1.5 }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Scrollable Form Body */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    px: 3.5,
                    py: 3,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
                }}
            >
                {children}
            </Box>

            {/* Sticky Footer */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    px: 3.5,
                    py: 2.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    flexShrink: 0,
                    bgcolor: 'background.paper',
                }}
            >
                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={isLoading}
                    fullWidth
                    size="large"
                    sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        py: 1.4,
                        boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                    }}
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {saveLabel}
                </Button>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    fullWidth
                    size="large"
                    sx={{ borderRadius: 2, py: 1.4 }}
                >
                    Cancel
                </Button>
            </Box>
        </Drawer>
    );
};

export default FormDrawer;
