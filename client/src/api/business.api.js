import axiosInstance from './axiosInstance';

export const getBusinesses = async () => {
    const response = await axiosInstance.get('/business/all');
    return response.data;
};

export const createBusiness = async (data) => {
    const response = await axiosInstance.post('/business/create', data);
    return response.data;
};

export const updateBusiness = async (id, data) => {
    const response = await axiosInstance.put(`/business/update/${id}`, data);
    return response.data;
};

export const deleteBusiness = async (id) => {
    const response = await axiosInstance.delete(`/business/delete/${id}`);
    return response.data;
};
