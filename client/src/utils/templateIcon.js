/**
 * Resolve API origin (same host logic as axiosInstance for local network access).
 */
export const getApiOrigin = () => {
    const envBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/mybookings';
    let origin = envBase.replace(/\/mybookings\/?$/, '');
    if (origin.includes('localhost') && typeof window !== 'undefined') {
        origin = origin.replace('localhost', window.location.hostname);
    }
    return origin.replace(/\/$/, '');
};

/**
 * Build a full URL for a custom template's favicon/logo.
 * Prefers API-provided icon; falls back to static template assets on the API server.
 */
export const getTemplateIconUrl = (template) => {
    if (!template) return null;

    const icon = template.icon;
    if (icon) {
        if (icon.startsWith('http://') || icon.startsWith('https://')) {
            return icon;
        }
        const path = icon.startsWith('/') ? icon : `/${icon}`;
        return `${getApiOrigin()}${path}`;
    }

    const templateId = template.templateId || template.id;
    if (!templateId) return null;

    return `${getApiOrigin()}/My_Bookings_Templates/${templateId}/favicon.ico`;
};
