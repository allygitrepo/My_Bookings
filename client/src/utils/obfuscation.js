/**
 * Simple obfuscation for IDs to avoid showing raw numbers in URL
 * results in ~8-12 character strings
 */
export const encodeBusinessId = (id) => {
    if (!id) return '';
    // Add a signature and salt to make it "bigger" as requested
    return btoa(`MYB-${id}-${777}`).replace(/=/g, '');
};

export const decodeBusinessId = (encoded) => {
    if (!encoded) return '';
    try {
        const decoded = atob(encoded);
        const parts = decoded.split('-');
        if (parts[0] === 'MYB' && parts[2] === '777') {
            return parts[1];
        }
        return ''; // Invalid signature
    } catch (e) {
        return '';
    }
};
