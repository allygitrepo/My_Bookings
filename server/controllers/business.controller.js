const Business = require("../models/business.model");
const Location = require("../models/location.model");
const Staff = require("../models/staff.model");
const Service = require("../models/service.model");
const StaffService = require("../models/staffService.model");
const StaffAvailability = require("../models/staffAvailability.model");
const Customer = require("../models/customer.model");
const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const ApiKey = require("../models/apiKey.model");

const businessController = {
    create: async (req, res) => {
        try {
            const business = await Business.create(req.body);
            res.status(201).json({ success: true, message: "Business created successfully", data: business });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const businesses = await Business.findAll({ where: { status: true } });
            res.json({ success: true, message: "Businesses fetched successfully", data: businesses });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const business = await Business.findByPk(req.params.id);
            if (!business) return res.status(404).json({ success: false, message: "Business not found" });
            res.json({ success: true, message: "Business fetched successfully", data: business });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const business = await Business.findByPk(req.params.id);
            if (!business) return res.status(404).json({ success: false, message: "Business not found" });

            const { status } = req.body;
            await business.update(req.body);

            // Cascading status logic
            if (status === false || status === 'false' || status === 0) {
                const businessId = business.id;
                const updateCriteria = { where: { business_id: businessId } };

                await Location.update({ status: false }, updateCriteria);
                await Staff.update({ status: false }, updateCriteria);
                await Service.update({ status: false }, updateCriteria);
                await Customer.update({ status: false }, updateCriteria);
                await Booking.update({ status: false }, updateCriteria);
                await ApiKey.update({ status: false }, updateCriteria);

                // For dependencies of staff/service
                const staffRows = await Staff.findAll({ where: { business_id: businessId } });
                const staffIds = staffRows.map(s => s.id);
                if (staffIds.length > 0) {
                    await StaffService.update({ status: false }, { where: { staff_id: staffIds } });
                    await StaffAvailability.update({ status: false }, { where: { staff_id: staffIds } });
                }

                const bookingRows = await Booking.findAll({ where: { business_id: businessId } });
                const bookingIds = bookingRows.map(b => b.id);
                if (bookingIds.length > 0) {
                    await Payment.update({ status: false }, { where: { booking_id: bookingIds } });
                }
            }

            res.json({ success: true, message: "Business updated successfully", data: business });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const business = await Business.findByPk(req.params.id);
            if (!business) return res.status(404).json({ success: false, message: "Business not found" });

            await business.update({ status: false });

            // Cascading delete (soft delete)
            const businessId = business.id;
            const updateCriteria = { where: { business_id: businessId } };

            await Location.update({ status: false }, updateCriteria);
            await Staff.update({ status: false }, updateCriteria);
            await Service.update({ status: false }, updateCriteria);
            await Customer.update({ status: false }, updateCriteria);
            await Booking.update({ status: false }, updateCriteria);
            await ApiKey.update({ status: false }, updateCriteria);

            const staffRows = await Staff.findAll({ where: { business_id: businessId } });
            const staffIds = staffRows.map(s => s.id);
            if (staffIds.length > 0) {
                await StaffService.update({ status: false }, { where: { staff_id: staffIds } });
                await StaffAvailability.update({ status: false }, { where: { staff_id: staffIds } });
            }

            const bookingRows = await Booking.findAll({ where: { business_id: businessId } });
            const bookingIds = bookingRows.map(b => b.id);
            if (bookingIds.length > 0) {
                await Payment.update({ status: false }, { where: { booking_id: bookingIds } });
            }

            res.json({ success: true, message: "Business deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = businessController;
