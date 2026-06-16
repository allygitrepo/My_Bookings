import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';

class BookingsController extends GetxController {
  final isLoading = false.obs;
  final bookings = <BookingModel>[].obs;
  
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
      Get.snackbar('Error', 'Failed to fetch bookings');
    } finally {
      isLoading.value = false;
    }
  }

  void sortBookings() {
    bookings.sort((a, b) {
      if (a.bookingDate == null && b.bookingDate == null) return 0;
      if (a.bookingDate == null) return 1;
      if (b.bookingDate == null) return -1;
      
      int dateCompare = a.bookingDate!.compareTo(b.bookingDate!);
      if (dateCompare != 0) return dateCompare;
      
      if (a.startTime == null && b.startTime == null) return 0;
      if (a.startTime == null) return 1;
      if (b.startTime == null) return -1;
      
      return a.startTime!.compareTo(b.startTime!);
    });
  }

  List<BookingModel> get filteredBookings {
    if (selectedStatus.value == 'all') return bookings;
    return bookings.where((b) => b.status?.toLowerCase() == selectedStatus.value).toList();
  }

  Future<void> updateBookingStatus(int id, String status) async {
    try {
      final response = await _apiClient.put('${ApiConstants.updateBooking}/$id', data: {
        'status': status,
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
