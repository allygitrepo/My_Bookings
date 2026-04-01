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
import ApiKeys from './pages/ApiKeys';
import WidgetScript from './pages/WidgetScript';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import { GoogleOAuthProvider } from '@react-oauth/google';

import PublicBusinessWebsite from './pages/PublicBusinessWebsite';
import WebsiteGenerator from './pages/WebsiteGenerator';

const GOOGLE_CLIENT_ID = "518219129243-ffkdl9t99oqrofkfm5l4o3nvnvmolvd4.apps.googleusercontent.com";

function App() {
  // Auto-refresh JWT when user is logged in but business_id is missing.
  // This handles users who logged in before tenant isolation was implemented.
  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      if (user?.token && !user?.business_id) {
        axiosInstance.post('/users/refresh-token')
          .then(res => {
            if (res.data?.success) {
              const { token, user: refreshedUser } = res.data.data;
              localStorage.setItem('currentUser', JSON.stringify({
                ...user,
                ...refreshedUser,
                token,
              }));
              // Reload the page so all components pick up the new business_id
              window.location.reload();
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
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="/widget-script" element={<WidgetScript />} />
                  <Route path="/website-builder" element={<WebsiteGenerator />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                <Route path="/:slug" element={<PublicBusinessWebsite />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </SearchProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
