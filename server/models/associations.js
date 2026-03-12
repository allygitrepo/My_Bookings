const Staff = require("./staff.model");
const Location = require("./location.model");
const StaffLocation = require("./staffLocation.model");
const StaffAvailability = require("./staffAvailability.model");
const Business = require("./business.model");
const Service = require("./service.model");
const ServiceLocation = require("./serviceLocation.model");

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

// Service <-> Location (Many-to-Many)
Service.belongsToMany(Location, { through: ServiceLocation, foreignKey: 'service_id', as: 'locations' });
Location.belongsToMany(Service, { through: ServiceLocation, foreignKey: 'location_id' });

// Staff <-> Availability (One-to-Many)
Staff.hasMany(StaffAvailability, { foreignKey: 'staff_id', as: 'availabilities' });
StaffAvailability.belongsTo(Staff, { foreignKey: 'staff_id' });

// Availability <-> Location (Many-to-One)
StaffAvailability.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

module.exports = { Staff, Location, StaffLocation, StaffAvailability, Business, Service, ServiceLocation };
