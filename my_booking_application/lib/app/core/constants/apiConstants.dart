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

  // Services
  static const String services = '/services/all';

  // Locations
  static const String locations = '/locations/all';

  // Customers
  static const String customers = '/customers/all';

  // Staff Availability
  static const String staffAvailability = '/staff-availability/all';

  // Staff Leaves & Business Closures
  static const String staffLeaves = '/staff-leaves/all';
  static const String businessClosures = '/business-closures/all';
}
