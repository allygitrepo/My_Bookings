import axiosInstance from './axiosInstance';

export const getServiceTypes = async () => {
    const response = await axiosInstance.get('/service-types/all');
    return response.data;
};

export const createServiceType = async (data) => {
    const response = await axiosInstance.post('/service-types/create', data);
    return response.data;
};

export const deleteServiceType = async (id) => {
    const response = await axiosInstance.delete(`/service-types/delete/${id}`);
    return response.data;
};
