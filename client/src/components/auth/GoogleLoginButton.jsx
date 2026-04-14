import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

/**
 * GoogleLoginButton component
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback after successful login with user data
 * @param {Function} props.onError - Optional error callback
 */
const GoogleLoginButton = ({ onSuccess, onError }) => {
    
    const handleSuccess = (credentialResponse) => {
        try {
            const token = credentialResponse.credential;
            const decoded = jwtDecode(token);
            
            // Normalize user object as requested
            const user = {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
                googleId: decoded.sub,
                token: token
            };
            
            if (onSuccess) {
                onSuccess(user);
            }
        } catch (error) {
            console.error('Error decoding Google token:', error);
            if (onError) onError(error);
        }
    };

    const handleError = () => {
        console.error('Google Login Failed');
        if (onError) onError(new Error('Google Login Failed'));
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            shape="pill"
            theme="filled_blue"
            text="continue_with"
        />
    );
};

export default GoogleLoginButton;