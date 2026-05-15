import axiosInstance from './axiosInstance';

export const getCustomers = async () => {
    const response = await axiosInstance.get('/customers/all');
    return response.data;
};

export const createCustomer = async (data) => {
    const response = await axiosInstance.post('/customers/create', data);
    return response.data;
};

export const updateCustomer = async (id, data) => {
    const response = await axiosInstance.put(`/customers/update/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id) => {
    const response = await axiosInstance.delete(`/customers/delete/${id}`);
    return response.data;
};
