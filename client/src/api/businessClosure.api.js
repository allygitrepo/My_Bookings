import axiosInstance from './axiosInstance';

export const getBusinessClosures = async () => {
    const response = await axiosInstance.get('/business-closures/all');
    return response.data;
};

export const createBusinessClosure = async (data) => {
    const response = await axiosInstance.post('/business-closures/create', data);
    return response.data;
};

export const updateBusinessClosure = async (id, data) => {
    const response = await axiosInstance.put(`/business-closures/update/${id}`, data);
    return response.data;
};

export const deleteBusinessClosure = async (id) => {
    const response = await axiosInstance.delete(`/business-closures/delete/${id}`);
    return response.data;
};
