import toast from 'react-hot-toast';

let loaderId = null;

/**
 * Show a global loading toast.
 * @param {string} message 
 */
export const showGlobalLoader = (message = 'Processing...') => {
    if (loaderId) toast.dismiss(loaderId);
    loaderId = toast.loading(message);
};

/**
 * Hide the global loading toast.
 */
export const hideGlobalLoader = () => {
    if (loaderId) {
        toast.dismiss(loaderId);
        loaderId = null;
    }
};
