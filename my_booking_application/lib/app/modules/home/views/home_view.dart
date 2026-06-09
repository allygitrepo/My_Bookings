import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:my_booking_application/app/routes/appPages.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/services/auth_service.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();

    return RefreshIndicator(
      onRefresh: () async => controller.refreshData(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatsGrid(context),
          ],
        ),
      ),
    );
  }



  Widget _buildStatsGrid(BuildContext context) {
    return Obx(
      () => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.1,
        children: [
          _buildStatCard(
            context,
            title: 'Today',
            value: controller.todayBookingsCount.value.toString(),
            subtitle: 'Bookings',
            icon: Icons.today_rounded,
            color: AppColors.primary,
          ),
          _buildStatCard(
            context,
            title: 'Pending',
            value: controller.pendingBookingsCount.value.toString(),
            subtitle: 'Awaiting action',
            icon: Icons.pending_actions_rounded,
            color: AppColors.warning,
          ),
          _buildStatCard(
            context,
            title: 'Total',
            value: controller.overallBookingsCount.value.toString(),
            subtitle: 'Overall bookings',
            icon: Icons.calendar_month_rounded,
            color: AppColors.secondary,
          ),
          _buildStatCard(
            context,
            title: 'Revenue',
            value: '₹${controller.totalRevenue.value.toStringAsFixed(0)}',
            subtitle: 'Total earned',
            icon: Icons.account_balance_wallet_rounded,
            color: AppColors.success,
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Theme.of(context).brightness == Brightness.dark 
            ? Border.all(color: Colors.white10, width: 1) 
            : null,
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black26 
                : color.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.titleLarge?.color,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

}
