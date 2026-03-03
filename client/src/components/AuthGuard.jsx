import React from 'react';
import { Navigate } from 'react-router-dom';
const AuthGuard = ({ children }) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AuthGuard;
