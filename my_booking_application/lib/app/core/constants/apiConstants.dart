class ApiConstants {
  // static const String baseUrl =
  //     'https://silverapi.allysoftsolutions.com/mybookings';
  // Update with your server IP if testing on physical device

  static const String baseUrl = 'http://192.168.1.5:3000/mybookings';

  // Auth
  static const String login = '/users/login';
  static const String googleLogin = '/auth/google';
  static const String register = '/users/register';
  static const String profile = '/users/update';
  static const String forgotPassword = '/users/forgot-password';
  static const String verifyResetOtp = '/users/verify-reset-otp';
  static const String resetPassword = '/users/reset-password';

  // Business
  static const String myBusinesses = '/business/all';
  static const String businessDetails = '/business'; // + /:id

  // Bookings
  static const String bookings = '/bookings/all';
  static const String createBooking = '/bookings/create';
  static const String updateBooking = '/bookings/update'; // + /:id
  static const String deleteBooking = '/bookings/delete'; // + /:id

  // Stats
  static const String dashboardStats = '/business/stats';

  // Staff
  static const String staff = '/staff/all';
  static const String createStaff = '/staff/create';
  static const String updateStaff = '/staff/update'; // + /:id
  static const String deleteStaff = '/staff/delete'; // + /:id

  // Staff Services
  static const String staffServices = '/staff-services/all';
  static const String createStaffService = '/staff-services/create';
  static const String deleteStaffService = '/staff-services/delete'; // + /:id

  // Services
  static const String services = '/services/all';
  static const String createService = '/services/create';
  static const String updateService = '/services/update'; // + /:id
  static const String deleteService = '/services/delete'; // + /:id

  // Locations
  static const String locations = '/locations/all';

  // Customers
  static const String customers = '/customers/all';

  // Staff Availability
  static const String staffAvailability = '/staff-availability/all';
  static const String bulkCreateStaffAvailability = '/staff-availability/bulk-create';
  static const String deleteStaffAvailabilityByStaff = '/staff-availability/delete-by-staff'; // + /:staff_id

  // Staff Leaves & Business Closures
  static const String staffLeaves = '/staff-leaves/all';
  static const String createStaffLeave = '/staff-leaves/create';
  static const String updateStaffLeave = '/staff-leaves/update'; // + /:id
  static const String deleteStaffLeave = '/staff-leaves/delete'; // + /:id
  static const String businessClosures = '/business-closures/all';

  // Payments & Razorpay
  static const String createPayment = '/payments/create';
  static const String createRazorpayOrder = '/payments/razorpay/order';
  static const String verifyRazorpayPayment = '/payments/razorpay/verify';
}
