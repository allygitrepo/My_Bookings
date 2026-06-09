import axios from 'axios';

const envBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/mybookings';
// Dynamically replace localhost with the current hostname to support local network access (e.g. 192.168.1.9)
const baseURL = envBaseURL && envBaseURL.includes('localhost') 
    ? envBaseURL.replace('localhost', window.location.hostname)
    : envBaseURL;

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.status === 401) {
            const isAuthPage = ['/login', '/register'].includes(window.location.pathname);
            
            // Only clear and redirect if we aren't already on an auth page
            if (!isAuthPage) {
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
