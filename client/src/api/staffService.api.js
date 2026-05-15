import axiosInstance from './axiosInstance';

export const getStaffServices = async () => {
    const response = await axiosInstance.get('/staff-services/all');
    return response.data;
};

export const createStaffService = async (data) => {
    const response = await axiosInstance.post('/staff-services/create', data);
    return response.data;
};

export const updateStaffService = async (id, data) => {
    const response = await axiosInstance.put(`/staff-services/update/${id}`, data);
    return response.data;
};

export const deleteStaffService = async (id) => {
    const response = await axiosInstance.delete(`/staff-services/delete/${id}`);
    return response.data;
};
