import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/customer_model.dart';
import '../../../data/models/location_model.dart';
import '../../../data/models/service_model.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/models/staff_leave_model.dart';
import '../../../data/models/business_closure_model.dart';
import '../controllers/bookings_controller.dart';

class BookingsForm extends StatefulWidget {
  const BookingsForm({super.key});

  static void show(BuildContext context) {
    final controller = Get.find<BookingsController>();
    controller.fetchFormDropdownData();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const BookingsForm(),
    );
  }

  @override
  State<BookingsForm> createState() => _BookingsFormState();
}

class _BookingsFormState extends State<BookingsForm> {
  final _formKey = GlobalKey<FormState>();
  final BookingsController controller = Get.find<BookingsController>();

  // Customer Mode
  bool _isNewCustomer = false;
  CustomerModel? _selectedCustomer;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  // Selections
  LocationModel? _selectedLocation;
  StaffModel? _selectedStaff;
  final List<ServiceModel> _selectedServices = [];

  // Date & Time
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 9, minute: 30);
  String? _selectedSlotStr;

  // Payment
  bool _isPaid = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _onServiceSelected(ServiceModel service, bool isSelected) {
    setState(() {
      if (isSelected) {
        if (!_selectedServices.any((s) => s.id == service.id)) {
          _selectedServices.add(service);
        }
      } else {
        _selectedServices.removeWhere((s) => s.id == service.id);
      }
      _autoCalculateEndTime();
    });
  }

  void _autoCalculateEndTime() {
    double totalDuration = 0;
    for (var s in _selectedServices) {
      totalDuration += (s.durationMinutes ?? 30.0);
    }
    if (totalDuration == 0) totalDuration = (_selectedStaff?.slotDurationMinutes ?? 30).toDouble();

    final startMinutes = _startTime.hour * 60 + _startTime.minute;
    final endMinutes = (startMinutes + totalDuration.toInt()) % 1440;

    setState(() {
      _endTime = TimeOfDay(hour: endMinutes ~/ 60, minute: endMinutes % 60);
    });
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _selectedSlotStr = null;
      });
    }
  }

  int _parseMins(String timeStr) {
    try {
      final parts = timeStr.split(':').map((e) => int.parse(e)).toList();
      return parts[0] * 60 + parts[1];
    } catch (_) {
      return 0;
    }
  }

  String _formatSlotTime12h(String timeStr) {
    try {
      final parts = timeStr.split(':').map((e) => int.parse(e)).toList();
      final dt = DateTime(2024, 1, 1, parts[0], parts[1]);
      return DateFormat('h:mm a').format(dt);
    } catch (_) {
      return timeStr;
    }
  }

  // --- LEAVE MASTER & CLOSURE CHECKS ---
  BusinessClosureModel? _getActiveBusinessClosure() {
    final String selectedDateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    for (var closure in controller.businessClosuresList) {
      if (closure.startDate == null || closure.endDate == null) continue;
      if (selectedDateStr.compareTo(closure.startDate!) >= 0 && selectedDateStr.compareTo(closure.endDate!) <= 0) {
        return closure;
      }
    }
    return null;
  }

  StaffLeaveModel? _getActiveStaffLeave() {
    if (_selectedStaff == null) return null;
    final String selectedDateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    for (var leave in controller.staffLeavesList) {
      if (leave.staffId != _selectedStaff!.id) continue;
      if (leave.approvalStatus?.toLowerCase() == 'rejected') continue;
      if (leave.startDate == null || leave.endDate == null) continue;
      if (selectedDateStr.compareTo(leave.startDate!) >= 0 && selectedDateStr.compareTo(leave.endDate!) <= 0) {
        return leave;
      }
    }
    return null;
  }

  List<String> _getAvailableSlots() {
    if (_selectedStaff == null) return [];

    final String selectedDateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    // 1. Business Closure Check (Full Day)
    final closure = _getActiveBusinessClosure();
    if (closure != null && closure.isAllDay == true) {
      return [];
    }

    // 2. Staff Leave Check (Full Day)
    final staffLeave = _getActiveStaffLeave();
    if (staffLeave != null && staffLeave.isAllDay == true) {
      return [];
    }

    // 3. Weekly Availability
    final dayName = DateFormat('EEEE').format(_selectedDate).toLowerCase();

    final matchingAvailabilities = controller.availabilityList.where((a) {
      if (a.staffId != _selectedStaff!.id) return false;
      if (_selectedLocation != null && a.locationId != null && a.locationId != 0 && a.locationId != _selectedLocation!.id) {
        return false;
      }
      final backendDay = (a.dayOfWeek ?? '').toLowerCase();
      return backendDay == dayName || backendDay.startsWith(dayName.substring(0, 3));
    }).toList();

    if (matchingAvailabilities.isEmpty) return [];

    final int stepMin = _selectedStaff!.slotDurationMinutes ?? 30;
    final List<String> slots = [];

    for (var avail in matchingAvailabilities) {
      if (avail.startTime == null || avail.endTime == null) continue;

      final startMins = _parseMins(avail.startTime!);
      int endMins = _parseMins(avail.endTime!);

      if (endMins <= startMins) endMins += 24 * 60;

      int cur = startMins;
      while (cur + stepMin <= endMins) {
        final h = (cur ~/ 60) % 24;
        final m = cur % 60;
        final slotTimeStr = '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:00';
        if (!slots.contains(slotTimeStr)) {
          slots.add(slotTimeStr);
        }
        cur += stepMin;
      }
    }

    slots.sort();

    final String todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final nowTimeStr = DateFormat('HH:mm:ss').format(DateTime.now());

    return slots.where((slot) {
      // Past time check for today
      if (selectedDateStr == todayStr && slot.compareTo(nowTimeStr) < 0) {
        return false;
      }

      final slotStartMins = _parseMins(slot);
      final slotEndMins = slotStartMins + stepMin;

      // Business Closure Check (Timed)
      if (closure != null && closure.isAllDay != true && closure.startTime != null && closure.endTime != null) {
        final cStartMins = _parseMins(closure.startTime!);
        final cEndMins = _parseMins(closure.endTime!);
        if (slotStartMins < cEndMins && slotEndMins > cStartMins) {
          return false;
        }
      }

      // Staff Leave Check (Timed)
      if (staffLeave != null && staffLeave.isAllDay != true && staffLeave.startTime != null && staffLeave.endTime != null) {
        final lStartMins = _parseMins(staffLeave.startTime!);
        final lEndMins = _parseMins(staffLeave.endTime!);
        if (slotStartMins < lEndMins && slotEndMins > lStartMins) {
          return false;
        }
      }

      // Existing Bookings Overlap Check
      final isBooked = controller.bookings.any((b) {
        if (b.staffId != _selectedStaff!.id) return false;
        if (b.bookingDate != selectedDateStr) return false;

        final bStatus = (b.status ?? '').toLowerCase();
        if (bStatus == 'cancelled' || bStatus == 'false' || bStatus == '0') return false;

        final bStartStr = b.startTime ?? '00:00:00';
        final bStartMins = _parseMins(bStartStr);
        final bEndMins = (b.endTime != null && b.endTime!.isNotEmpty)
            ? _parseMins(b.endTime!)
            : bStartMins + stepMin;

        return (slotStartMins < bEndMins && slotEndMins > bStartMins);
      });

      return !isBooked;
    }).toList();
  }

  void _selectSlot(String slotTimeStr) {
    final parts = slotTimeStr.split(':').map((e) => int.parse(e)).toList();
    final start = TimeOfDay(hour: parts[0], minute: parts[1]);

    double totalDuration = 0;
    for (var s in _selectedServices) {
      totalDuration += (s.durationMinutes ?? 30.0);
    }
    if (totalDuration == 0) totalDuration = (_selectedStaff?.slotDurationMinutes ?? 30).toDouble();

    final startMins = start.hour * 60 + start.minute;
    final endMins = (startMins + totalDuration.toInt()) % 1440;
    final end = TimeOfDay(hour: endMins ~/ 60, minute: endMins % 60);

    setState(() {
      _selectedSlotStr = slotTimeStr;
      _startTime = start;
      _endTime = end;
    });
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat('HH:mm:ss').format(dt);
  }

  String _formatDisplayTime(TimeOfDay time) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat('h:mm a').format(dt);
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_isNewCustomer && _selectedCustomer == null) {
      Get.snackbar('Error', 'Please select a customer or switch to New Customer',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    if (_selectedLocation == null) {
      Get.snackbar('Error', 'Please select a location',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    if (_selectedServices.isEmpty) {
      Get.snackbar('Error', 'Please select at least one service',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    if (_selectedStaff == null) {
      Get.snackbar('Error', 'Please select a staff member',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    // Business closure check before submit
    final closure = _getActiveBusinessClosure();
    if (closure != null && closure.isAllDay == true) {
      Get.snackbar('Business Closed', 'Business is closed on this date (${closure.title ?? 'Holiday'})',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    // Staff leave check before submit
    final staffLeave = _getActiveStaffLeave();
    if (staffLeave != null && staffLeave.isAllDay == true) {
      Get.snackbar('Staff On Leave', '${_selectedStaff?.staffName} is on leave (${staffLeave.leaveType ?? 'Leave'}) on this date',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    if (_selectedSlotStr == null) {
      Get.snackbar('Error', 'Please select an available time slot',
          snackPosition: SnackPosition.BOTTOM, backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    final success = await controller.createBooking(
      isNewCustomer: _isNewCustomer,
      customerId: _selectedCustomer?.id,
      newCustomerName: _nameController.text.trim(),
      newCustomerPhone: _phoneController.text.trim(),
      newCustomerEmail: _emailController.text.trim(),
      locationId: _selectedLocation!.id!,
      serviceIds: _selectedServices.map((s) => s.id!).toList(),
      staffId: _selectedStaff!.id!,
      bookingDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
      startTime: _formatTimeOfDay(_startTime),
      endTime: _formatTimeOfDay(_endTime),
      isPaid: _isPaid,
    );

    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.88,
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
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),

              // Title Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Create New Booking',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.titleLarge?.color,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Form content
              Expanded(
                child: Obx(() {
                  if (controller.isFormLoading.value) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Loading booking options...'),
                        ],
                      ),
                    );
                  }

                  final closure = _getActiveBusinessClosure();
                  final staffLeave = _getActiveStaffLeave();
                  final availableSlots = _getAvailableSlots();

                  final currentCustomerValue = controller.customersList.any((c) => c.id == _selectedCustomer?.id)
                      ? controller.customersList.firstWhere((c) => c.id == _selectedCustomer?.id)
                      : null;

                  final currentLocationValue = controller.locationsList.any((l) => l.id == _selectedLocation?.id)
                      ? controller.locationsList.firstWhere((l) => l.id == _selectedLocation?.id)
                      : null;

                  final currentStaffValue = controller.staffList.any((s) => s.id == _selectedStaff?.id)
                      ? controller.staffList.firstWhere((s) => s.id == _selectedStaff?.id)
                      : null;

                  return Form(
                    key: _formKey,
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.all(20),
                      children: [
                        // --- BUSINESS CLOSURE WARNING BANNER ---
                        if (closure != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.red.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.event_busy, color: Colors.red, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Business Closure: ${closure.title ?? 'Holiday'} (${closure.isAllDay == true ? "Closed All Day" : "${closure.startTime} - ${closure.endTime}"})',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // --- CUSTOMER SECTION ---
                        _buildSectionHeader('Customer Details', Icons.person_outline),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ChoiceChip(
                                label: const Center(child: Text('Existing Customer')),
                                selected: !_isNewCustomer,
                                onSelected: (selected) {
                                  if (selected) setState(() => _isNewCustomer = false);
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ChoiceChip(
                                label: const Center(child: Text('+ New Customer')),
                                selected: _isNewCustomer,
                                onSelected: (selected) {
                                  if (selected) setState(() => _isNewCustomer = true);
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        if (!_isNewCustomer) ...[
                          DropdownButtonFormField<CustomerModel>(
                            value: currentCustomerValue,
                            decoration: _inputDecoration('Select Customer', Icons.person),
                            items: controller.customersList.map((customer) {
                              return DropdownMenuItem(
                                value: customer,
                                child: Text('${customer.name ?? 'Guest'} (${customer.phone ?? 'No Phone'})'),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedCustomer = val),
                          ),
                        ] else ...[
                          TextFormField(
                            controller: _nameController,
                            decoration: _inputDecoration('Customer Name *', Icons.person),
                            validator: (val) => (val == null || val.trim().isEmpty) ? 'Name is required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: _inputDecoration('Phone Number *', Icons.phone),
                            validator: (val) => (val == null || val.trim().isEmpty) ? 'Phone number is required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _inputDecoration('Email (Optional)', Icons.email_outlined),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // --- LOCATION SECTION ---
                        _buildSectionHeader('Location', Icons.location_on_outlined),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<LocationModel>(
                          value: currentLocationValue,
                          decoration: _inputDecoration('Select Location', Icons.storefront),
                          items: controller.locationsList.map((loc) {
                            return DropdownMenuItem(
                              value: loc,
                              child: Text(loc.locationName ?? 'Default Location'),
                            );
                          }).toList(),
                          onChanged: (val) => setState(() {
                            _selectedLocation = val;
                            _selectedSlotStr = null;
                          }),
                        ),

                        const SizedBox(height: 24),

                        // --- SERVICES SECTION ---
                        _buildSectionHeader('Services', Icons.medical_services_outlined),
                        const SizedBox(height: 8),
                        if (controller.servicesList.isEmpty)
                          const Text('No services available', style: TextStyle(color: Colors.grey))
                        else
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: controller.servicesList.map((service) {
                              final isSelected = _selectedServices.any((s) => s.id == service.id);
                              return FilterChip(
                                label: Text('${service.serviceName} (₹${service.price?.toStringAsFixed(0) ?? 0})'),
                                selected: isSelected,
                                onSelected: (sel) => _onServiceSelected(service, sel),
                                selectedColor: AppColors.primary.withOpacity(0.2),
                                checkmarkColor: AppColors.primary,
                              );
                            }).toList(),
                          ),

                        const SizedBox(height: 24),

                        // --- STAFF SECTION ---
                        _buildSectionHeader('Staff Member', Icons.badge_outlined),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<StaffModel>(
                          value: currentStaffValue,
                          decoration: _inputDecoration('Assign Staff', Icons.people_outline),
                          items: controller.staffList.map((staff) {
                            return DropdownMenuItem(
                              value: staff,
                              child: Text('${staff.staffName} (${staff.role ?? 'Staff'})'),
                            );
                          }).toList(),
                          onChanged: (val) => setState(() {
                            _selectedStaff = val;
                            _selectedSlotStr = null;
                          }),
                        ),

                        // --- STAFF LEAVE WARNING BANNER ---
                        if (staffLeave != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.orange.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.beach_access, color: Colors.orange, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${_selectedStaff?.staffName} is on leave (${staffLeave.leaveType ?? 'Leave'}) ${staffLeave.isAllDay == true ? 'All Day' : 'during ${staffLeave.startTime} - ${staffLeave.endTime}'}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // --- DATE & AVAILABLE SLOTS SECTION ---
                        _buildSectionHeader('Date & Time Slot', Icons.calendar_today_outlined),
                        const SizedBox(height: 12),
                        InkWell(
                          onTap: _pickDate,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.withOpacity(0.4)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.event, size: 20, color: AppColors.primary),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    DateFormat('EEEE, MMM dd, yyyy').format(_selectedDate),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const Icon(Icons.arrow_drop_down, color: Colors.grey),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // AVAILABLE STAFF TIME SLOTS
                        if (_selectedStaff == null) ...[
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'Please select a staff member to see available time slots.',
                              style: TextStyle(fontSize: 13, color: Colors.grey, fontStyle: FontStyle.italic),
                            ),
                          ),
                        ] else if (closure != null && closure.isAllDay == true) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No slots available. Business is closed for ${closure.title ?? 'Holiday'}.',
                              style: const TextStyle(fontSize: 13, color: Colors.red, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ] else if (staffLeave != null && staffLeave.isAllDay == true) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No slots available. ${_selectedStaff?.staffName} is on leave (${staffLeave.leaveType}).',
                              style: const TextStyle(fontSize: 13, color: Colors.orange, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ] else if (availableSlots.isEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.orange.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.orange.withOpacity(0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline, color: Colors.orange, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'No available slots for ${_selectedStaff?.staffName} on ${DateFormat('EEEE').format(_selectedDate)}. Try selecting another date or staff.',
                                      style: const TextStyle(fontSize: 12, color: Colors.orange),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ] else ...[
                          const Text(
                            'Available Staff Time Slots:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: availableSlots.map((slotStr) {
                              final isSelected = _selectedSlotStr == slotStr;
                              final displayLabel = _formatSlotTime12h(slotStr);
                              return ChoiceChip(
                                label: Text(displayLabel),
                                selected: isSelected,
                                selectedColor: AppColors.primary,
                                labelStyle: TextStyle(
                                  color: isSelected ? Colors.white : AppColors.primary,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                                onSelected: (selected) {
                                  if (selected) _selectSlot(slotStr);
                                },
                              );
                            }).toList(),
                          ),
                        ],

                        const SizedBox(height: 16),

                        // Selected Time Window Display
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Selected Window:', style: TextStyle(fontWeight: FontWeight.w600)),
                              Text(
                                _selectedSlotStr != null
                                    ? '${_formatDisplayTime(_startTime)} - ${_formatDisplayTime(_endTime)}'
                                    : 'Select a time slot above',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _selectedSlotStr != null ? AppColors.primary : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // --- PAYMENT STATUS ---
                        _buildSectionHeader('Payment Status', Icons.payments_outlined),
                        SwitchListTile(
                          title: const Text('Mark as Paid'),
                          subtitle: Text(_isPaid ? 'Payment received' : 'Payment pending'),
                          value: _isPaid,
                          activeThumbColor: AppColors.success,
                          onChanged: (val) => setState(() => _isPaid = val),
                          contentPadding: EdgeInsets.zero,
                        ),

                        const SizedBox(height: 32),

                        // SUBMIT BUTTON
                        Obx(() {
                          final isSubmitting = controller.isSubmitting.value;
                          return SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              onPressed: isSubmitting ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                elevation: 0,
                              ),
                              child: isSubmitting
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text(
                                      'Create Booking',
                                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                            ),
                          );
                        }),
                        const SizedBox(height: 20),
                      ],
                    ),
                  );
                }),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, size: 20),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }
}
