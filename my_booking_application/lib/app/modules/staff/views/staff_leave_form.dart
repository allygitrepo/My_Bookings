import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/models/staff_leave_model.dart';
import '../controllers/staff_controller.dart';

class StaffLeaveForm extends StatefulWidget {
  final StaffLeaveModel? leave;
  const StaffLeaveForm({super.key, this.leave});

  static void show(BuildContext context, {StaffLeaveModel? leave}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StaffLeaveForm(leave: leave),
    );
  }

  @override
  State<StaffLeaveForm> createState() => _StaffLeaveFormState();
}

class _StaffLeaveFormState extends State<StaffLeaveForm> {
  final _formKey = GlobalKey<FormState>();
  final StaffController controller = Get.find<StaffController>();

  StaffModel? _selectedStaff;
  String _selectedLeaveType = 'Casual Leave';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 18, minute: 0);
  bool _isAllDay = true;
  String _approvalStatus = 'Approved';
  final TextEditingController _reasonController = TextEditingController();

  final List<String> _leaveTypes = [
    'Casual Leave',
    'Sick Leave',
    'Vacation',
    'Unpaid Leave',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.leave != null) {
      final l = widget.leave!;
      if (l.staffId != null && controller.staffList.any((s) => s.id == l.staffId)) {
        _selectedStaff = controller.staffList.firstWhere((s) => s.id == l.staffId);
      } else if (controller.staffList.isNotEmpty) {
        _selectedStaff = controller.staffList.first;
      }
      if (l.leaveType != null && _leaveTypes.contains(l.leaveType)) {
        _selectedLeaveType = l.leaveType!;
      }
      if (l.startDate != null) {
        try { _startDate = DateTime.parse(l.startDate!); } catch (_) {}
      }
      if (l.endDate != null) {
        try { _endDate = DateTime.parse(l.endDate!); } catch (_) {}
      }
      if (l.startTime != null && l.startTime!.isNotEmpty) {
        try {
          final parts = l.startTime!.split(':').map((e) => int.parse(e)).toList();
          _startTime = TimeOfDay(hour: parts[0], minute: parts[1]);
        } catch (_) {}
      }
      if (l.endTime != null && l.endTime!.isNotEmpty) {
        try {
          final parts = l.endTime!.split(':').map((e) => int.parse(e)).toList();
          _endTime = TimeOfDay(hour: parts[0], minute: parts[1]);
        } catch (_) {}
      }
      _isAllDay = l.isAllDay ?? true;
      if (l.approvalStatus != null && l.approvalStatus!.isNotEmpty) {
        _approvalStatus = l.approvalStatus!;
      }
      if (l.reason != null) {
        _reasonController.text = l.reason!;
      }
    } else if (controller.staffList.isNotEmpty) {
      _selectedStaff = controller.staffList.first;
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) {
            _endDate = _startDate;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _pickTime({required bool isStart}) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _startTime : _endTime,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat('HH:mm:ss').format(dt);
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedStaff == null) {
      Get.snackbar('Required', 'Please select a staff member',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.orange, colorText: Colors.white);
      return;
    }

    final bool isEdit = widget.leave != null && widget.leave!.id != null;
    final bool success;

    if (isEdit) {
      success = await controller.updateLeave(
        leaveId: widget.leave!.id!,
        staffId: _selectedStaff!.id!,
        leaveType: _selectedLeaveType,
        startDate: DateFormat('yyyy-MM-dd').format(_startDate),
        endDate: DateFormat('yyyy-MM-dd').format(_endDate),
        startTime: _isAllDay ? null : _formatTimeOfDay(_startTime),
        endTime: _isAllDay ? null : _formatTimeOfDay(_endTime),
        isAllDay: _isAllDay,
        approvalStatus: _approvalStatus,
        reason: _reasonController.text.trim(),
      );
    } else {
      success = await controller.createLeave(
        staffId: _selectedStaff!.id!,
        leaveType: _selectedLeaveType,
        startDate: DateFormat('yyyy-MM-dd').format(_startDate),
        endDate: DateFormat('yyyy-MM-dd').format(_endDate),
        startTime: _isAllDay ? null : _formatTimeOfDay(_startTime),
        endTime: _isAllDay ? null : _formatTimeOfDay(_endTime),
        isAllDay: _isAllDay,
        approvalStatus: _approvalStatus,
        reason: _reasonController.text.trim(),
      );
    }

    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.navy300 : AppColors.primary;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag Handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),

              // Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.leave != null ? 'Edit Staff Leave' : 'Apply Staff Leave',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.titleLarge?.color,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, color: isDark ? Colors.white70 : Colors.black87),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: isDark ? Colors.white12 : Colors.black12),

              // Form Body
              Expanded(
                child: Form(
                  key: _formKey,
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.all(20),
                    children: [
                      // --- STAFF MEMBER SELECTION ---
                      _buildHeader(context, 'Staff Member', Icons.person_outline, isDark, primaryColor),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<StaffModel>(
                        value: controller.staffList.any((s) => s.id == _selectedStaff?.id)
                            ? controller.staffList.firstWhere((s) => s.id == _selectedStaff?.id)
                            : null,
                        dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                        style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                        decoration: _inputDecoration(context, 'Select Staff Member', Icons.people, isDark, primaryColor),
                        items: controller.staffList.map((staff) {
                          return DropdownMenuItem(
                            value: staff,
                            child: Text(
                              '${staff.staffName} (${staff.role ?? 'Staff'})',
                              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedStaff = val),
                      ),

                      const SizedBox(height: 20),

                      // --- LEAVE TYPE ---
                      _buildHeader(context, 'Leave Type', Icons.category_outlined, isDark, primaryColor),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _selectedLeaveType,
                        dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                        style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                        decoration: _inputDecoration(context, 'Leave Type', Icons.event_note_outlined, isDark, primaryColor),
                        items: _leaveTypes.map((type) {
                          return DropdownMenuItem(
                            value: type,
                            child: Text(
                              type,
                              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedLeaveType = val!),
                      ),

                      const SizedBox(height: 20),

                      // --- DATE RANGE ---
                      _buildHeader(context, 'Leave Duration', Icons.date_range_outlined, isDark, primaryColor),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () => _pickDate(isStart: true),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('From', style: TextStyle(fontSize: 11, color: isDark ? AppColors.lavender400 : Colors.grey)),
                                    const SizedBox(height: 4),
                                    Text(
                                      DateFormat('MMM dd, yyyy').format(_startDate),
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Theme.of(context).textTheme.bodyLarge?.color),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: InkWell(
                              onTap: () => _pickDate(isStart: false),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('To', style: TextStyle(fontSize: 11, color: isDark ? AppColors.lavender400 : Colors.grey)),
                                    const SizedBox(height: 4),
                                    Text(
                                      DateFormat('MMM dd, yyyy').format(_endDate),
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Theme.of(context).textTheme.bodyLarge?.color),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // --- ALL DAY SWITCH & TIME SLOTS ---
                      SwitchListTile(
                        value: _isAllDay,
                        activeColor: primaryColor,
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          'Full Day Leave',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color),
                        ),
                        subtitle: Text(
                          'Leave applies for the entire working day',
                          style: TextStyle(fontSize: 12, color: isDark ? AppColors.lavender400 : Colors.grey),
                        ),
                        onChanged: (val) => setState(() => _isAllDay = val),
                      ),

                      if (!_isAllDay) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: () => _pickTime(isStart: true),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).cardColor,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
                                  ),
                                  child: Text('Start: ${_startTime.format(context)}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InkWell(
                                onTap: () => _pickTime(isStart: false),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).cardColor,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
                                  ),
                                  child: Text('End: ${_endTime.format(context)}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 20),

                      // --- APPROVAL STATUS ---
                      _buildHeader(context, 'Approval Status', Icons.verified_user_outlined, isDark, primaryColor),
                      const SizedBox(height: 8),
                      Row(
                        children: ['Approved', 'Pending', 'Rejected'].map((status) {
                          final isSelected = _approvalStatus == status;
                          Color chipColor;
                          if (status == 'Approved') chipColor = AppColors.success;
                          else if (status == 'Pending') chipColor = AppColors.warning;
                          else chipColor = AppColors.error;

                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(status),
                              selected: isSelected,
                              selectedColor: chipColor.withOpacity(0.2),
                              labelStyle: TextStyle(
                                color: isSelected ? chipColor : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                              onSelected: (sel) {
                                if (sel) setState(() => _approvalStatus = status);
                              },
                            ),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 20),

                      // --- REASON / NOTES ---
                      _buildHeader(context, 'Reason / Notes (Optional)', Icons.notes_outlined, isDark, primaryColor),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _reasonController,
                        maxLines: 2,
                        style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                        decoration: _inputDecoration(context, 'Enter reason for leave...', Icons.edit_note_outlined, isDark, primaryColor),
                      ),

                      const SizedBox(height: 28),

                      // --- SUBMIT BUTTON ---
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                          ),
                          child: Text(
                            widget.leave != null ? 'Update Staff Leave' : 'Save Staff Leave',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, String title, IconData icon, bool isDark, Color primaryColor) {
    return Row(
      children: [
        Icon(icon, size: 18, color: primaryColor),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Theme.of(context).textTheme.titleMedium?.color,
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(BuildContext context, String hint, IconData icon, bool isDark, Color primaryColor) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: primaryColor, size: 20),
      filled: true,
      fillColor: Theme.of(context).cardColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: isDark ? const BorderSide(color: Colors.white12) : BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: isDark ? const BorderSide(color: Colors.white12) : BorderSide.none,
      ),
    );
  }
}
