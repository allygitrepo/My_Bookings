import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => controller.refreshData(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 110),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Theme-adaptive high contrast colors
    final todayColor = isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB);    // Bright Sky Blue vs Deep Blue
    final pendingColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);  // Bright Gold vs Deep Amber
    final totalColor = isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED);    // Bright Violet vs Deep Purple
    final revenueColor = isDark ? const Color(0xFF34D399) : const Color(0xFF059669);  // Bright Mint vs Deep Emerald

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
            icon: Icons.today_rounded,
            color: todayColor,
          ),
          _buildStatCard(
            context,
            title: 'Pending',
            value: controller.pendingBookingsCount.value.toString(),
            icon: Icons.pending_actions_rounded,
            color: pendingColor,
          ),
          _buildStatCard(
            context,
            title: 'Total',
            value: controller.overallBookingsCount.value.toString(),
            icon: Icons.calendar_month_rounded,
            color: totalColor,
          ),
          _buildStatCard(
            context,
            title: 'Revenue',
            value: '₹${controller.totalRevenue.value.toStringAsFixed(0)}',
            icon: Icons.account_balance_wallet_rounded,
            color: revenueColor,
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade200,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark 
                ? Colors.black.withOpacity(0.3) 
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
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(isDark ? 0.18 : 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppColors.navy900,
                  fontFamily: 'Syne',
                ),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
