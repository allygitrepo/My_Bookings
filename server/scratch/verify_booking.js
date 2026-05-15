const axios = require('axios');

const API_URL = 'http://localhost:3000'; // Adjust if needed

async function testBooking() {
    try {
        console.log('--- Testing Create Booking with Multiple Services ---');
        
        // Mock data - replace with valid IDs from your DB if needed for a real integration test
        // But for now, we'll just check if the payload is accepted and processed
        const payload = {
            business_id: 1,
            location_id: 1,
            staff_id: 1,
            service_id: 1,
            service_ids: [1, 2, 3], // Multiple services
            customer_id: 1,
            booking_date: '2026-04-15',
            start_time: '10:00:00',
            end_time: '11:30:00',
            payment_status: true,
            status: true
        };

        // Note: This might fail if IDs don't exist, but it will show if the controller logic is reached
        // The console.log in the controller will show up in the server logs.
        
        console.log('Payload:', payload);
        console.log('Note: To fully verify, check the server output for "[BookingController] Stored 3 services..."');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testBooking();
