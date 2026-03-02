import { useLocalStorage } from './hooks/useLocalStorage';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const useRegisteredUsers = () => useLocalStorage('registeredUsers', []);
export const useCurrentUser = () => useLocalStorage('currentUser', null);

// ─── Core Entities (schema-aligned field names) ──────────────────────────────
export const useBusinesses = () => useLocalStorage('businesses', []);
export const useLocations = () => useLocalStorage('locations', []);
export const useStaff = () => useLocalStorage('staff', []);
export const useServices = () => useLocalStorage('services', []);
export const useStaffServices = () => useLocalStorage('staffServices', []);

// Flat availability records: { id, staff_id, day_of_week, start_time, end_time, status, created_at }
export const useAvailability = () => useLocalStorage('availability', []);

export const useCustomers = () => useLocalStorage('customers', []);
export const useBookings = () => useLocalStorage('bookings', []);
export const usePayments = () => useLocalStorage('payments', []);
export const useApiKeys = () => useLocalStorage('apiKeys', []);

// ─── Legacy alias kept for backwards compat ───────────────────────────────────
export const useStaffAvailability = () => useLocalStorage('staffAvailability', {});
