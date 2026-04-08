import React, { createContext, useContext, useState, useEffect } from 'react';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
    // Default to 'all' to show data across all businesses
    const [selectedBusinessId, setSelectedBusinessId] = useState(() => {
        return localStorage.getItem('selectedBusinessId') || 'all';
    });

    useEffect(() => {
        localStorage.setItem('selectedBusinessId', selectedBusinessId);
    }, [selectedBusinessId]);

    return (
        <BusinessContext.Provider value={{ selectedBusinessId, setSelectedBusinessId }}>
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
};
