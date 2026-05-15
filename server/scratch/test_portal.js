const { connectDB } = require("../config/db");
const { User, Business, Booking, Payment } = require("../models/associations");

async function test() {
    try {
        console.log("Connecting to DB...");
        await connectDB();
        
        console.log("Testing dashboard query...");
        const businessesCount = await Business.count({ where: { status: true } });
        console.log("Total Businesses:", businessesCount);

        const usersCount = await User.count({ where: { status: true } });
        console.log("Total Users:", usersCount);

        const bookingsCount = await Booking.count();
        console.log("Total Bookings:", bookingsCount);

        console.log("Testing Businesses with Owner include...");
        const bizs = await Business.findAll({
            include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
            limit: 1
        });
        console.log("Business Owner Example:", bizs[0]?.owner?.name);

        console.log("Testing Bookings with Business include...");
        const books = await Booking.findAll({
            include: [{ model: Business, attributes: ['business_name'] }],
            limit: 1
        });
        console.log("Booking Business Example:", books[0]?.business?.business_name);

        console.log("SUCCESS: All portal queries work.");
        process.exit(0);
    } catch (error) {
        console.error("FAILED Portal Query:");
        console.error(error);
        process.exit(1);
    }
}

test();
