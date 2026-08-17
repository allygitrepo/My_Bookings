import axiosInstance from './axiosInstance';

export const getStaffLeaves = async (params = {}) => {
    const response = await axiosInstance.get('/staff-leaves/all', { params });
    return response.data;
};

export const createStaffLeave = async (data) => {
    const response = await axiosInstance.post('/staff-leaves/create', data);
    return response.data;
};

export const updateStaffLeave = async (id, data) => {
    const response = await axiosInstance.put(`/staff-leaves/update/${id}`, data);
    return response.data;
};

export const deleteStaffLeave = async (id) => {
    const response = await axiosInstance.delete(`/staff-leaves/delete/${id}`);
    return response.data;
};
