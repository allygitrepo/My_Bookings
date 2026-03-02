import { useLocalStorage } from './hooks/useLocalStorage';

export const useBusinesses = () => useLocalStorage('businesses', []);
export const useLocations = () => useLocalStorage('locations', []);
export const useStaff = () => useLocalStorage('staff', []);
export const useServices = () => useLocalStorage('services', []);
export const useStaffServices = () => useLocalStorage('staffServices', []);
export const useCustomers = () => useLocalStorage('customers', []);
export const useBookings = () => useLocalStorage('bookings', []);
export const usePayments = () => useLocalStorage('payments', []);
export const useApiKeys = () => useLocalStorage('apiKeys', []);
export const useStaffAvailability = () => useLocalStorage('staffAvailability', {});
