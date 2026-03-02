import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import theme from './theme';
import MainLayout from './layout/MainLayout';
import AuthGuard from './components/AuthGuard';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <Router>
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
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
