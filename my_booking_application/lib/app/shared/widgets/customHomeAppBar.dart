import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../data/services/notification_service.dart';
import 'package:get/get.dart';

class CustomHomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String ownerName;
  final String? profilePicture;
  final VoidCallback onNotificationTap;
  final VoidCallback onLogoutTap;

  const CustomHomeAppBar({
    super.key,
    required this.ownerName,
    this.profilePicture,
    required this.onNotificationTap,
    required this.onLogoutTap,
  });

  @override
  Widget build(BuildContext context) {
    const primaryPurple = Color(0xFF3B32B4);
    final glassWhite = Colors.white.withOpacity(0.15);

    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 10,
        left: 20,
        right: 20,
        bottom: 20,
      ),
      decoration: const BoxDecoration(
        color: primaryPurple,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── TOP ROW: Branding & Actions ──
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'My Bookings',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  fontFamily: 'Syne',
                ),
              ),
              Row(
                children: [
                  Obx(() {
                    final notifService = Get.find<NotificationService>();
                    final count = notifService.unreadCount.value;
                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        _buildCircleAction(Icons.notifications_none_rounded, onNotificationTap, glassWhite),
                        if (count > 0)
                          Positioned(
                            right: -2,
                            top: -2,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                              child: Text(
                                '$count',
                                style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    );
                  }),
                  const SizedBox(width: 12),
                  _buildCircleAction(Icons.logout_rounded, onLogoutTap, glassWhite, iconColor: Colors.redAccent),
                ],
              ),
            ],
          ),
          const Spacer(),

          // ── MIDDLE ROW: Profile & Welcome ──
          Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFF8E2DE2), Color(0xFF4A00E0)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(27),
                  child: _buildProfileImage(),
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14),
                  ),
                  Text(
                    'Hello, $ownerName 👋',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Syne',
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Spacer(),

          // ── BOTTOM ROW: Date Pill ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: glassWhite,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 10),
                Text(
                  DateFormat('EEEE, d MMM yyyy').format(DateTime.now()),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Today',
                    style: TextStyle(color: primaryPurple, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleAction(IconData icon, VoidCallback tap, Color bg, {Color iconColor = Colors.white}) {
    return GestureDetector(
      onTap: tap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
        child: Icon(icon, color: iconColor, size: 22),
      ),
    );
  }

  Widget _buildProfileImage() {
    if (profilePicture != null && profilePicture!.isNotEmpty) {
      try {
        // Clean the base64 string if it contains data URI prefix
        String cleanBase64 = profilePicture!;
        if (cleanBase64.contains(',')) {
          cleanBase64 = cleanBase64.split(',').last;
        }
        
        return Image.memory(
          base64Decode(cleanBase64),
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _buildLetterAvatar(),
        );
      } catch (e) {
        return _buildLetterAvatar();
      }
    }
    return _buildLetterAvatar();
  }

  Widget _buildLetterAvatar() {
    return Center(
      child: Text(
        ownerName.isNotEmpty ? ownerName[0].toUpperCase() : 'U',
        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(200);
}
