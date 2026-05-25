import 'package:get/get.dart';
import 'main_controller.dart';
import 'home/controllers/home_controller.dart';
import 'bookings/controllers/bookings_controller.dart';
import 'staff/controllers/staff_controller.dart';
import 'services/controllers/services_controller.dart';

class MainBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainController>(() => MainController());
    Get.lazyPut<HomeController>(() => HomeController());
    Get.lazyPut<BookingsController>(() => BookingsController());
    Get.lazyPut<StaffController>(() => StaffController());
    Get.lazyPut<ServicesController>(() => ServicesController());
  }
}
