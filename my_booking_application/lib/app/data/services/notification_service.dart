import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import '../models/notification_model.dart';

class NotificationService extends GetxService {
  final _storage = GetStorage();
  final notifications = <NotificationModel>[].obs;
  final unreadCount = 0.obs;

  Future<NotificationService> init() async {
    _loadNotifications();
    return this;
  }

  void _loadNotifications() {
    final List<dynamic>? stored = _storage.read('notifications');
    if (stored != null) {
      notifications.assignAll(stored.map((n) => NotificationModel.fromJson(n)).toList());
      _updateUnreadCount();
    }
  }

  void addNotification(NotificationModel notification) {
    notifications.insert(0, notification);
    _saveNotifications();
    _updateUnreadCount();
  }

  void markAsRead(String id) {
    final index = notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      notifications[index] = notifications[index].copyWith(isRead: true);
      _saveNotifications();
      _updateUnreadCount();
    }
  }

  void markAllAsRead() {
    for (var i = 0; i < notifications.length; i++) {
      notifications[i] = notifications[i].copyWith(isRead: true);
    }
    _saveNotifications();
    _updateUnreadCount();
  }

  void clearAll() {
    notifications.clear();
    _saveNotifications();
    _updateUnreadCount();
  }

  void _saveNotifications() {
    _storage.write('notifications', notifications.map((n) => n.toJson()).toList());
  }

  void _updateUnreadCount() {
    unreadCount.value = notifications.where((n) => !n.isRead).length;
  }

  // ── Helper: Simulate a new booking notification ──
  void simulateNewBooking(String clientName, String staffName, String time, String bookingId) {
    final newNotif = NotificationModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: 'New Booking Alert',
      body: '$clientName has booked a slot of $staffName at $time',
      createdAt: DateTime.now(),
      bookingId: bookingId,
      type: 'new_booking',
      isRead: false,
    );
    addNotification(newNotif);
  }
}
