class ApiConstants {
  // static const String baseUrl =
  //     'https://silverapi.allysoftsolutions.com/mybookings';
  // Update with your server IP if testing on physical device

  static const String baseUrl = 'http://192.168.1.6:3000/mybookings';

  // Auth
  static const String login = '/users/login';
  static const String googleLogin = '/auth/google';
  static const String register = '/users/register';
  static const String profile = '/users/update';

  // Business
  static const String myBusinesses = '/business/all';
  static const String businessDetails = '/business'; // + /:id

  // Bookings
  static const String bookings = '/bookings/all';
  static const String createBooking = '/bookings/create';
  static const String updateBooking = '/bookings/update'; // + /:id

  // Stats
  static const String dashboardStats = '/business/stats';

  // Staff
  static const String staff = '/staff/all';

  // Services
  static const String services = '/services/all';
}
