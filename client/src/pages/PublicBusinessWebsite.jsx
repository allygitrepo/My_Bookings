import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';
import { getBusinessBySlug, getBusinessByIdPublic } from '../api/business.api';
import TemplateMinimal from '../templates/TemplateMinimal';
import TemplatePremium from '../templates/TemplatePremium';
import TemplateModern from '../templates/TemplateModern';
import TemplatePortfolioStudio from '../templates/TemplatePortfolioStudio';
import TemplatePortfolioGrid from '../templates/TemplatePortfolioGrid';
import TemplatePortfolioCreative from '../templates/TemplatePortfolioCreative';
import BookingWidget from '../widgets/BookingWidget';
import PageTransition from '../components/PageTransition';
import { decodeBusinessId } from '../utils/obfuscation';

const PublicBusinessWebsite = ({ subPath }) => {
    // ... existing state ...
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [businessData, setBusinessData] = useState(null);
    const [error, setError] = useState(null);

    // Try to decode the ID from the URL parameter
    let bizId = decodeBusinessId(id);

    useEffect(() => {
        if (businessData?.business?.business_name) {
            document.title = businessData.business.business_name;
        }
    }, [businessData]);

    useEffect(() => {
        // ... fetching logic ...
        const fetchWebsiteData = async () => {
            setLoading(true);
            try {
                let response;
                if (bizId) {
                    response = await getBusinessByIdPublic(bizId);
                } else {
                    setError('Invalid business link.');
                    setLoading(false);
                    return;
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

        if (bizId) {
            fetchWebsiteData();
        } else {
            setLoading(false);
            setError('Valid business identifier not found in the link.');
        }
    }, [id, bizId]);

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

        const displayData = { ...businessData, hideScript: true };

        const standardTemplates = ['template1', 'template2', 'template3', 'portfolio1', 'portfolio2', 'portfolio3'];
        if (!standardTemplates.includes(template)) {
            const apacheBase = import.meta.env.VITE_APACHE_BASE_URL || 'http://localhost:8080';
            const templatePath = subPath
                ? `${apacheBase}/${template}_biz_${businessData.business.id}/${subPath}/`
                : `${apacheBase}/${template}_biz_${businessData.business.id}/`;
            return (
                <iframe
                    src={templatePath}
                    style={{
                        width: '100%',
                        height: '100vh',
                        border: 'none',
                        background: '#ffffff',
                        display: 'block'
                    }}
                    title={subPath ? 'Template Admin' : 'Business Website'}
                />
            );
        }

        switch (template) {
            case 'template1': return <TemplateMinimal data={displayData} />;
            case 'template2': return <TemplatePremium data={displayData} />;
            case 'template3': return <TemplateModern data={displayData} />;
            case 'portfolio1': return <TemplatePortfolioStudio data={displayData} />;
            case 'portfolio2': return <TemplatePortfolioGrid data={displayData} />;
            case 'portfolio3': return <TemplatePortfolioCreative data={displayData} />;
            default: return <TemplateMinimal data={displayData} />;
        }
    };

    const isCustomTemplate = !['template1', 'template2', 'template3', 'portfolio1', 'portfolio2', 'portfolio3'].includes(businessData?.business?.selected_template || 'template1');

    return (
        <PageTransition>
            {renderTemplate()}
            {!isCustomTemplate && (
                <BookingWidget businessId={businessData.business.api_key || businessData.business.id} />
            )}
        </PageTransition>
    );
};

export default PublicBusinessWebsite;
