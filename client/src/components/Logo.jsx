import React from 'react';
import { Box } from '@mui/material';
import logoImg from '../assets/logo.png';

const Logo = ({ size = 150, showText = true, sx = {} }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ...sx }}>
            <Box
                component="img"
                src="/logo.png"
                alt="MyBookings Logo"
                sx={{
                    width: size,
                    height: size,
                    borderRadius: size / 8,
                    boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
                    objectFit: 'contain'
                }}
            />
            {showText && (
                <Box
                    component="span"
                    sx={{
                        fontSize: size * 0.5,
                        fontWeight: 900,
                        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}
                >
                    MyBookings
                </Box>
            )}
        </Box>
    );
};

export default Logo;
