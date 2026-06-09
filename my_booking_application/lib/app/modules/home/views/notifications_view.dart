import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/services/notification_service.dart';
import '../../../shared/widgets/customAppBar.dart';

class NotificationsView extends StatelessWidget {
  const NotificationsView({super.key});

  @override
  Widget build(BuildContext context) {
    final notifService = Get.find<NotificationService>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: CustomAppBar(
        title: 'Notifications',
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: AppColors.primary),
            onPressed: () => notifService.markAllAsRead(),
            tooltip: 'Mark all as read',
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.error),
            onPressed: () => notifService.clearAll(),
            tooltip: 'Clear all',
          ),
        ],
      ),
      body: Obx(() {
        if (notifService.notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.notifications_off_outlined, size: 64, color: AppColors.lavender400.withOpacity(0.5)),
                const SizedBox(height: 16),
                Text(
                  'No notifications yet',
                  style: TextStyle(
                    fontSize: 18, 
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: notifService.notifications.length,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final notification = notifService.notifications[index];
            return GestureDetector(
              onTap: () => notifService.markAsRead(notification.id!),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: notification.isRead 
                      ? (isDark ? AppColors.surfaceDark : Colors.white)
                      : (isDark ? AppColors.navy800 : AppColors.violet50),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: notification.isRead 
                        ? (isDark ? Colors.white10 : AppColors.borderLight)
                        : AppColors.primary.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _getTypeColor(notification.type).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _getTypeIcon(notification.type),
                        color: _getTypeColor(notification.type),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  notification.title ?? '',
                                  style: TextStyle(
                                    fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w800,
                                    fontSize: 15,
                                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                  ),
                                ),
                              ),
                              if (!notification.isRead)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            notification.body ?? '',
                            style: TextStyle(
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            notification.createdAt != null 
                                ? DateFormat('jm').format(notification.createdAt!) + ' • ' + DateFormat('d MMM').format(notification.createdAt!)
                                : '',
                            style: TextStyle(color: AppColors.lavender400, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      }),
    );
  }

  IconData _getTypeIcon(String? type) {
    switch (type) {
      case 'new_booking': return Icons.event_available_rounded;
      case 'booking_cancelled': return Icons.event_busy_rounded;
      default: return Icons.notifications_active_outlined;
    }
  }

  Color _getTypeColor(String? type) {
    switch (type) {
      case 'new_booking': return AppColors.success;
      case 'booking_cancelled': return AppColors.error;
      default: return AppColors.primary;
    }
  }
}
