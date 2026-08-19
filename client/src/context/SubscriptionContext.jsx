import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUsage = async () => {
        try {
            const res = await axiosInstance.get('/users/usage');
            if (res.data.success) {
                setUsage(res.data.data);
            }
        } catch (error) {
            console.error('Subscription Usage Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            // Portal Admins don't need usage tracking usually, but we fetch it for consistency
            if (user.role !== 'PORTAL_ADMIN') {
                refreshUsage();
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const value = {
        usage,
        loading,
        refreshUsage,
        // Helper methods for easy checks
        canAdd: (resource) => {
            if (!usage) return true; // Assume allowed if not loaded or portal admin
            const flagMap = {
                business: 'canAddBusiness',
                location: 'canAddLocation',
                staff: 'canAddStaff',
                service: 'canAddService',
                booking: 'canAcceptBooking'
            };
            return usage.flags[flagMap[resource]] !== false;
        },
        isFeatureAllowed: (feature) => {
            const storedUser = localStorage.getItem('currentUser');
            const user = storedUser ? JSON.parse(storedUser) : null;
            
            // Portal Admins always see all features
            if (user?.role === 'PORTAL_ADMIN') return true;
            
            if (!usage || !usage.flags) return false; 
            
            const featureMap = {
                website: 'isWebsiteAllowed',
                api: 'isApiAllowed',
                whatsapp: 'isWhatsappAllowed',
                staffLeaves: 'isStaffLeavesAllowed',
                leaveMaster: 'isStaffLeavesAllowed'
            };

            const flagKey = featureMap[feature];
            const isAllowed = Boolean(usage.flags[flagKey]);
            
            // console.log(`[Subscription] Feature: ${feature}, Allowed: ${isAllowed}`);
            return isAllowed;
        }
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
