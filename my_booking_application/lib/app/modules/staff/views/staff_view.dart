import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/staff_model.dart';
import '../controllers/staff_controller.dart';

class StaffView extends GetView<StaffController> {
  const StaffView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (controller.isLoading.value && controller.staffList.isEmpty) {
        return const Center(child: CircularProgressIndicator());
      }
      
      if (controller.staffList.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.people_outline_rounded, size: 64, color: AppColors.primary.withOpacity(0.5)),
              const SizedBox(height: 16),
              const Text(
                'No staff members found',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Staff for your organization will appear here.',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        );
      }

      return ListView.builder(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
        itemCount: controller.staffList.length,
        itemBuilder: (context, index) {
          final staff = controller.staffList[index];
          return _buildStaffCard(context, staff);
        },
      );
    });
  }

  Widget _buildStaffCard(BuildContext context, StaffModel staff) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.navy300 : AppColors.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: isDark ? Border.all(color: Colors.white10, width: 1) : null,
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 25,
            backgroundColor: primaryColor.withOpacity(0.1),
            backgroundImage: (staff.photo != null && staff.photo!.isNotEmpty)
                ? MemoryImage(base64Decode(staff.photo!.contains(',') 
                    ? staff.photo!.split(',').last 
                    : staff.photo!))
                : null,
            child: (staff.photo == null || staff.photo!.isEmpty)
                ? Text(
                    staff.staffName?.substring(0, 1).toUpperCase() ?? 'S',
                    style: TextStyle(
                      color: primaryColor, 
                      fontWeight: FontWeight.bold
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  staff.staffName ?? 'Unknown',
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    fontSize: 16,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                Text(
                  staff.role ?? 'No Role',
                  style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
