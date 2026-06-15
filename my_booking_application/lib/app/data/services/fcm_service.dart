import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:my_booking_application/app/data/services/auth_service.dart';
import '../services/api_client.dart';
import 'notification_service.dart';
import '../models/notification_model.dart';

class FCMService extends GetxService {
  late FirebaseMessaging _messaging;
  late FlutterLocalNotificationsPlugin _localNotifications;
  late NotificationService _notificationService;

  Future<FCMService> init() async {
    try {
      _messaging = FirebaseMessaging.instance;
      _localNotifications = FlutterLocalNotificationsPlugin();
      _notificationService = Get.find<NotificationService>();
      
      await _setupLocalNotifications();
      await _requestPermissions();
      _listenToMessages();
      
      // Get token for server registration
      String? token = await _messaging.getToken();
      if (token != null) {
        await saveTokenToServer(token);
      }
      print('FCM Token: $token');
    } catch (e) {
      print('Error initializing FCMService: $e');
    }
    
    return this;
  }

  Future<void> _setupLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    // Latest version (v21+) uses named parameter 'settings'
    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification click
      },
    );
  }

  Future<void> _requestPermissions() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  void _listenToMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _handleIncomingMessage(message, isForeground: true);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleIncomingMessage(message, isForeground: false);
    });
  }

  void _handleIncomingMessage(RemoteMessage message, {required bool isForeground}) {
    final notification = message.notification;
    final data = message.data;

    if (notification != null) {
      String formattedBody = _formatBodyWith12HourTime(notification.body ?? '');
      
      final newNotif = NotificationModel(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: notification.title,
        body: formattedBody,
        createdAt: DateTime.now(),
        bookingId: data['booking_id'],
        type: data['type'] ?? 'new_booking',
        isRead: false,
      );
      
      _notificationService.addNotification(newNotif);

      if (isForeground) {
        _showLocalNotification(notification, formattedBody);
      }
    }
  }

  String _formatBodyWith12HourTime(String body) {
    // Regex to find HH:mm:ss or HH:mm
    final timeRegex = RegExp(r'(\d{1,2}):(\d{2})(?::(\d{2}))?');
    return body.replaceAllMapped(timeRegex, (match) {
      try {
        int hour = int.parse(match.group(1)!);
        int minute = int.parse(match.group(2)!);
        
        final period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        if (hour == 0) hour = 12;
        
        final minuteStr = minute.toString().padLeft(2, '0');
        return '$hour:$minuteStr $period';
      } catch (e) {
        return match.group(0)!;
      }
    });
  }

  Future<void> _showLocalNotification(RemoteNotification notification, String body) async {
    const androidDetails = AndroidNotificationDetails(
      'booking_alerts',
      'New Booking Alert',
      channelDescription: 'Notifications for new and updated bookings',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );
    final details = NotificationDetails(android: androidDetails);

    // Latest version (v21+) uses named parameters for show()
    await _localNotifications.show(
      id: notification.hashCode,
      title: notification.title ?? 'New Notification',
      body: body,
      notificationDetails: details,
    );
  }

  Future<void> saveTokenToServer(String token) async {
    try {
      if (!Get.find<AuthService>().isLogged) return;
      
      final apiClient = Get.find<ApiClient>();
      await apiClient.put('/users/update-fcm-token', data: {'fcm_token': token});
      print('FCM Token saved to server successfully');
    } catch (e) {
      print('Error saving FCM Token to server: $e');
    }
  }
}
