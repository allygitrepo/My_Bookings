import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Toaster } from 'react-hot-toast';
import theme from './theme';
import MainLayout from './layout/MainLayout';
import AuthGuard from './components/AuthGuard';
import { SearchProvider } from './context/SearchContext';
import { BusinessProvider } from './context/BusinessContext';
import axiosInstance from './api/axiosInstance';

import Dashboard from './pages/Dashboard';
import Businesses from './pages/Businesses';
import Locations from './pages/Locations';
import Staff from './pages/Staff';
import Services from './pages/Services';
import StaffServices from './pages/StaffServices';
import Availability from './pages/Availability';
import Customers from './pages/Customers';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import ApiKeys from './pages/ApiKeys';
import WidgetScript from './pages/WidgetScript';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';

import { GoogleOAuthProvider } from '@react-oauth/google';

import PublicBusinessWebsite from './pages/PublicBusinessWebsite';
import WebsiteGenerator from './pages/WebsiteGenerator';

import PortalLayout from './layout/PortalLayout';
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalBusinesses from './pages/portal/PortalBusinesses';
import PortalBookings from './pages/portal/PortalBookings';
import PortalUsers from './pages/portal/PortalUsers';
import CreateAdmin from './pages/portal/CreateAdmin';
import PortalPackages from './pages/portal/PortalPackages';
import AdminPayments from './pages/portal/AdminPayments';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  // Auto-refresh JWT when user is logged in but business_id is missing.
  // This handles users who logged in before tenant isolation was implemented.
    useEffect(() => {
        // Skip migration check on auth pages and landing page to prevent loops
        const isPublicPage = ['/', '/login', '/register'].includes(window.location.pathname);
        if (isPublicPage) return;

        const stored = localStorage.getItem('currentUser');
        if (!stored) return;
        try {
            const user = JSON.parse(stored);
            // Only refresh if token is present, business_id is missing, and it's NOT a portal admin
            const needsRefresh = user?.token && !user?.business_id && user?.role !== 'PORTAL_ADMIN';

            if (needsRefresh) {
                axiosInstance.post('/users/refresh-token')
                    .then(res => {
                        if (res.data?.success) {
                            const { token, user: refreshedUser } = res.data.data;
                            const updatedUser = { ...user, ...refreshedUser, token };
                            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                            localStorage.setItem('role', refreshedUser.role);
                            localStorage.setItem('isPortalAdmin', refreshedUser.role === 'PORTAL_ADMIN');

                            // ONLY reload if we actually found a business_id now.
                            // If it's still null, we stop here to prevent an infinite reload loop.
                            if (refreshedUser.business_id) {
                                window.location.reload();
                            }
                        }
                    })
                    .catch(() => {/* silent fail */ });
            }
        } catch (_) { /* ignore parse errors */ }
    }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SearchProvider>
            <BusinessProvider>
              <Router>
                <Toaster position="top-right" />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Dashboard Routes */}
                    <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/businesses" element={<Businesses />} />
                        <Route path="/locations" element={<Locations />} />
                        <Route path="/staff" element={<Staff />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/staff-services" element={<StaffServices />} />
                        <Route path="/availability" element={<Availability />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/api-keys" element={<ApiKeys />} />
                        <Route path="/widget-script" element={<WidgetScript />} />
                        <Route path="/website-builder" element={<WebsiteGenerator />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/checkout" element={<Checkout />} />
                    </Route>

                    {/* Portal Admin Routes */}
                    <Route element={<AuthGuard><PortalLayout /></AuthGuard>}>
                        <Route path="/portal/dashboard" element={<PortalDashboard />} />
                        <Route path="/portal/businesses" element={<PortalBusinesses />} />
                        <Route path="/portal/bookings" element={<PortalBookings />} />
                        <Route path="/portal/users" element={<PortalUsers />} />
                        <Route path="/portal/create-admin" element={<CreateAdmin />} />
                        <Route path="/portal/packages" element={<PortalPackages />} />
                        <Route path="/portal/payments" element={<AdminPayments />} />
                    </Route>

                  <Route path="/:id" element={<PublicBusinessWebsite />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Router>
            </BusinessProvider>
          </SearchProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
