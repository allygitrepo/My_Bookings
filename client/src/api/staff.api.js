import axiosInstance from './axiosInstance';

export const getStaff = async () => {
    const response = await axiosInstance.get('/staff/all');
    return response.data;
};

export const createStaff = async (data) => {
    const response = await axiosInstance.post('/staff/create', data);
    return response.data;
};

export const updateStaff = async (id, data) => {
    const response = await axiosInstance.put(`/staff/update/${id}`, data);
    return response.data;
};

export const deleteStaff = async (id) => {
    const response = await axiosInstance.delete(`/staff/delete/${id}`);
    return response.data;
};
