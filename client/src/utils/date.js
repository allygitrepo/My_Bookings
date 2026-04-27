/**
 * Formats a date string or Date object into various formats.
 * 
 * @param {string|Date} date - The date to format.
 * @param {string} format - The desired format (default: 'DD/MM/YYYY').
 * @returns {string} - The formatted date string.
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '—';

    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return '—';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'DD-MM-YYYY':
            return `${day}-${month}-${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${day}/${month}/${year}`;
    }
};

/**
 * Returns the day name for a given date string.
 * 
 * @param {string} dateStr - The date string (YYYY-MM-DD).
 * @param {boolean} short - Whether to return the short version (e.g., 'Sun').
 * @returns {string}
 */
export const getDayName = (dateStr, short = false) => {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = days[date.getDay()];
    return short ? dayName.slice(0, 3) : dayName;
};
