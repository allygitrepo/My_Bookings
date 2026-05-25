part of 'appPages.dart';

abstract class Routes {
  Routes._();
  static const INITIAL = _Paths.SPLASH;
  static const SPLASH = _Paths.SPLASH;
  static const LOGIN = _Paths.LOGIN;
  static const HOME = _Paths.HOME;
  static const BOOKINGS = _Paths.BOOKINGS;
  static const STAFF = _Paths.STAFF;
  static const SERVICES = _Paths.SERVICES;
  static const CUSTOMERS = _Paths.CUSTOMERS;
  static const SETTINGS = _Paths.SETTINGS;
}

abstract class _Paths {
  _Paths._();
  static const SPLASH = '/splash';
  static const LOGIN = '/login';
  static const HOME = '/home';
  static const BOOKINGS = '/bookings';
  static const STAFF = '/staff';
  static const SERVICES = '/services';
  static const CUSTOMERS = '/customers';
  static const SETTINGS = '/settings';
}
