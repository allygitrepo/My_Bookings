import axiosInstance from './axiosInstance';

/**
 * Fetch all active (publicly visible) packages for the landing page.
 * Uses the /packages/active endpoint which requires NO authentication.
 */
export const getActivePackages = async () => {
    const response = await axiosInstance.get('/packages/active');
    return response.data;
};
