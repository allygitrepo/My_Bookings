/**
 * Global input validation system for MyBookings application.
 */

// 1. Email Validation
export const validateEmail = (value) => {
    if (!value) return true;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(value)) return "Please enter a valid email address";
    if (containsEmoji(value)) return "Emojis are not allowed";
    return true;
};

// 2. Mobile Number Validation (STRICT 10 digits)
export const validateMobile = (value) => {
    if (!value) return true;
    const regex = /^[0-9]{10}$/;
    if (!regex.test(value)) return "Mobile number must be 10 digits";
    return true;
};

// 3. Phone Number Validation
export const validatePhone = (value) => {
    if (!value) return true;
    const regex = /^[0-9+\-\s()]{6,15}$/;
    if (!regex.test(value)) return "Please enter a valid phone number";
    if (containsEmoji(value)) return "Emojis are not allowed";
    return true;
};

// 4. Name Field Validation (Alphabets only)
export const validateName = (value) => {
    if (!value) return true;
    const regex = /^[A-Za-z0-9 .\-\(\)]+$/;
    if (!regex.test(value)) return "Name should contain only alphabets, numbers and common symbols";
    if (containsEmoji(value)) return "Emojis are not allowed";
    return true;
};

// 5. Emoji Blocking (GLOBAL)
export const containsEmoji = (value) => {
    if (!value || typeof value !== 'string') return false;
    // Broad emoji regex
    const regex = /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    return regex.test(value);
};

// 6. Required Field Validation
export const validateRequired = (value) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return "Please fill all required fields";
    }
    return true;
};

// Helper for blocking emojis in any string field
export const blockEmoji = (value) => {
    if (containsEmoji(value)) return "Emojis are not allowed";
    return true;
};
