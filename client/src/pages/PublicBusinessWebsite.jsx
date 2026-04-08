import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';
import { getBusinessBySlug, getBusinessByIdPublic } from '../api/business.api';
import TemplateMinimal from '../templates/TemplateMinimal';
import TemplatePremium from '../templates/TemplatePremium';
import TemplateModern from '../templates/TemplateModern';
import BookingWidget from '../widgets/BookingWidget';
import PageTransition from '../components/PageTransition';
import { decodeBusinessId } from '../utils/obfuscation';

const PublicBusinessWebsite = () => {
    // ... existing state ...
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [businessData, setBusinessData] = useState(null);
    const [error, setError] = useState(null);

    // Get biz ID from query string if it exists
    const searchParams = new URLSearchParams(location.search);
    let bizId = searchParams.get('biz');
    if (bizId) {
        // Decode business ID using secure utility
        bizId = decodeBusinessId(bizId);
    }

    useEffect(() => {
        // ... fetching logic ...
        const fetchWebsiteData = async () => {
            setLoading(true);
            try {
                let response;
                if (bizId) {
                    response = await getBusinessByIdPublic(bizId);
                } else if (slug) {
                    response = await getBusinessBySlug(slug);
                }

                if (response?.success) {
                    // Check if website is enabled
                    if (!response.data.business?.website_enabled) {
                        setError('This website is currently in draft mode and is not public.');
                        setLoading(false);
                        return;
                    }
                    setBusinessData(response.data);
                } else {
                    setError(response?.message || 'Website not found');
                }
            } catch (err) {
                console.error('Error fetching website data:', err);
                setError('Failed to load website. The link is incorrect.');
            } finally {
                setLoading(false);
            }
        };

        if (bizId || slug) {
            fetchWebsiteData();
        } else {
            setLoading(false);
            setError('No business identifier provided.');
        }
    }, [slug, bizId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
                <CircularProgress size={40} thickness={4} />
                <Typography variant="body2" color="text.secondary">Loading your experience...</Typography>
            </Box>
        );
    }

    if (error || !businessData) {
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h4" fontWeight={900} gutterBottom>
                    Oops! Page Not Found.
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    {error || "The booking-enabled website you are looking for doesn't exist or has been disabled by the owner."}
                </Typography>
                {/* <Button 
                    variant="contained" 
                    onClick={() => navigate('/')}
                    sx={{ mt: 2, borderRadius: 2, px: 4 }}
                >
                    Back to MyBookings
                </Button> */}
            </Container>
        );
    }

    // Dynamic Template Picker
    const renderTemplate = () => {
        const template = businessData.business.selected_template || 'template1';

        switch (template) {
            case 'template1':
                return <TemplateMinimal data={businessData} />;
            case 'template2':
                return <TemplatePremium data={businessData} />;
            case 'template3':
                return <TemplateModern data={businessData} />;
            default:
                return <TemplateMinimal data={businessData} />;
        }
    };

    return (
        <PageTransition>
            {renderTemplate()}
            <BookingWidget businessId={businessData.business.api_key || businessData.business.id} />
        </PageTransition>
    );
};

export default PublicBusinessWebsite;
