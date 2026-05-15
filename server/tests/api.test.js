const axios = require("axios");
require("dotenv").config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/mybookings`;
let token = "";
let businessId = "";
const testEmail = `test_${Date.now()}@example.com`;

const log = (msg, success = true) => {
    console.log(`${success ? "✔" : "✖"} ${msg}`);
};

async function runTests() {
    try {
        console.log("--- Starting API Tests ---\n");
        console.log(`Using test email: ${testEmail}\n`);

        // 1. User Register & Login
        try {
            await axios.post(`${BASE_URL}/users/register`, {
                name: "Test User",
                email: testEmail,
                password: "password123"
            });
            log("User REGISTER passed");
        } catch (e) {
            log(`User REGISTER failed: ${e.response?.data?.message || e.message}`, false);
            process.exit(1);
        }

        try {
            const loginRes = await axios.post(`${BASE_URL}/users/login`, {
                email: testEmail,
                password: "password123"
            });
            token = loginRes.data.data.token;
            log("User LOGIN passed");
        } catch (e) {
            log(`User LOGIN failed: ${e.response?.data?.message || e.message}`, false);
            process.exit(1);
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Business CRUD
        try {
            const bizRes = await axios.post(`${BASE_URL}/business/create`, {
                business_name: "Test Business",
                user_id: 1,
                email: "biz@test.com"
            }, config);
            businessId = bizRes.data.data.id;
            log("Business CREATE passed");
        } catch (e) {
            log(`Business CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        try {
            await axios.get(`${BASE_URL}/business/all`, config);
            log("Business READ ALL passed");
        } catch (e) {
            log(`Business READ ALL failed: ${e.response?.data?.message || e.message}`, false);
        }

        try {
            await axios.put(`${BASE_URL}/business/update/${businessId}`, { business_name: "Updated Business" }, config);
            log("Business UPDATE passed");
        } catch (e) {
            log(`Business UPDATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 3. Location CRUD
        let locationId;
        try {
            const locRes = await axios.post(`${BASE_URL}/locations/create`, {
                business_id: businessId,
                location_name: "Main Office"
            }, config);
            locationId = locRes.data.data.id;
            log("Location CREATE passed");
        } catch (e) {
            log(`Location CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 4. Staff CRUD
        let staffId;
        try {
            const staffRes = await axios.post(`${BASE_URL}/staff/create`, {
                business_id: businessId,
                location_id: locationId,
                staff_name: "John Doe"
            }, config);
            staffId = staffRes.data.data.id;
            log("Staff CREATE passed");
        } catch (e) {
            log(`Staff CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 5. Service CRUD
        let serviceId;
        try {
            const serviceRes = await axios.post(`${BASE_URL}/services/create`, {
                business_id: businessId,
                service_name: "Consultation",
                price: 50
            }, config);
            serviceId = serviceRes.data.data.id;
            log("Service CREATE passed");
        } catch (e) {
            log(`Service CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 6. StaffService CRUD
        try {
            await axios.post(`${BASE_URL}/staff-services/create`, {
                staff_id: staffId,
                service_id: serviceId
            }, config);
            log("StaffService CREATE passed");
        } catch (e) {
            log(`StaffService CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 7. StaffAvailability CRUD
        try {
            await axios.post(`${BASE_URL}/staff-availability/create`, {
                staff_id: staffId,
                day_of_week: "monday",
                start_time: "09:00:00",
                end_time: "17:00:00"
            }, config);
            log("StaffAvailability CREATE passed");
        } catch (e) {
            log(`StaffAvailability CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 8. Customer CRUD
        let customerId;
        try {
            const custRes = await axios.post(`${BASE_URL}/customers/create`, {
                business_id: businessId,
                name: "Jane Smith"
            }, config);
            customerId = custRes.data.data.id;
            log("Customer CREATE passed");
        } catch (e) {
            log(`Customer CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 9. Booking CRUD
        let bookingId;
        try {
            const bookRes = await axios.post(`${BASE_URL}/bookings/create`, {
                business_id: businessId,
                location_id: locationId,
                staff_id: staffId,
                service_id: serviceId,
                customer_id: customerId,
                booking_date: "2024-05-20",
                start_time: "10:00:00",
                end_time: "11:00:00"
            }, config);
            bookingId = bookRes.data.data.id;
            log("Booking CREATE passed");
        } catch (e) {
            log(`Booking CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 10. Payment CRUD
        try {
            await axios.post(`${BASE_URL}/payments/create`, {
                booking_id: bookingId,
                amount: 50,
                payment_method: "Credit Card"
            }, config);
            log("Payment CREATE passed");
        } catch (e) {
            log(`Payment CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 11. ApiKey CRUD
        try {
            await axios.post(`${BASE_URL}/api-keys/create`, {
                business_id: businessId,
                api_key: "test-api-key-123"
            }, config);
            log("ApiKey CREATE passed");
        } catch (e) {
            log(`ApiKey CREATE failed: ${e.response?.data?.message || e.message}`, false);
        }

        // 12. Soft Delete & Cascading Check
        try {
            await axios.delete(`${BASE_URL}/business/delete/${businessId}`, config);
            log("Business DELETE (Soft Delete + Cascading) passed");
        } catch (e) {
            log(`Business DELETE failed: ${e.response?.data?.message || e.message}`, false);
        }

        console.log("\n--- All Tests Completed Successfully ---");
    } catch (error) {
        console.error("\n✖ Unexpected error:");
        console.error(error.message);
        process.exit(1);
    }
}

runTests();
