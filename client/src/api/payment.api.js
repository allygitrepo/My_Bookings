import axiosInstance from './axiosInstance';

export const getPayments = async () => {
    const response = await axiosInstance.get('/payments/all');
    return response.data;
};

export const createPayment = async (data) => {
    const response = await axiosInstance.post('/payments/create', data);
    return response.data;
};

export const updatePayment = async (id, data) => {
    const response = await axiosInstance.put(`/payments/update/${id}`, data);
    return response.data;
};

export const deletePayment = async (id) => {
    const response = await axiosInstance.delete(`/payments/delete/${id}`);
    return response.data;
};
