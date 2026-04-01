import axios from 'axios';
import axiosInstance from './axiosInstance';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const getBusinesses = async () => {
    const response = await axiosInstance.get('/business/all');
    return response.data;
};

export const getBusinessBySlug = async (slug) => {
    const response = await axios.get(`${API_URL}/business/public/${slug}`);
    return response.data;
};

export const getBusinessById = async (id) => {
    const response = await axiosInstance.get(`/business/${id}`);
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

