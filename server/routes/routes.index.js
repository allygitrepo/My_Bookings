const userRoutes = require("./user.routes");
const businessRoutes = require("./business.routes");
const locationRoutes = require("./location.routes");
const staffRoutes = require("./staff.routes");
const serviceRoutes = require("./service.routes");
const staffServiceRoutes = require("./staffService.routes");
const staffAvailabilityRoutes = require("./staffAvailability.routes");
const customerRoutes = require("./customer.routes");
const bookingRoutes = require("./booking.routes");
const paymentRoutes = require("./payment.routes");
const apiKeyRoutes = require("./apiKey.routes");
const serviceLocationRoutes = require("./serviceLocation.routes");

const routes = (app) => {
    const prefix = "/mybookings";

    app.use(`${prefix}/users`, userRoutes);
    app.use(`${prefix}/business`, businessRoutes);
    app.use(`${prefix}/locations`, locationRoutes);
    app.use(`${prefix}/staff`, staffRoutes);
    app.use(`${prefix}/services`, serviceRoutes);
    app.use(`${prefix}/staff-services`, staffServiceRoutes);
    app.use(`${prefix}/staff-availability`, staffAvailabilityRoutes);
    app.use(`${prefix}/customers`, customerRoutes);
    app.use(`${prefix}/bookings`, bookingRoutes);
    app.use(`${prefix}/payments`, paymentRoutes);
    app.use(`${prefix}/api-keys`, apiKeyRoutes);
    app.use(`${prefix}/service-locations`, serviceLocationRoutes);
};

module.exports = routes;