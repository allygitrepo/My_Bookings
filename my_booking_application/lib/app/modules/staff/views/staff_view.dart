import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/models/staff_leave_model.dart';
import '../controllers/staff_controller.dart';
import 'staff_forms.dart';
import 'staff_leave_form.dart';

class StaffView extends GetView<StaffController> {
  const StaffView({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.navy300 : AppColors.primary;

    return Column(
      children: [
        // --- SEGMENT CONTROL HEADER & ACTION BUTTON ---
        Padding(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 8),
          child: Obx(() {
            final isDirectory = controller.selectedSegment.value == 0;

            return Row(
              children: [
                Expanded(
                  child: Container(
                    height: 44,
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => controller.selectedSegment.value = 0,
                            borderRadius: BorderRadius.circular(9),
                            child: Container(
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: controller.selectedSegment.value == 0
                                    ? (isDark ? AppColors.primary : Colors.white)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(9),
                                boxShadow: controller.selectedSegment.value == 0 && !isDark
                                    ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4)]
                                    : null,
                              ),
                              child: Text(
                                'Staff Directory',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: controller.selectedSegment.value == 0
                                      ? (isDark ? Colors.white : AppColors.primary)
                                      : (isDark ? AppColors.lavender400 : Colors.grey.shade700),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: () => controller.selectedSegment.value = 1,
                            borderRadius: BorderRadius.circular(9),
                            child: Container(
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: controller.selectedSegment.value == 1
                                    ? (isDark ? AppColors.primary : Colors.white)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(9),
                                boxShadow: controller.selectedSegment.value == 1 && !isDark
                                    ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4)]
                                    : null,
                              ),
                              child: Text(
                                'Leave Records',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: controller.selectedSegment.value == 1
                                      ? (isDark ? Colors.white : AppColors.primary)
                                      : (isDark ? AppColors.lavender400 : Colors.grey.shade700),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Add Button (Staff or Leave based on segment)
                InkWell(
                  onTap: () {
                    if (isDirectory) {
                      StaffForm.show(context);
                    } else {
                      StaffLeaveForm.show(context);
                    }
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: primaryColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          isDirectory ? 'Add Staff' : 'Apply',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
        ),

        // --- SEGMENT CONTENT ---
        Expanded(
          child: Obx(() {
            if (controller.selectedSegment.value == 0) {
              return _buildStaffDirectory(context, isDark, primaryColor);
            } else {
              return _buildLeavesList(context, isDark, primaryColor);
            }
          }),
        ),
      ],
    );
  }

  // --- STAFF DIRECTORY CONTENT ---
  Widget _buildStaffDirectory(BuildContext context, bool isDark, Color primaryColor) {
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
              'Tap "+ Add Staff" to add team members and assign services.',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
      itemCount: controller.filteredStaff.length,
      itemBuilder: (context, index) {
        final staff = controller.filteredStaff[index];
        return _buildStaffCard(context, staff, isDark, primaryColor);
      },
    );
  }

  // --- LEAVE MANAGEMENT CONTENT ---
  Widget _buildLeavesList(BuildContext context, bool isDark, Color primaryColor) {
    if (controller.isLeavesLoading.value && controller.leavesList.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (controller.leavesList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_note_outlined, size: 64, color: primaryColor.withOpacity(0.5)),
            const SizedBox(height: 16),
            const Text(
              'No staff leaves recorded',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap "+ Apply" to record a new staff leave.',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
      itemCount: controller.leavesList.length,
      itemBuilder: (context, index) {
        final leave = controller.leavesList[index];
        return _buildLeaveCard(context, leave, isDark, primaryColor);
      },
    );
  }

  // --- STAFF CARD ---
  Widget _buildStaffCard(BuildContext context, StaffModel staff, bool isDark, Color primaryColor) {
    final assignedServices = controller.servicesList.where(
      (svc) => svc.id != null && (staff.serviceIds ?? []).contains(svc.id),
    ).toList();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: isDark ? Border.all(color: Colors.white10, width: 1) : Border.all(color: Colors.black.withOpacity(0.04)),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: primaryColor.withOpacity(0.15),
                backgroundImage: (staff.photo != null && staff.photo!.isNotEmpty)
                    ? MemoryImage(base64Decode(staff.photo!.contains(',') 
                        ? staff.photo!.split(',').last 
                        : staff.photo!))
                    : null,
                child: (staff.photo == null || staff.photo!.isEmpty)
                    ? Text(
                        staff.staffName != null && staff.staffName!.isNotEmpty
                            ? staff.staffName!.substring(0, 1).toUpperCase()
                            : 'S',
                        style: TextStyle(
                          color: primaryColor, 
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            staff.staffName ?? 'Staff Member',
                            style: TextStyle(
                              fontWeight: FontWeight.bold, 
                              fontSize: 15,
                              color: Theme.of(context).textTheme.titleMedium?.color,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            staff.role != null && staff.role!.isNotEmpty ? staff.role! : 'Staff',
                            style: TextStyle(
                              color: primaryColor,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (staff.phone != null && staff.phone!.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 10,
                        runSpacing: 4,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.phone_outlined, size: 12, color: isDark ? AppColors.lavender400 : Colors.grey[600]),
                              const SizedBox(width: 4),
                              Text(
                                staff.phone!,
                                style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 12),
                              ),
                            ],
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.schedule_rounded, size: 12, color: isDark ? AppColors.lavender400 : Colors.grey[600]),
                              const SizedBox(width: 4),
                              Text(
                                '${staff.slotDurationMinutes ?? 30} min slot',
                                style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 11),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // Edit & Delete Actions
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: () => StaffForm.show(context, staff: staff),
                    icon: Icon(Icons.edit_note_rounded, size: 20, color: isDark ? Colors.lightBlueAccent : AppColors.primary),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                  IconButton(
                    onPressed: () {
                      if (staff.id != null) {
                        _showDeleteConfirmDialog(context, staff.id!, staff.staffName ?? 'Staff');
                      }
                    },
                    icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                ],
              ),
            ],
          ),

          // --- ASSIGNED LOCATIONS & SERVICES CHIPS ---
          if (staff.locations != null && staff.locations!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: staff.locations!.map((loc) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade300),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.location_on_outlined, size: 10, color: isDark ? Colors.white70 : Colors.grey.shade700),
                      const SizedBox(width: 3),
                      Text(
                        loc.locationName ?? 'Location',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : Colors.grey.shade800,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],

          if (assignedServices.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: assignedServices.map((svc) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    svc.serviceName ?? 'Service',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: primaryColor,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],

          const SizedBox(height: 10),
          const Divider(height: 1),
          const SizedBox(height: 8),

          // --- AVAILABILITY DAYS & HOURS SECTION ---
          _buildAvailabilitySection(context, staff, isDark, primaryColor),
        ],
      ),
    );
  }

  void _showDeleteConfirmDialog(BuildContext context, int staffId, String staffName) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Get.dialog(
      AlertDialog(
        backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          'Delete Staff Member?',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.navy900,
          ),
        ),
        content: Text(
          'Are you sure you want to delete "$staffName"? All associated service and availability records will also be unassigned.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white70 : Colors.grey.shade700,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Get.back();
              controller.deleteStaff(staffId);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- LEAVE CARD ---
  Widget _buildLeaveCard(BuildContext context, StaffLeaveModel leave, bool isDark, Color primaryColor) {
    Color statusColor;
    final status = leave.approvalStatus ?? 'Approved';
    if (status.toLowerCase() == 'approved') {
      statusColor = AppColors.success;
    } else if (status.toLowerCase() == 'pending') {
      statusColor = AppColors.warning;
    } else {
      statusColor = AppColors.error;
    }

    String dateRangeStr = '';
    if (leave.startDate != null && leave.endDate != null) {
      try {
        final start = DateTime.parse(leave.startDate!);
        final end = DateTime.parse(leave.endDate!);
        if (leave.startDate == leave.endDate) {
          dateRangeStr = DateFormat('MMM dd, yyyy').format(start);
        } else {
          dateRangeStr = '${DateFormat('MMM dd').format(start)} - ${DateFormat('MMM dd, yyyy').format(end)}';
        }
      } catch (_) {
        dateRangeStr = '${leave.startDate} to ${leave.endDate}';
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: isDark ? Border.all(color: Colors.white10, width: 1) : Border.all(color: Colors.black.withOpacity(0.04)),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: primaryColor.withOpacity(0.15),
                      child: Text(
                        leave.staffName != null && leave.staffName!.isNotEmpty
                            ? leave.staffName!.substring(0, 1).toUpperCase()
                            : 'L',
                        style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            leave.staffName ?? 'Staff Member',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Theme.of(context).textTheme.titleMedium?.color),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            leave.leaveType ?? 'Casual Leave',
                            style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: leave.id != null ? () => _showLeaveStatusPicker(context, leave) : null,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 2),
                      Icon(Icons.arrow_drop_down, size: 14, color: statusColor),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),
          const Divider(height: 1),
          const SizedBox(height: 10),

          Row(
            children: [
              Icon(Icons.calendar_month_outlined, size: 14, color: isDark ? AppColors.lavender400 : Colors.grey[700]),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  dateRangeStr,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge?.color),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.violet50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  leave.isAllDay == true ? 'Full Day' : '${leave.startTime ?? ''} - ${leave.endTime ?? ''}',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? AppColors.lavender400 : AppColors.primary),
                ),
              ),
            ],
          ),

