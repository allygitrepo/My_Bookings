import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const PageHeader = ({ title, subtitle, onAddClick, buttonText = 'Add New', extraActions }) => {
    return (
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h4" fontWeight={700}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {extraActions}
                {onAddClick && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={onAddClick}>
                        {buttonText}
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default PageHeader;
