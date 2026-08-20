import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/staff_model.dart';
import '../controllers/staff_controller.dart';

class StaffForm extends StatefulWidget {
  final StaffModel? staff;

  const StaffForm({super.key, this.staff});

  static void show(BuildContext context, {StaffModel? staff}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StaffForm(staff: staff),
    );
  }

  @override
  State<StaffForm> createState() => _StaffFormState();
}

class _StaffFormState extends State<StaffForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _roleController;
  late TextEditingController _phoneController;
  int _selectedSlotDuration = 30;
  bool _isSubmitting = false;

  final List<int> _selectedLocationIds = [];

  // Weekly Schedule: Map<DayName, Map<'enabled'|'start'|'end', dynamic>>
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  final Map<String, Map<String, dynamic>> _schedule = {};

  @override
  void initState() {
    super.initState();
    final staff = widget.staff;
    _nameController = TextEditingController(text: staff?.staffName ?? '');
    _roleController = TextEditingController(text: staff?.role ?? '');
    _phoneController = TextEditingController(text: staff?.phone ?? '');
    _selectedSlotDuration = staff?.slotDurationMinutes ?? 30;

    // Initialize location IDs
    if (staff?.locations != null) {
      _selectedLocationIds.addAll(staff!.locations!.map((l) => l.id!).where((id) => id > 0));
    }

    // Initialize schedule map
    for (var day in _days) {
      _schedule[day] = {
        'enabled': false,
        'start': const TimeOfDay(hour: 9, minute: 0),
        'end': const TimeOfDay(hour: 17, minute: 0),
      };
    }

    if (staff?.availabilities != null && staff!.availabilities!.isNotEmpty) {
      for (var avail in staff.availabilities!) {
        if (avail.dayOfWeek != null) {
          final matchedDay = _days.firstWhere(
            (d) => d.toLowerCase() == avail.dayOfWeek!.toLowerCase(),
            orElse: () => '',
          );
          if (matchedDay.isNotEmpty) {
            _schedule[matchedDay]!['enabled'] = true;
            if (avail.startTime != null) {
              _schedule[matchedDay]!['start'] = _parseTimeOfDay(avail.startTime!);
            }
            if (avail.endTime != null) {
              _schedule[matchedDay]!['end'] = _parseTimeOfDay(avail.endTime!);
            }
          }
        }
      }
    } else if (staff == null) {
      // Default Mon-Fri 9 to 5 for new staff
      for (var day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
        _schedule[day]!['enabled'] = true;
      }
    }
  }

  TimeOfDay _parseTimeOfDay(String time24) {
    try {
      final parts = time24.split(':');
      return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
    } catch (_) {
      return const TimeOfDay(hour: 9, minute: 0);
    }
  }

  String _formatTimeOfDay24(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m:00';
  }

  void _copyDayToAll(String sourceDay) {
    final sourceData = _schedule[sourceDay];
    if (sourceData == null) return;

    final start = sourceData['start'] as TimeOfDay;
    final end = sourceData['end'] as TimeOfDay;
    final isEnabled = sourceData['enabled'] == true;

    setState(() {
      for (var day in _days) {
        _schedule[day]!['enabled'] = isEnabled;
        _schedule[day]!['start'] = start;
        _schedule[day]!['end'] = end;
      }
    });

    Get.snackbar(
      'Schedule Copied',
      'Applied $sourceDay\'s timing to all days',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green.withOpacity(0.1),
      colorText: Colors.green,
      duration: const Duration(seconds: 2),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _roleController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate() || _isSubmitting) return;

    final controller = Get.find<StaffController>();

    if (_selectedLocationIds.isEmpty && controller.locationsList.isNotEmpty) {
      Get.snackbar('Location Required', 'Please assign at least one location to this staff member');
      return;
    }

    setState(() => _isSubmitting = true);

    final staffData = {
      'staff_name': _nameController.text.trim(),
      'role': _roleController.text.trim(),
      'phone': _phoneController.text.trim(),
      'slot_duration_minutes': _selectedSlotDuration,
      'status': true,
    };

    // Format availability records
    final List<Map<String, dynamic>> availRecords = [];
    final int? primaryLocationId = _selectedLocationIds.isNotEmpty ? _selectedLocationIds.first : null;
    _schedule.forEach((day, data) {
      if (data['enabled'] == true) {
        final start = _formatTimeOfDay24(data['start']);
        final end = _formatTimeOfDay24(data['end']);
        availRecords.add({
          'day_of_week': day.toLowerCase(),
          if (primaryLocationId != null) 'location_id': primaryLocationId,
          'start_time': start,
          'end_time': end,
          'status': true,
        });
      }
    });

    bool success = false;
    if (widget.staff != null && widget.staff!.id != null) {
      success = await controller.updateStaff(
        staffId: widget.staff!.id!,
        staffData: staffData,
        locationIds: _selectedLocationIds,
        assignedServiceIds: const [],
        availabilityRecords: availRecords,
      );
    } else {
      success = await controller.createStaff(
        staffData: staffData,
        locationIds: _selectedLocationIds,
        assignedServiceIds: const [],
        availabilityRecords: availRecords,
      );
    }

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEdit = widget.staff != null;
    final controller = Get.find<StaffController>();

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        top: 16,
        left: 20,
        right: 20,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header handle & title
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isEdit ? Icons.person_outline_rounded : Icons.person_add_alt_1_rounded,
                      color: isDark ? Colors.white : AppColors.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit ? 'Edit Staff Member' : 'Add Staff Member',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppColors.navy900,
                            fontFamily: 'Syne',
                          ),
                        ),
                        Text(
                          isEdit ? 'Update staff profile & assigned services' : 'Set team details & weekly working hours',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white60 : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // ── SECTION 1: BASIC INFORMATION ──
              _buildSectionHeader(context, 'Basic Details'),
              const SizedBox(height: 10),

              // Staff Name
              TextFormField(
                controller: _nameController,
                style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppColors.navy900),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Staff name is required';
                  if (val.trim().length < 2) return 'Name must be at least 2 characters';
                  return null;
                },
                decoration: _buildInputDecoration(
                  context,
                  label: 'Staff Name *',
                  hint: 'e.g. Dr. Priya Sharma, Alex Smith',
                  icon: Icons.person_outline_rounded,
                ),
              ),
              const SizedBox(height: 12),

              // Role & Phone Row
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _roleController,
                      style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppColors.navy900),
                      decoration: _buildInputDecoration(
                        context,
                        label: 'Role / Title',
                        hint: 'e.g. Doctor, Stylist',
                        icon: Icons.badge_outlined,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppColors.navy900),
                      decoration: _buildInputDecoration(
                        context,
                        label: 'Phone Number',
                        hint: 'e.g. +91 9876543210',
                        icon: Icons.phone_outlined,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Slot Duration Dropdown
              DropdownButtonFormField<int>(
                value: _selectedSlotDuration,
                dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppColors.navy900),
                decoration: _buildInputDecoration(
                  context,
                  label: 'Appointment Slot Duration',
                  hint: 'Select slot duration',
                  icon: Icons.schedule_rounded,
                ),
                items: const [15, 20, 30, 45, 60, 90, 120].map((mins) {
                  return DropdownMenuItem<int>(
                    value: mins,
                    child: Text('$mins Minutes Slot'),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedSlotDuration = val);
                },
              ),
              const SizedBox(height: 20),

              // ── SECTION 2: LOCATION ASSIGNMENT ──
              _buildSectionHeader(context, 'Assigned Locations'),
              const SizedBox(height: 8),

              Obx(() {
                final locations = controller.locationsList;
                if (locations.isEmpty) {
                  return Text(
                    'No locations created yet. Default location will be assigned.',
                    style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : Colors.grey.shade600),
                  );
                }
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: locations.map((loc) {
                    final isSelected = loc.id != null && _selectedLocationIds.contains(loc.id);
                    return FilterChip(
                      selected: isSelected,
                      label: Text(loc.locationName ?? 'Location ${loc.id}'),
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppColors.navy900),
                      ),
                      selectedColor: AppColors.primary,
                      backgroundColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                      checkmarkColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: isSelected
                              ? AppColors.primary
                              : (isDark ? Colors.white10 : Colors.grey.shade300),
                        ),
                      ),
                      onSelected: (selected) {
                        setState(() {
                          if (loc.id != null) {
                            if (selected) {
                              _selectedLocationIds.add(loc.id!);
                            } else {
                              _selectedLocationIds.remove(loc.id!);
                            }
                          }
                        });
                      },
                    );
                  }).toList(),
                );
              }),
              const SizedBox(height: 20),

              // ── SECTION 3: WEEKLY AVAILABILITY ──
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildSectionHeader(context, 'Weekly Working Schedule'),
                  InkWell(
                    onTap: () {
                      final firstEnabled = _days.firstWhere(
                        (d) => _schedule[d]!['enabled'] == true,
                        orElse: () => _days.first,
                      );
                      _copyDayToAll(firstEnabled);
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.primary.withOpacity(0.2) : AppColors.violet50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.primary.withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.copy_all_rounded, size: 14, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            'Copy to All Days',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isDark ? AppColors.lavender400 : AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Column(
                children: _days.map((day) {
                  final data = _schedule[day]!;
                  final isEnabled = data['enabled'] == true;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isEnabled
                          ? (isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade50)
                          : (isDark ? Colors.white.withOpacity(0.02) : Colors.grey.shade100),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isEnabled
                            ? AppColors.primary.withOpacity(0.3)
                            : (isDark ? Colors.white10 : Colors.grey.shade200),
                      ),
                    ),
                    child: Row(
                      children: [
                        Transform.scale(
                          scale: 0.9,
                          child: Checkbox(
                            value: isEnabled,
                            activeColor: AppColors.primary,
                            visualDensity: VisualDensity.compact,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                            onChanged: (val) {
                              setState(() {
                                data['enabled'] = val ?? false;
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 4),
                        SizedBox(
                          width: 66,
                          child: Text(
                            day,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isEnabled
                                  ? (isDark ? Colors.white : AppColors.navy900)
                                  : Colors.grey,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isEnabled) ...[
                          Expanded(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerRight,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  _buildTimePickerTile(context, 'From', data['start'], (newTime) {
                                    setState(() => data['start'] = newTime);
                                  }),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 3),
                                    child: Text('-', style: TextStyle(color: Colors.grey, fontSize: 11)),
                                  ),
                                  _buildTimePickerTile(context, 'To', data['end'], (newTime) {
                                    setState(() => data['end'] = newTime);
                                  }),
                                  const SizedBox(width: 2),
                                  IconButton(
                                    icon: const Icon(Icons.copy_all_rounded, size: 16, color: AppColors.primary),
                                    tooltip: 'Apply $day timing to all days',
                                    constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                                    padding: EdgeInsets.zero,
                                    onPressed: () => _copyDayToAll(day),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ] else
                          Expanded(
                            child: Text(
                              'Day Off',
                              textAlign: TextAlign.end,
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontStyle: FontStyle.italic),
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 22),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 2,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : Text(
                          isEdit ? 'Update Staff Member' : 'Add Staff Member',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Syne',
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimePickerTile(BuildContext context, String label, TimeOfDay time, Function(TimeOfDay) onPicked) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: () async {
        final picked = await showTimePicker(
          context: context,
          initialTime: time,
        );
        if (picked != null) onPicked(picked);
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isDark ? Colors.white24 : Colors.grey.shade300),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              time.format(context),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppColors.navy900,
              ),
            ),
            const SizedBox(width: 1),
            const Icon(Icons.arrow_drop_down, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Text(
      title.toUpperCase(),
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.0,
        color: isDark ? Colors.white70 : Colors.grey.shade700,
      ),
    );
  }

  InputDecoration _buildInputDecoration(
    BuildContext context, {
    required String label,
    required String hint,
    IconData? icon,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.grey.shade700),
      hintText: hint,
      hintStyle: TextStyle(fontSize: 13, color: isDark ? Colors.white38 : Colors.grey.shade400),
      prefixIcon: icon != null
          ? Icon(
              icon,
              size: 18,
              color: isDark ? Colors.white70 : AppColors.accent,
            )
          : null,
      filled: true,
      fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
    );
  }
}
