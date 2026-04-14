import axiosInstance from '../api/axiosInstance';

/**
 * Google login service
 * @param {Object} data - Normalized user data from GoogleLoginButton
 */
export const googleLogin = async (data) => {
    try {
        // The data object contains { token: "google_id_token", ... }
        // We send the credential (token) to the backend for verification
        const response = await axiosInstance.post('/auth/google', {
            credential: data.token
        });

        if (response.data.success) {
            const { token, user, activeBusiness, businesses } = response.data;
            
            // Store common auth data
            localStorage.setItem('currentUser', JSON.stringify({ ...user, token }));
            localStorage.setItem('activeBusiness', JSON.stringify(activeBusiness));
            localStorage.setItem('businesses', JSON.stringify(businesses));
            localStorage.setItem('role', user.role);
            localStorage.setItem('isPortalAdmin', user.isPortalAdmin);
            
            return response.data;
        } else {
            throw new Error(response.data.message || 'Google Login failed');
        }
    } catch (error) {
        console.error('googleLogin error:', error);
        throw error;
    }
};

const authService = {
    googleLogin,
};

export default authService;
