import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/models/customer_model.dart';
import '../../../data/models/location_model.dart';
import '../../../data/models/service_model.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/models/staff_availability_model.dart';
import '../../../data/models/staff_leave_model.dart';
import '../../../data/models/business_closure_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';

class BookingsController extends GetxController {
  final isLoading = false.obs;
  final isFormLoading = false.obs;
  final isSubmitting = false.obs;
  
  final bookings = <BookingModel>[].obs;
  
  // Form Dropdown Data
  final customersList = <CustomerModel>[].obs;
  final locationsList = <LocationModel>[].obs;
  final servicesList = <ServiceModel>[].obs;
  final staffList = <StaffModel>[].obs;
  final staffServicesList = <Map<String, dynamic>>[].obs;
  final availabilityList = <StaffAvailabilityModel>[].obs;
  final staffLeavesList = <StaffLeaveModel>[].obs;
  final businessClosuresList = <BusinessClosureModel>[].obs;

  // Filter
  final selectedStatus = 'all'.obs;

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    fetchBookings();
  }

  Future<void> fetchBookings() async {
    try {
      isLoading.value = true;
      final response = await _apiClient.get(ApiConstants.bookings);
      
      if (response.data['success'] == true) {
        final List bookingsJson = response.data['data'] ?? [];
        bookings.value = bookingsJson.map((j) => BookingModel.fromJson(j)).toList();
        sortBookings();
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to fetch bookings',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchFormDropdownData() async {
    try {
      isFormLoading.value = true;
      
      // Fetch customers, locations, services, staff, availability, staff leaves, closures, and staff-services mapping
      final results = await Future.wait([
        _apiClient.get(ApiConstants.customers).catchError((_) => null),
        _apiClient.get(ApiConstants.locations).catchError((_) => null),
        _apiClient.get(ApiConstants.services).catchError((_) => null),
        _apiClient.get(ApiConstants.staff).catchError((_) => null),
        _apiClient.get(ApiConstants.staffAvailability).catchError((_) => null),
        _apiClient.get(ApiConstants.staffLeaves).catchError((_) => null),
        _apiClient.get(ApiConstants.businessClosures).catchError((_) => null),
        _apiClient.get(ApiConstants.staffServices).catchError((_) => null),
      ]);

      // Customers
      if (results[0] != null && results[0]!.data['success'] == true) {
        final List list = results[0]!.data['data'] ?? [];
        customersList.value = list.map((j) => CustomerModel.fromJson(j)).toList();
      }

      // Locations
      if (results[1] != null && results[1]!.data['success'] == true) {
        final List list = results[1]!.data['data'] ?? [];
        locationsList.value = list.map((j) => LocationModel.fromJson(j)).toList();
      }

      // Services
      if (results[2] != null && results[2]!.data['success'] == true) {
        final List list = results[2]!.data['data'] ?? [];
        servicesList.value = list.map((j) => ServiceModel.fromJson(j)).toList();
      }

      // Staff-Services Mapping
      if (results[7] != null && results[7]!.data['success'] == true) {
        final List list = results[7]!.data['data'] ?? [];
        staffServicesList.value = list.map((j) => Map<String, dynamic>.from(j)).toList();
      }

      // Staff
      if (results[3] != null && results[3]!.data['success'] == true) {
        final List list = results[3]!.data['data'] ?? [];
        final parsedStaff = list.map((j) => StaffModel.fromJson(j)).toList();

        // Populate staff service IDs with safe int parsing
        for (var staff in parsedStaff) {
          if (staff.id != null) {
            staff.serviceIds = staffServicesList
                .where((ss) => ss['staff_id'] != null && int.tryParse(ss['staff_id'].toString()) == staff.id)
                .map((ss) => int.tryParse(ss['service_id']?.toString() ?? '0') ?? 0)
                .where((id) => id > 0)
                .toList();
          }
        }
        staffList.value = parsedStaff;
      }

      // Availability
      if (results[4] != null && results[4]!.data['success'] == true) {
        final List list = results[4]!.data['data'] ?? [];
        availabilityList.value = list.map((j) => StaffAvailabilityModel.fromJson(j)).toList();
      }

      // Staff Leaves
      if (results[5] != null && results[5]!.data['success'] == true) {
        final List list = results[5]!.data['data'] ?? [];
        staffLeavesList.value = list.map((j) => StaffLeaveModel.fromJson(j)).toList();
      }

      // Business Closures
      if (results[6] != null && results[6]!.data['success'] == true) {
        final List list = results[6]!.data['data'] ?? [];
        businessClosuresList.value = list.map((j) => BusinessClosureModel.fromJson(j)).toList();
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to load booking form options',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isFormLoading.value = false;
    }
  }

  Future<BookingModel?> createBooking({
    required bool isNewCustomer,
    int? customerId,
    String? newCustomerName,
    String? newCustomerPhone,
    String? newCustomerEmail,
    required int locationId,
    required List<int> serviceIds,
    required int staffId,
    required String bookingDate,
    required String startTime,
    required String endTime,
    required bool isPaid,
    String? paymentMethod,
    double? paidAmount,
    double? totalAmount,
    bool showSnackbar = true,
  }) async {
    try {
      isSubmitting.value = true;

      final Map<String, dynamic> payload = {
        'location_id': locationId,
        'service_ids': serviceIds,
        'service_id': serviceIds.isNotEmpty ? serviceIds.first : null,
        'staff_id': staffId,
        'booking_date': bookingDate,
        'start_time': startTime,
        'end_time': endTime,
        'payment_status': isPaid,
        'payment_method': paymentMethod ?? (isPaid ? 'Cash' : 'Pay at Venue / Cash'),
        'paid_amount': paidAmount ?? (isPaid ? (totalAmount ?? 0) : 0),
        'total_amount': totalAmount ?? 0,
        'skip_payment': isPaid,
        'booking_status': isPaid ? 'Confirmed' : 'Pending',
        'status': true,
      };

      if (isNewCustomer) {
        payload['name'] = newCustomerName;
        payload['phone'] = newCustomerPhone;
        if (newCustomerEmail != null && newCustomerEmail.isNotEmpty) {
          payload['email'] = newCustomerEmail;
        }
      } else {
        payload['customer_id'] = customerId;
      }

      final response = await _apiClient.post(ApiConstants.createBooking, data: payload);

      if (response.data['success'] == true && response.data['data'] != null) {
        final createdBooking = BookingModel.fromJson(response.data['data']);
        if (showSnackbar) {
          Get.snackbar(
            'Success',
            'Booking created successfully',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white,
          );
        }
        fetchBookings();
        return createdBooking;
      } else {
        if (showSnackbar) {
          Get.snackbar(
            'Booking Failed',
            response.data['message'] ?? 'Unable to create booking',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red,
            colorText: Colors.white,
          );
        }
        return null;
      }
    } catch (e) {
      if (showSnackbar) {
        Get.snackbar(
          'Error',
          'Failed to create booking. Please try again.',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      }
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  void sortBookings() {
    bookings.sort((a, b) {
      if (a.bookingDate == null && b.bookingDate == null) return 0;
      if (a.bookingDate == null) return 1;
      if (b.bookingDate == null) return -1;
      
      int dateCompare = b.bookingDate!.compareTo(a.bookingDate!);
      if (dateCompare != 0) return dateCompare;
      
      if (a.startTime == null && b.startTime == null) return 0;
      if (a.startTime == null) return 1;
      if (b.startTime == null) return -1;
      
      return b.startTime!.compareTo(a.startTime!);
    });
  }

  List<BookingModel> get filteredBookings {
    if (selectedStatus.value == 'all') return bookings;
    return bookings.where((b) => b.status?.toLowerCase() == selectedStatus.value).toList();
  }

  Future<void> updateBookingStatus(int id, String status) async {
    try {
      final response = await _apiClient.put('${ApiConstants.updateBooking}/$id', data: {
        'booking_status': status,
        'status': status.toLowerCase() != 'cancelled',
      });

      if (response.data['success'] == true) {
        final index = bookings.indexWhere((b) => b.id == id);
        if (index != -1) {
          bookings[index].status = status;
          bookings.refresh();
        }
        Get.snackbar('Success', 'Booking $status successfully',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white);
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to update booking status');
    }
  }

  Future<void> deleteBooking(int id, {bool showSnackbar = true}) async {
    try {
      isLoading.value = true;
      final response = await _apiClient.delete('${ApiConstants.deleteBooking}/$id');

      if (response.data['success'] == true) {
        bookings.removeWhere((b) => b.id == id);
        bookings.refresh();
        if (showSnackbar) {
          Get.snackbar('Success', 'Booking deleted successfully',
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.green,
              colorText: Colors.white);
        }
      } else {
        if (showSnackbar) {
          Get.snackbar('Error', response.data['message'] ?? 'Failed to delete booking');
        }
      }
    } catch (e) {
      if (showSnackbar) {
        Get.snackbar('Error', 'Failed to delete booking');
      }
    } finally {
      isLoading.value = false;
    }
  }

  void addBooking(BookingModel booking) {
    final index = bookings.indexWhere((b) => b.id == booking.id);
    if (index == -1) {
      bookings.add(booking);
    } else {
      bookings[index] = booking;
    }
    sortBookings();
    bookings.refresh();
  }

  void updateBooking(BookingModel booking) {
    final index = bookings.indexWhere((b) => b.id == booking.id);
    if (index != -1) {
      bookings[index] = booking;
      sortBookings();
      bookings.refresh();
    }
  }

  void setFilter(String status) => selectedStatus.value = status;
  
  void refreshData() => fetchBookings();
}
