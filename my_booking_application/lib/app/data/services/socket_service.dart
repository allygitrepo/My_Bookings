import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:get/get.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../models/notification_model.dart';
import '../models/booking_model.dart';
import '../../modules/bookings/controllers/bookings_controller.dart';
import '../../modules/home/controllers/home_controller.dart';
import '../../core/constants/apiConstants.dart';
import 'fcm_service.dart';

class SocketService extends GetxService {
  late IO.Socket socket;
  final _authService = Get.find<AuthService>();
  final _notificationService = Get.find<NotificationService>();

  Future<SocketService> init() async {
    _initializeSocket();
    return this;
  }

  void _initializeSocket() {
    // Correctly extract the root server URL (e.g., http://192.168.1.9:3000)
    Uri uri = Uri.parse(ApiConstants.baseUrl);
    String socketUrl = '${uri.scheme}://${uri.host}:${uri.port}';

    print('Connecting to Socket at: $socketUrl');

    socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.onConnect((_) {
      print('Socket connected: ${socket.id}');
      _joinBusinessRoom();
    });

    socket.on('bookingCreated', (data) {
      print('New Booking Received: $data');
      _handleNewBooking(data);
    });

    socket.on('bookingUpdated', (data) {
      print('Booking Updated: $data');
      _handleBookingUpdate(data);
    });

    socket.onDisconnect((_) => print('Socket disconnected'));

    // Connect if already logged in
    if (_authService.isLogged) {
      connect();
    }
  }

  void connect() {
    if (!socket.connected) {
      socket.connect();
    }
  }

  void disconnect() {
    socket.disconnect();
  }

  void _joinBusinessRoom() {
    final businessId = _authService.user?.businessId;
    if (businessId != null) {
      socket.emit('join_business', businessId);
      print('Joined business room: business_$businessId');
    }
  }

  void _handleNewBooking(dynamic data) {
    try {
      final booking = BookingModel.fromJson(data);
      final String clientName = booking.customerName ?? 'A Client';
      final String bookingId = booking.id?.toString() ?? 'N/A';
      final String formattedTime = booking.formattedStartTime;

      final bool isConfirmed = booking.status?.toLowerCase() == 'confirmed' || (booking.paidAmount != null && booking.paidAmount! > 0);
      final String type = isConfirmed ? 'booking_confirmed' : 'new_booking';

      // Prevent duplicates if already handled by FCM
      if (bookingId != 'N/A' && bookingId.isNotEmpty) {
        final cacheKey = '${bookingId}_$type';
        if (FCMService.processedBookings.contains(cacheKey)) {
          print('Socket: Suppressing duplicate notification for booking: $bookingId');
          // Still update bookings list to keep UI correct
          if (Get.isRegistered<BookingsController>()) {
            Get.find<BookingsController>().addBooking(booking);
          }
          return;
        }
        FCMService.processedBookings.add(cacheKey);
        if (FCMService.processedBookings.length > 100) {
          FCMService.processedBookings.remove(FCMService.processedBookings.first);
        }
      }

      final String notifTitle = isConfirmed ? 'Booking Confirmed! 💰' : 'New Booking Alert! 📅';
      final String notifBody = isConfirmed
          ? '$clientName has paid and confirmed their booking of ${booking.serviceName} (#$bookingId).'
          : '$clientName has booked a slot for ${booking.serviceName} at ${booking.formattedStartTime} (#$bookingId).';

      // 1. Update Notification Service
      final newNotif = NotificationModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: notifTitle,
        body: notifBody,
        createdAt: DateTime.now(),
        bookingId: bookingId,
        type: isConfirmed ? 'booking_confirmed' : 'new_booking',
        isRead: false,
      );
      _notificationService.addNotification(newNotif);

      // 2. Update Bookings List if the controller is active
      if (Get.isRegistered<BookingsController>()) {
        Get.find<BookingsController>().addBooking(booking);
      }

      // 3. Update Dashboard Stats if the controller is active
      if (Get.isRegistered<HomeController>()) {
        Get.find<HomeController>().refreshData();
      }

      // 4. Show a global snackbar
      Get.snackbar(
        isConfirmed ? 'Booking Confirmed' : 'New Booking',
        isConfirmed
            ? '$clientName paid ₹${booking.paidAmount?.toStringAsFixed(2) ?? '0.00'} for ${booking.serviceName}!'
            : '$clientName booked ${booking.serviceName} at $formattedTime!',
        snackPosition: SnackPosition.TOP,
        backgroundColor: isConfirmed ? Colors.green : Get.theme.primaryColor,
        colorText: Colors.white,
        duration: const Duration(seconds: 5),
      );
    } catch (e) {
      print('Error handling new booking via socket: $e');
    }
  }

  void _handleBookingUpdate(dynamic data) {
    try {
      final booking = BookingModel.fromJson(data);

      if (Get.isRegistered<BookingsController>()) {
        Get.find<BookingsController>().updateBooking(booking);
      }

      if (Get.isRegistered<HomeController>()) {
        Get.find<HomeController>().refreshData();
      }

      // Add local notification if booking payment is confirmed
      final bool isConfirmed = booking.status?.toLowerCase() == 'confirmed';
      if (isConfirmed && booking.paidAmount != null && booking.paidAmount! > 0) {
        final String bookingId = booking.id?.toString() ?? 'N/A';

        // Prevent duplicate notification if already handled by socket/FCM
        if (bookingId != 'N/A' && bookingId.isNotEmpty) {
          final cacheKey = '${bookingId}_booking_confirmed';
          if (FCMService.processedBookings.contains(cacheKey)) {
            print('SocketUpdate: Suppressing duplicate notification for booking: $bookingId');
            return;
          }
          FCMService.processedBookings.add(cacheKey);
          if (FCMService.processedBookings.length > 100) {
            FCMService.processedBookings.remove(FCMService.processedBookings.first);
          }
        }

        final String clientName = booking.customerName ?? 'A Client';

        final newNotif = NotificationModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: 'Booking Confirmed! 💰',
          body: '$clientName has paid and confirmed their booking of ${booking.serviceName} (#$bookingId).',
          createdAt: DateTime.now(),
          bookingId: bookingId,
          type: 'booking_confirmed',
          isRead: false,
        );
        _notificationService.addNotification(newNotif);

        // Show a global snackbar in the app
        Get.snackbar(
          'Booking Confirmed',
          '$clientName paid ₹${booking.paidAmount?.toStringAsFixed(2) ?? '0.00'} for ${booking.serviceName}!',
          snackPosition: SnackPosition.TOP,
          backgroundColor: Colors.green,
          colorText: Colors.white,
          duration: const Duration(seconds: 5),
        );
      }
    } catch (e) {
      print('Error handling booking update via socket: $e');
    }
  }
}