          if (leave.reason != null && leave.reason!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.notes_outlined, size: 14, color: isDark ? AppColors.lavender400 : Colors.grey[600]),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    leave.reason!,
                    style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodySmall?.color),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.error),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () {
                    if (leave.id != null) controller.deleteLeave(leave.id!);
                  },
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _showLeaveStatusPicker(BuildContext context, StaffLeaveModel leave) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Update Leave Approval Status',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).textTheme.titleMedium?.color,
              ),
            ),
            const SizedBox(height: 16),
            _buildStatusOptionItem(context, leave, 'Approved', AppColors.success, Icons.check_circle_outline),
            _buildStatusOptionItem(context, leave, 'Pending', AppColors.warning, Icons.hourglass_empty_rounded),
            _buildStatusOptionItem(context, leave, 'Rejected', AppColors.error, Icons.cancel_outlined),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusOptionItem(BuildContext context, StaffLeaveModel leave, String status, Color color, IconData icon) {
    final isCurrent = (leave.approvalStatus?.toLowerCase() == status.toLowerCase());

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        status,
        style: TextStyle(
          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
          color: isCurrent ? color : Theme.of(context).textTheme.bodyLarge?.color,
        ),
      ),
      trailing: isCurrent ? Icon(Icons.check, color: color) : null,
      onTap: () {
        Get.back();
        if (!isCurrent && leave.id != null) {
          controller.updateLeaveStatus(leave.id!, status);
        }
      },
    );
  }

  Widget _buildAvailabilitySection(BuildContext context, StaffModel staff, bool isDark, Color primaryColor) {
    final availabilities = staff.availabilities ?? [];

    if (availabilities.isEmpty) {
      return Row(
        children: [
          Icon(Icons.event_available_outlined, size: 14, color: isDark ? AppColors.lavender400 : Colors.grey[600]),
          const SizedBox(width: 6),
          Text(
            'Availability: All Business Days',
            style: TextStyle(fontSize: 12, color: isDark ? AppColors.lavender400 : Colors.grey[700], fontWeight: FontWeight.w500),
          ),
        ],
      );
    }

    final activeDays = availabilities
        .where((a) => a.dayOfWeek != null && a.dayOfWeek!.isNotEmpty)
        .toList();

    String timeStr = '';
    if (activeDays.isNotEmpty && activeDays.first.startTime != null && activeDays.first.endTime != null) {
      timeStr = '${_formatTime12h(activeDays.first.startTime!)} - ${_formatTime12h(activeDays.first.endTime!)}';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(Icons.access_time_rounded, size: 14, color: primaryColor),
                const SizedBox(width: 6),
                Text(
                  'Working Days:',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
              ],
            ),
            if (timeStr.isNotEmpty)
              Text(
                timeStr,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: primaryColor),
              ),
          ],
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 4,
          children: activeDays.map((a) {
            final dayName = _abbreviateDay(a.dayOfWeek!);
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.violet50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isDark ? Colors.white12 : AppColors.primary.withOpacity(0.2),
                ),
              ),
              child: Text(
                dayName,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.navy300 : AppColors.primary,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  String _abbreviateDay(String dayStr) {
    switch (dayStr.toLowerCase()) {
      case 'monday': return 'Mon';
      case 'tuesday': return 'Tue';
      case 'wednesday': return 'Wed';
      case 'thursday': return 'Thu';
      case 'friday': return 'Fri';
      case 'saturday': return 'Sat';
      case 'sunday': return 'Sun';
      default:
        return dayStr.length >= 3 ? dayStr.substring(0, 3) : dayStr;
    }
  }

  String _formatTime12h(String time24) {
    try {
      final parts = time24.split(':');
      final hour = int.parse(parts[0]);
      final minute = parts[1];
      final period = hour >= 12 ? 'PM' : 'AM';
      final hour12 = hour % 12 == 0 ? 12 : hour % 12;
      return '$hour12:$minute $period';
    } catch (_) {
      return time24;
    }
  }
}
