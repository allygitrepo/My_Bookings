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

export const settlePayments = async (data) => {
    const response = await axiosInstance.put('/payments/settle', data);
    return response.data;
};

export const deletePayment = async (id) => {
    const response = await axiosInstance.delete(`/payments/delete/${id}`);
    return response.data;
};

export const createRazorpayOrder = async (data) => {
    const response = await axiosInstance.post('/payments/razorpay/order', data);
    return response.data;
};

export const verifyRazorpayPayment = async (data) => {
    const response = await axiosInstance.post('/payments/razorpay/verify', data);
    return response.data;
};

export const createStripeCheckoutSession = async (data) => {
    const response = await axiosInstance.post('/payments/stripe/create-checkout-session', data);
    return response.data;
};

export const verifyStripePayment = async (data) => {
    const response = await axiosInstance.post('/payments/stripe/verify', data);
    return response.data;
};
