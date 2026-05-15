import axiosInstance from './axiosInstance';

export const getBookings = async () => {
    const response = await axiosInstance.get('/bookings/all');
    return response.data;
};

export const createBooking = async (data) => {
    const response = await axiosInstance.post('/bookings/create', data);
    return response.data;
};

export const updateBooking = async (id, data) => {
    const response = await axiosInstance.put(`/bookings/update/${id}`, data);
    return response.data;
};

export const deleteBooking = async (id) => {
    const response = await axiosInstance.delete(`/bookings/delete/${id}`);
    return response.data;
};
