const Staff = require("./staff.model");
const Location = require("./location.model");
const StaffLocation = require("./staffLocation.model");
const StaffAvailability = require("./staffAvailability.model");
const Business = require("./business.model");
const Service = require("./service.model");
const ServiceLocation = require("./serviceLocation.model");
const User = require("./user.model");
const Booking = require("./booking.model");
const Payment = require("./payment.model");
const Customer = require("./customer.model");
const BookingService = require("./bookingService.model");
const Package = require("./package.model");
const UserSubscription = require("./userSubscription.model");
const TemplateProject = require("./templateProject.model");
const BusinessTemplate = require("./businessTemplate.model");
const ApiKey = require("./apiKey.model");
const StaffService = require("./staffService.model");

const BusinessClosure = require("./businessClosure.model");
const StaffLeave = require("./staffLeave.model");
const ServiceType = require("./serviceType.model");
const ServiceTypeMapping = require("./serviceTypeMapping.model");

// Staff <-> Business (Many-to-One)
Staff.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Staff, { foreignKey: 'business_id' });

// Location <-> Business (Many-to-One)
Location.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Location, { foreignKey: 'business_id' });

// Staff <-> Location (Many-to-Many)
Staff.belongsToMany(Location, { through: StaffLocation, foreignKey: 'staff_id', as: 'locations' });
Location.belongsToMany(Staff, { through: StaffLocation, foreignKey: 'location_id' });

// Service <-> Business (Many-to-One)
Service.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Service, { foreignKey: 'business_id' });

// ServiceType <-> Business (Many-to-One)
ServiceType.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(ServiceType, { foreignKey: 'business_id' });

// Service <-> ServiceType (Many-to-Many)
Service.belongsToMany(ServiceType, { through: ServiceTypeMapping, foreignKey: 'service_id', otherKey: 'service_type_id', as: 'serviceTypes' });
ServiceType.belongsToMany(Service, { through: ServiceTypeMapping, foreignKey: 'service_type_id', otherKey: 'service_id', as: 'services' });

// Service <-> Location (Many-to-Many)
Service.belongsToMany(Location, { through: ServiceLocation, foreignKey: 'service_id', as: 'locations' });
Location.belongsToMany(Service, { through: ServiceLocation, foreignKey: 'location_id' });

// Staff <-> Availability (One-to-Many)
Staff.hasMany(StaffAvailability, { foreignKey: 'staff_id', as: 'availabilities' });
StaffAvailability.belongsTo(Staff, { foreignKey: 'staff_id' });

// Availability <-> Location (Many-to-One)
StaffAvailability.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

// Business <-> User (Many-to-One) - Owner Relationship
Business.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
User.hasMany(Business, { foreignKey: 'user_id' });

// Booking <-> Business (Many-to-One)
Booking.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Booking, { foreignKey: 'business_id' });

// Booking <-> Payment (One-to-Many)
Booking.hasMany(Payment, { foreignKey: 'booking_id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });

// Customer <-> Business (Many-to-One)
Customer.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Customer, { foreignKey: 'business_id' });

// Booking <-> Customer (Many-to-One)
Booking.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Booking, { foreignKey: 'customer_id' });

// Booking <-> Service (Many-to-Many through BookingService)
Booking.belongsToMany(Service, { through: BookingService, foreignKey: 'booking_id', as: 'services' });
Service.belongsToMany(Booking, { through: BookingService, foreignKey: 'service_id' });

// Keep the old relationship for backward compatibility if needed, but the primary one is now the junction
Booking.belongsTo(Service, { foreignKey: 'service_id' });
Service.hasMany(Booking, { foreignKey: 'service_id' });

Booking.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });
Staff.hasMany(Booking, { foreignKey: 'staff_id' });

Location.hasMany(Booking, { foreignKey: 'location_id' });
Booking.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

// User <-> Package (Many-to-One)
User.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
Package.hasMany(User, { foreignKey: 'package_id' });

// User <-> UserSubscription (One-to-Many)
User.hasMany(UserSubscription, { foreignKey: 'user_id', as: 'subscriptions' });
UserSubscription.belongsTo(User, { foreignKey: 'user_id' });

// UserSubscription <-> Package (Many-to-One)
UserSubscription.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// Business <-> BusinessClosure (One-to-Many)
Business.hasMany(BusinessClosure, { foreignKey: 'business_id', as: 'closures' });
BusinessClosure.belongsTo(Business, { foreignKey: 'business_id' });

// Staff <-> StaffLeave (One-to-Many)
Staff.hasMany(StaffLeave, { foreignKey: 'staff_id', as: 'leaves' });
StaffLeave.belongsTo(Staff, { foreignKey: 'staff_id' });

// Business <-> StaffLeave (One-to-Many)
Business.hasMany(StaffLeave, { foreignKey: 'business_id', as: 'staffLeaves' });
StaffLeave.belongsTo(Business, { foreignKey: 'business_id' });

module.exports = { 
    Staff, Location, StaffLocation, StaffAvailability, 
    Business, Service, ServiceLocation, User, Booking, Payment, Customer, BookingService,
    Package, UserSubscription, TemplateProject, BusinessTemplate, ApiKey, StaffService,
    BusinessClosure, StaffLeave, ServiceType, ServiceTypeMapping
};

