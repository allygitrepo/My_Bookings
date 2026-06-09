import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../core/constants/appColors.dart';
import '../shared/widgets/customHomeAppBar.dart';
import '../shared/widgets/customBottomNav.dart';
import '../shared/widgets/customDialogue.dart';
import '../data/services/auth_service.dart';
import 'home/views/notifications_view.dart';
import 'main_controller.dart';

class MainLayout extends GetView<MainController> {
  const MainLayout({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();
    
    return Obx(
      () => Scaffold(
        extendBody: true,
        backgroundColor: Theme.of(context).brightness == Brightness.dark 
            ? AppColors.backgroundDark 
            : AppColors.backgroundLight,
        appBar: CustomHomeAppBar(
          ownerName: authService.user?.name ?? 'Owner',
          profilePicture: authService.user?.profilePicture,
          onNotificationTap: () => Get.to(() => const NotificationsView()),
          onLogoutTap: () {
            CustomDialogue.show(
              title: 'Logout',
              description: 'Are you sure you want to logout from the application?',
              confirmText: 'Logout',
              confirmColor: Colors.redAccent,
              icon: Icons.logout_rounded,
              onConfirm: () => authService.logout(),
            );
          },
        ),
        body: IndexedStack(
          index: controller.currentIndex.value,
          children: controller.pages,
        ),
        bottomNavigationBar: CustomBottomNavBar(
          selectedIndex: controller.currentIndex.value,
          onTap: controller.changePage,
        ),
      ),
    );
  }
}
