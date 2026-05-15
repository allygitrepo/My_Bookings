import axiosInstance from './axiosInstance';

export const getServices = async () => {
    const response = await axiosInstance.get('/services/all');
    return response.data;
};

export const createService = async (data) => {
    const response = await axiosInstance.post('/services/create', data);
    return response.data;
};

export const updateService = async (id, data) => {
    const response = await axiosInstance.put(`/services/update/${id}`, data);
    return response.data;
};

export const deleteService = async (id) => {
    const response = await axiosInstance.delete(`/services/delete/${id}`);
    return response.data;
};
