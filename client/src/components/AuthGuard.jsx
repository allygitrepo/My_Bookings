import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../store';

/**
 * AuthGuard: Protects routes that require authentication.
 * If no user session is found in localStorage, redirects to /login.
 */
const AuthGuard = ({ children }) => {
    const [currentUser] = useCurrentUser();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AuthGuard;
