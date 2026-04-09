import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBusinesses } from '../api/business.api';

const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Default to 'all' to show data across all businesses
    const [selectedBusinessId, setSelectedBusinessId] = useState(() => {
        return localStorage.getItem('selectedBusinessId') || 'all';
    });

    const refreshBusinesses = async () => {
        setLoading(true);
        try {
            const response = await getBusinesses();
            if (response.success) {
                setBusinesses(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch businesses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshBusinesses();
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedBusinessId', selectedBusinessId);
    }, [selectedBusinessId]);

    return (
        <BusinessContext.Provider value={{ 
            selectedBusinessId, 
            setSelectedBusinessId, 
            businesses, 
            setBusinesses,
            refreshBusinesses,
            loading 
        }}>
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
