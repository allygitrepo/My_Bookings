import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'home/views/home_view.dart';
import 'bookings/views/bookings_view.dart';
import 'staff/views/staff_view.dart';
import 'services/views/services_view.dart';

class MainController extends GetxController {
  final currentIndex = 0.obs;

  final List<Widget> pages = [
    const HomeView(),
    const BookingsView(),
    const StaffView(),
    const ServicesView(),
  ];

  final List<String> titles = [
    'Dashboard',
    'My Bookings',
    'Our Staff',
    'Our Services',
  ];

  void changePage(int index) {
    if (index == -1) {
      // onPlusButtonPressed();
      return;
    }
    currentIndex.value = index;
  }

  String get currentTitle => titles[currentIndex.value];

  /*
  void onPlusButtonPressed() {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Get.theme.scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Text(
              'Quick Actions',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildQuickActionItem(
                  icon: Icons.calendar_today_rounded,
                  label: 'Booking',
                  color: Colors.blue,
                  onTap: () {
                    Get.back();
                    Get.snackbar('Coming Soon', 'New Booking form is under development');
                  },
                ),
                _buildQuickActionItem(
                  icon: Icons.person_add_rounded,
                  label: 'Add Staff',
                  color: Colors.orange,
                  onTap: () {
                    Get.back();
                    Get.snackbar('Coming Soon', 'Add Staff form is under development');
                  },
                ),
                _buildQuickActionItem(
                  icon: Icons.add_task_rounded,
                  label: 'Add Service',
                  color: Colors.green,
                  onTap: () {
                    Get.back();
                    Get.snackbar('Coming Soon', 'Add Service form is under development');
                  },
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
      isScrollControlled: true,
    );
  }

  Widget _buildQuickActionItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
  */
}
