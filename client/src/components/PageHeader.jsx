import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const PageHeader = ({ title, subtitle, onAddClick, buttonText = 'Add New' }) => {
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
            {onAddClick && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={onAddClick}>
                    {buttonText}
                </Button>
            )}
        </Box>
    );
};

export default PageHeader;
