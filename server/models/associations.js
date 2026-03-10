const Staff = require("./staff.model");
const Location = require("./location.model");
const StaffLocation = require("./staffLocation.model");
const StaffAvailability = require("./staffAvailability.model");
const Business = require("./business.model");

// Staff <-> Business (Many-to-One)
Staff.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Staff, { foreignKey: 'business_id' });

// Location <-> Business (Many-to-One)
Location.belongsTo(Business, { foreignKey: 'business_id' });
Business.hasMany(Location, { foreignKey: 'business_id' });

// Staff <-> Location (Many-to-Many)
Staff.belongsToMany(Location, { through: StaffLocation, foreignKey: 'staff_id', as: 'locations' });
Location.belongsToMany(Staff, { through: StaffLocation, foreignKey: 'location_id' });

// Staff <-> Availability (One-to-Many)
Staff.hasMany(StaffAvailability, { foreignKey: 'staff_id', as: 'availabilities' });
StaffAvailability.belongsTo(Staff, { foreignKey: 'staff_id' });

// Availability <-> Location (Many-to-One)
StaffAvailability.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

module.exports = { Staff, Location, StaffLocation, StaffAvailability, Business };
