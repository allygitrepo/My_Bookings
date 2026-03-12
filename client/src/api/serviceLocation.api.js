import axiosInstance from './axiosInstance';

export const getServiceLocations = async () => {
    const response = await axiosInstance.get('/service-locations/all');
    return response.data;
};

export const createServiceLocation = async (data) => {
    const response = await axiosInstance.post('/service-locations/create', data);
    return response.data;
};

export const updateServiceLocation = async (id, data) => {
    const response = await axiosInstance.put(`/service-locations/update/${id}`, data);
    return response.data;
};

export const deleteServiceLocation = async (id) => {
    const response = await axiosInstance.delete(`/service-locations/delete/${id}`);
    return response.data;
};
