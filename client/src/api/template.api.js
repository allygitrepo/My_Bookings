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

export const deleteTemplate = async (templateId) => {
    const response = await axiosInstance.delete(`/templates/${templateId}`);
    return response.data;
};

export const updateTemplate = async (templateId, data) => {
    const response = await axiosInstance.put(`/templates/${templateId}`, data);
    return response.data;
};

