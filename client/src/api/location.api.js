import axiosInstance from './axiosInstance';

export const getLocations = async () => {
    const response = await axiosInstance.get('/locations/all');
    return response.data;
};

export const createLocation = async (data) => {
    const response = await axiosInstance.post('/locations/create', data);
    return response.data;
};

export const updateLocation = async (id, data) => {
    const response = await axiosInstance.put(`/locations/update/${id}`, data);
    return response.data;
};

export const deleteLocation = async (id) => {
    const response = await axiosInstance.delete(`/locations/delete/${id}`);
    return response.data;
};
