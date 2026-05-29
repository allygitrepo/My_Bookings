import axiosInstance from './axiosInstance';

export const getTemplates = async () => {
    const response = await axiosInstance.get('/templates/all');
    return response.data;
};
