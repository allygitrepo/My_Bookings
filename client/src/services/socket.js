import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL.replace('/mybookings', '');

let socket;

export const initiateSocketConnection = () => {
    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
    console.log(`Connecting socket to: ${SOCKET_URL}...`);
    return socket;
};

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
};

export const joinBusinessRoom = (businessId) => {
    if (socket && businessId) {
        socket.emit('join_business', businessId);
    }
};

export const subscribeToBookings = (cb) => {
    if (!socket) return;
    
    socket.on('bookingCreated', (data) => {
        console.log('Real-time: Booking created', data);
        cb({ type: 'CREATED', data });
    });

    socket.on('bookingUpdated', (data) => {
        console.log('Real-time: Booking updated', data);
        cb({ type: 'UPDATED', data });
    });

    socket.on('bookingCancelled', (data) => {
        console.log('Real-time: Booking cancelled', data);
        cb({ type: 'CANCELLED', data });
    });

    socket.on('paymentUpdated', (data) => {
        console.log('Real-time: Payment updated', data);
        cb({ type: 'PAYMENT_UPDATED', data });
    });
};

export const unsubscribeFromBookings = () => {
    if (!socket) return;
    socket.off('bookingCreated');
    socket.off('bookingUpdated');
    socket.off('bookingCancelled');
    socket.off('paymentUpdated');
};
