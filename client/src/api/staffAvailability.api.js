import axiosInstance from './axiosInstance';

export const getStaffAvailability = async () => {
    const response = await axiosInstance.get('/staff-availability/all');
    return response.data;
};

export const createStaffAvailability = async (data) => {
    const response = await axiosInstance.post('/staff-availability/create', data);
    return response.data;
};

export const bulkCreateStaffAvailability = async (data) => {
    const response = await axiosInstance.post('/staff-availability/bulk-create', data);
    return response.data;
};

export const updateStaffAvailability = async (id, data) => {
    const response = await axiosInstance.put(`/staff-availability/update/${id}`, data);
    return response.data;
};

export const deleteStaffAvailability = async (id) => {
    const response = await axiosInstance.delete(`/staff-availability/delete/${id}`);
    return response.data;
};

export const deleteStaffAvailabilityByStaff = async (staff_id) => {
    const response = await axiosInstance.delete(`/staff-availability/delete-by-staff/${staff_id}`);
    return response.data;
};
