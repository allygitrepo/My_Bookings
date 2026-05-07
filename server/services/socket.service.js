const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    io.on("connection", (socket) => {
        // console.log("New client connected:", socket.id);

        // Join a business-specific room
        socket.on("join_business", (businessId) => {
            if (businessId) {
                const roomName = `business_${businessId}`;
                socket.join(roomName);
                // console.log(`Socket ${socket.id} joined room: ${roomName}`);
            }
        });

        socket.on("disconnect", () => {
            // console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

/**
 * Emit an event to a specific business room
 * @param {string|number} businessId 
 * @param {string} event 
 * @param {object} data 
 */
const emitToBusiness = (businessId, event, data) => {
    if (io && businessId) {
        const roomName = `business_${businessId}`;
        io.to(roomName).emit(event, data);
        console.log(`Emitted ${event} to room: ${roomName}`);
    }
};

module.exports = {
    initSocket,
    getIO,
    emitToBusiness
};
