const admin = require("firebase-admin");
const path = require("path");

try {
    const serviceAccount = require("../firebase-service-account.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("[FCM] Firebase Admin initialized successfully");
} catch (error) {
    console.error("[FCM] Firebase Admin initialization failed:", error.message);
}

const fcmService = {
    /**
     * Send a push notification to a specific FCM token
     */
    sendNotification: async (token, title, body, data = {}) => {
        if (!token) return;

        const message = {
            notification: {
                title: title,
                body: body
            },
            android: {
                notification: {
                    channelId: "booking_alerts",
                    priority: "high"
                }
            },
            data: data,
            token: token
        };

        try {
            const response = await admin.messaging().send(message);
            console.log("[FCM] Notification sent successfully:", response);
            return response;
        } catch (error) {
            console.error("[FCM] Error sending notification:", error.message);
            throw error;
        }
    },

    /**
     * Send notification to a topic (e.g., business_123)
     */
    sendToTopic: async (topic, title, body, data = {}) => {
        const message = {
            notification: {
                title: title,
                body: body
            },
            android: {
                notification: {
                    channelId: "booking_alerts",
                    priority: "high"
                }
            },
            data: data,
            topic: topic
        };

        try {
            const response = await admin.messaging().send(message);
            console.log(`[FCM] Topic notification sent to ${topic}:`, response);
            return response;
        } catch (error) {
            console.error("[FCM] Error sending topic notification:", error.message);
            throw error;
        }
    }
};

module.exports = fcmService;
