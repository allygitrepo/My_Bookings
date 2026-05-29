import axiosInstance from './axiosInstance';

export const getTemplates = async () => {
    const response = await axiosInstance.get('/templates/all');
    return response.data;
};

export const uploadTemplateZip = async (formData) => {
    const response = await axiosInstance.post('/templates/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
