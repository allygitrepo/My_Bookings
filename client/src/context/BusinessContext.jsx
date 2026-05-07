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

    const selectedBusiness = businesses.find(b => b.id === Number(selectedBusinessId));
    const isSuspended = selectedBusiness?.status === false;
    const suspendedReason = selectedBusiness?.suspended_reason;

    const refreshBusinesses = async () => {
        const stored = localStorage.getItem('currentUser');
        if (!stored) {
            setLoading(false);
            return;
        }

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

    // Reset selectedBusinessId if it's no longer valid for the current user
    useEffect(() => {
        if (!loading && businesses.length > 0) {
            // Auto-select if there is only one business
            if (businesses.length === 1) {
                const singleId = String(businesses[0].id);
                if (selectedBusinessId !== singleId) {
                    setSelectedBusinessId(singleId);
                }
            } else if (selectedBusinessId !== 'all') {
                const exists = businesses.some(b => String(b.id) === String(selectedBusinessId));
                if (!exists) {
                    console.log('BusinessContext: Resetting invalid selectedBusinessId to "all"');
                    setSelectedBusinessId('all');
                }
            }
        }
    }, [businesses, loading, selectedBusinessId]);

    return (
        <BusinessContext.Provider value={{ 
            businesses, 
            selectedBusinessId, 
            setSelectedBusinessId, 
            refreshBusinesses, 
            loading,
            selectedBusiness,
            isSuspended,
            suspendedReason
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
