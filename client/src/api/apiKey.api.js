import axiosInstance from './axiosInstance';

export const getApiKeys = async () => {
    const response = await axiosInstance.get('/api-keys/all');
    return response.data;
};

export const createApiKey = async (data) => {
    const response = await axiosInstance.post('/api-keys/create', data);
    return response.data;
};

export const updateApiKey = async (id, data) => {
    const response = await axiosInstance.put(`/api-keys/update/${id}`, data);
    return response.data;
};

export const deleteApiKey = async (id) => {
    const response = await axiosInstance.delete(`/api-keys/delete/${id}`);
    return response.data;
};
