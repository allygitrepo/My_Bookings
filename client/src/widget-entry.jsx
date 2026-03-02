import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import BookingWidget from './widgets/BookingWidget';

const initWidget = () => {
    // SEED MOCK DATA
    // Because this SaaS saves data to the local storage of the Dashboard's origin (e.g. localhost:5173),
    // embedding the widget on a DIFFERENT origin (like 127.0.0.1:5500) will result in an empty database!
    // To make the demo work seamlessly anywhere, we seed the widget's isolated localstorage with dummy data.
    if (!window.localStorage.getItem('services')) {
        const dummyBusinessId = 'b1';
        window.localStorage.setItem('businesses', JSON.stringify([{ id: dummyBusinessId, name: 'SaaS Demo Clinic' }]));
        window.localStorage.setItem('services', JSON.stringify([
            { id: 's1', businessId: dummyBusinessId, name: 'General Consultation', duration: '30', price: 50 },
            { id: 's2', businessId: dummyBusinessId, name: 'Full Checkup', duration: '60', price: 100 }
        ]));
        window.localStorage.setItem('staff', JSON.stringify([
            { id: 'st1', businessId: dummyBusinessId, name: 'Dr. Sarah', role: 'Senior Doctor' }
        ]));
        window.localStorage.setItem('staffServices', JSON.stringify([
            { id: 'ss1', staffId: 'st1', serviceId: 's1' },
            { id: 'ss2', staffId: 'st1', serviceId: 's2' }
        ]));
    }

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

    // Render the widget with Material UI Theme Provider
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BookingWidget businessId={businessId} />
            </ThemeProvider>
        </React.StrictMode>
    );
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
} else {
    initWidget();
}
