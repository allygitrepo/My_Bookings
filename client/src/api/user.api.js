import axiosInstance from './axiosInstance';

export const login = async (credentials) => {
    const response = await axiosInstance.post('/users/login', credentials);
    return response.data;
};

export const register = async (userData) => {
    const response = await axiosInstance.post('/users/register', userData);
    return response.data;
};

export const getUserById = async (id) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
};

export const getUsers = async () => {
    const response = await axiosInstance.get('/users/all');
    return response.data;
};

export const createUser = async (data) => {
    const response = await axiosInstance.post('/users/create', data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await axiosInstance.put(`/users/update/${id}`, data);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await axiosInstance.delete(`/users/delete/${id}`);
    return response.data;
};
