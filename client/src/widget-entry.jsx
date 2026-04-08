import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import theme from './theme';
import BookingWidget from './widgets/BookingWidget';

const GOOGLE_CLIENT_ID = "518219129243-ffkdl9t99oqrofkfm5l4o3nvnvmolvd4.apps.googleusercontent.com";

const initWidget = () => {
    // Find the script tag to extract business ID if needed (for future use)
    const scripts = document.getElementsByTagName('script');
    let businessId = null;
    for (let script of scripts) {
        if (script.getAttribute('data-business-id')) {
            businessId = script.getAttribute('data-business-id');
            break;
        }
    }

    // Create a container for the widget if it doesn't exist
    let rootElement = document.getElementById('booking-widget-root');
    if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'booking-widget-root';
        document.body.appendChild(rootElement);
    }

    // Render the widget with Material UI Theme Provider and Google OAuth Provider
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BookingWidget businessId={businessId} />
                </ThemeProvider>
            </GoogleOAuthProvider>
        </React.StrictMode>
    );
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
} else {
    initWidget();
}
