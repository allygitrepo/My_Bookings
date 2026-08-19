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
import '../../../data/services/razorpay_service.dart';
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
  String _selectedPaymentMethod = 'Cash';
  final TextEditingController _paidAmountController = TextEditingController();

  double get _totalPrice {
    return _selectedServices.fold(0.0, (sum, s) => sum + (s.price ?? 0.0));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _paidAmountController.dispose();
    super.dispose();
  }

  List<StaffModel> _getFilteredStaffForSelectedServices() {
    var list = controller.staffList.toList();

    // Filter by location first if selected
    if (_selectedLocation != null) {
      list = list.where((staff) {
        if (staff.locations == null || staff.locations!.isEmpty) return true;
        return staff.locations!.any((l) => l.id == _selectedLocation!.id);
      }).toList();
    }

    // Filter by selected services if any are selected
    if (_selectedServices.isNotEmpty) {
      final selectedServiceIds = _selectedServices.map((s) => s.id!).toSet();
      list = list.where((staff) {
        final staffSvcIds = (staff.serviceIds ?? []).toSet();
        if (staffSvcIds.isEmpty) {
          final mappingSvcIds = controller.staffServicesList
              .where((ss) => ss['staff_id'] != null && int.tryParse(ss['staff_id'].toString()) == staff.id)
              .map((ss) => int.tryParse(ss['service_id']?.toString() ?? '0') ?? 0)
              .where((id) => id > 0)
              .toSet();
          if (mappingSvcIds.isEmpty) return false;
          return selectedServiceIds.any((id) => mappingSvcIds.contains(id));
        }
        return selectedServiceIds.any((id) => staffSvcIds.contains(id));
      }).toList();
    }

    return list;
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

      // Automatically unselect staff if they do not offer the newly selected services
      if (_selectedStaff != null) {
        final availableStaff = _getFilteredStaffForSelectedServices();
        if (!availableStaff.any((s) => s.id == _selectedStaff!.id)) {
          _selectedStaff = null;
          _selectedSlotStr = null;
        }
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

    final String todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final String nowTimeStr = DateFormat('HH:mm:ss').format(DateTime.now());

    int totalServiceDuration = 0;
    for (var s in _selectedServices) {
      totalServiceDuration += (s.durationMinutes?.toInt() ?? stepMin);
    }
    if (totalServiceDuration <= 0) totalServiceDuration = stepMin;

    return slots.where((slot) {
      // Past time check for today
      if (selectedDateStr == todayStr && slot.compareTo(nowTimeStr) < 0) {
        return false;
      }

      final slotStartMins = _parseMins(slot);
      final candidateEndMins = slotStartMins + totalServiceDuration;

      // Business Closure Check (Timed)
      if (closure != null && closure.isAllDay != true && closure.startTime != null && closure.endTime != null) {
        final cStartMins = _parseMins(closure.startTime!);
        final cEndMins = _parseMins(closure.endTime!);
        if (slotStartMins < cEndMins && candidateEndMins > cStartMins) {
          return false;
        }
      }

      // Staff Leave Check (Timed)
      if (staffLeave != null && staffLeave.isAllDay != true && staffLeave.startTime != null && staffLeave.endTime != null) {
        final lStartMins = _parseMins(staffLeave.startTime!);
        final lEndMins = _parseMins(staffLeave.endTime!);
        if (slotStartMins < lEndMins && candidateEndMins > lStartMins) {
          return false;
        }
      }

      // Existing Bookings Overlap Check
      final isBooked = controller.bookings.any((b) {
        if (b.staffId != null && _selectedStaff!.id != null && b.staffId != _selectedStaff!.id) {
          return false;
        }

        final String bDate = (b.bookingDate ?? '').split('T')[0];
        if (bDate.isNotEmpty && bDate != selectedDateStr) {
          return false;
        }

        final bStatus = (b.status ?? '').toLowerCase();
        if (bStatus == 'cancelled' || bStatus == 'false' || bStatus == '0') {
          return false;
        }

        final bStartStr = b.startTime ?? '00:00:00';
        final bStartMins = _parseMins(bStartStr);
        final bEndMins = (b.endTime != null && b.endTime!.isNotEmpty)
            ? _parseMins(b.endTime!)
            : bStartMins + stepMin;

        return (slotStartMins < bEndMins && candidateEndMins > bStartMins);
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

    final double paidAmt = _isPaid
        ? (double.tryParse(_paidAmountController.text.trim()) ?? _totalPrice)
        : 0.0;
    final isRazorpay = _selectedPaymentMethod == 'Razorpay';

    final createdBooking = await controller.createBooking(
      isNewCustomer: _isNewCustomer,
      customerId: _selectedCustomer?.id,
      newCustomerName: _nameController.text.trim(),
      newCustomerPhone: _phoneController.text.trim(),
      newCustomerEmail: null,
      locationId: _selectedLocation!.id!,
      serviceIds: _selectedServices.map((s) => s.id!).toList(),
      staffId: _selectedStaff!.id!,
      bookingDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
      startTime: _formatTimeOfDay(_startTime),
      endTime: _formatTimeOfDay(_endTime),
      isPaid: isRazorpay ? false : _isPaid,
      paymentMethod: _selectedPaymentMethod,
      paidAmount: isRazorpay ? 0.0 : paidAmt,
      totalAmount: _totalPrice,
      showSnackbar: !isRazorpay,
    );

    if (createdBooking != null && mounted) {
      Navigator.pop(context);

      if (isRazorpay && createdBooking.id != null) {
        final custName = _isNewCustomer ? _nameController.text.trim() : (_selectedCustomer?.name ?? 'Customer');
        final custPhone = _isNewCustomer ? _phoneController.text.trim() : (_selectedCustomer?.phone ?? '9999999999');

        final rzpService = Get.find<RazorpayService>();
        rzpService.initiatePayment(
          bookingId: createdBooking.id!,
          amount: _totalPrice > 0 ? _totalPrice : 1.0,
          customerName: custName,
          customerPhone: custPhone,
          onSuccess: (response) async {
            if (response.paymentId != null && response.orderId != null && response.signature != null) {
              final verified = await rzpService.verifyPayment(
                bookingId: createdBooking.id!,
                razorpayOrderId: response.orderId!,
                razorpayPaymentId: response.paymentId!,
                razorpaySignature: response.signature!,
                amount: _totalPrice > 0 ? _totalPrice : 1.0,
              );

              if (verified) {
                controller.fetchBookings();
              }
            }
          },
          onFailure: (error) async {
            // Remove the temporary pending booking if Razorpay payment is cancelled or fails
            await controller.deleteBooking(createdBooking.id!, showSnackbar: false);
            Get.snackbar(
              'Payment Cancelled',
              'Razorpay payment was cancelled or failed. Booking was not created.',
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.orange,
              colorText: Colors.white,
            );
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.navy300 : AppColors.primary;

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
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
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
                      icon: Icon(Icons.close, color: isDark ? Colors.white70 : Colors.black87),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: isDark ? Colors.white12 : Colors.black12),

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

                  final filteredStaffList = _getFilteredStaffForSelectedServices();

                  final currentStaffValue = filteredStaffList.any((s) => s.id == _selectedStaff?.id)
                      ? filteredStaffList.firstWhere((s) => s.id == _selectedStaff?.id)
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
                              color: Colors.red.withOpacity(isDark ? 0.2 : 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.red.withOpacity(0.4)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.event_busy, color: Colors.redAccent, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Business Closure: ${closure.title ?? 'Holiday'} (${closure.isAllDay == true ? "Closed All Day" : "${closure.startTime} - ${closure.endTime}"})',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.redAccent),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // --- CUSTOMER SECTION ---
                        _buildSectionHeader(context, 'Customer Details', Icons.person_outline, isDark, primaryColor),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ChoiceChip(
                                label: const Center(child: Text('Existing Customer')),
                                selected: !_isNewCustomer,
                                selectedColor: primaryColor,
                                labelStyle: TextStyle(
                                  color: !_isNewCustomer
                                      ? Colors.white
                                      : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                                  fontWeight: !_isNewCustomer ? FontWeight.bold : FontWeight.normal,
                                ),
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
                                selectedColor: primaryColor,
                                labelStyle: TextStyle(
                                  color: _isNewCustomer
                                      ? Colors.white
                                      : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                                  fontWeight: _isNewCustomer ? FontWeight.bold : FontWeight.normal,
                                ),
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
                            dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            decoration: _inputDecoration(context, 'Select Customer', Icons.person, isDark, primaryColor),
                            items: controller.customersList.map((customer) {
                              return DropdownMenuItem(
                                value: customer,
                                child: Text(
                                  '${customer.name ?? 'Guest'} (${customer.phone ?? 'No Phone'})',
                                  style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedCustomer = val),
                          ),
                        ] else ...[
                          TextFormField(
                            controller: _nameController,
                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            decoration: _inputDecoration(context, 'Customer Name *', Icons.person, isDark, primaryColor),
                            validator: (val) => (val == null || val.trim().isEmpty) ? 'Name is required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            decoration: _inputDecoration(context, 'Phone Number *', Icons.phone, isDark, primaryColor),
                            validator: (val) => (val == null || val.trim().isEmpty) ? 'Phone number is required' : null,
                          ),
                        ],

                        const SizedBox(height: 24),

                        // --- LOCATION SECTION ---
                        _buildSectionHeader(context, 'Location', Icons.location_on_outlined, isDark, primaryColor),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<LocationModel>(
                          value: currentLocationValue,
                          dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                          style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                          decoration: _inputDecoration(context, 'Select Location', Icons.storefront, isDark, primaryColor),
                          items: controller.locationsList.map((loc) {
                            return DropdownMenuItem(
                              value: loc,
                              child: Text(
                                loc.locationName ?? 'Default Location',
                                style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) => setState(() {
                            _selectedLocation = val;
                            _selectedSlotStr = null;
                            _selectedServices.clear();
                          }),
                        ),

                        const SizedBox(height: 24),

                        // --- SERVICES SECTION ---
                        _buildSectionHeader(context, 'Services', Icons.medical_services_outlined, isDark, primaryColor),
                        const SizedBox(height: 8),
                        Builder(builder: (context) {
                          if (_selectedLocation == null) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.surfaceDark : AppColors.violet50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark ? Colors.white12 : AppColors.primary.withOpacity(0.2),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.location_off_outlined, color: isDark ? AppColors.lavender400 : AppColors.primary, size: 20),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'Please select a location above to see its available services.',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          final filteredServices = controller.servicesList.where((service) {
                            try {
                              final locIds = service.safeLocationIds;
                              if (locIds == null || locIds.isEmpty) return true;
                              return locIds.contains(_selectedLocation!.id);
                            } catch (_) {
                              return true;
                            }
                          }).toList();

                          if (filteredServices.isEmpty) {
                            return Text(
                              'No services available for ${_selectedLocation!.locationName ?? "this location"}',
                              style: TextStyle(color: isDark ? AppColors.lavender400 : Colors.grey[700]),
                            );
                          }

                          return Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: filteredServices.map((service) {
                              final isSelected = _selectedServices.any((s) => s.id == service.id);
                              final durationStr = (service.durationMinutes != null && service.durationMinutes! > 0)
                                  ? '${service.durationMinutes!.toStringAsFixed(0)}m'
                                  : '';
                              final priceStr = service.price != null
                                  ? '₹${service.price!.toStringAsFixed(0)}'
                                  : '₹0';
                              final chipLabel = durationStr.isNotEmpty
                                  ? '${service.serviceName} ($durationStr • $priceStr)'
                                  : '${service.serviceName} ($priceStr)';

                              return FilterChip(
                                label: Text(chipLabel),
                                selected: isSelected,
                                onSelected: (sel) => _onServiceSelected(service, sel),
                                selectedColor: primaryColor.withOpacity(isDark ? 0.3 : 0.2),
                                checkmarkColor: primaryColor,
                                labelStyle: TextStyle(
                                  color: isSelected ? primaryColor : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                              );
                            }).toList(),
                          );
                        }),

                        const SizedBox(height: 24),

                        // --- STAFF SECTION ---
                        _buildSectionHeader(context, 'Staff Member', Icons.badge_outlined, isDark, primaryColor),
                        const SizedBox(height: 8),
                        Builder(builder: (context) {
                          if (_selectedServices.isEmpty) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.surfaceDark : AppColors.violet50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark ? Colors.white12 : AppColors.primary.withOpacity(0.2),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.info_outline, color: isDark ? AppColors.lavender400 : AppColors.primary, size: 20),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'Please select a service above to see staff members who provide it.',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          if (filteredStaffList.isEmpty) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.surfaceDark : Colors.orange.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.orange.withOpacity(0.3)),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.people_outline, color: Colors.orangeAccent, size: 20),
                                  SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'No staff members are assigned to provide the selected service(s).',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.orangeAccent),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          return DropdownButtonFormField<StaffModel>(
                            value: currentStaffValue,
                            dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            decoration: _inputDecoration(context, 'Assign Staff', Icons.people_outline, isDark, primaryColor),
                            items: filteredStaffList.map((staff) {
                              return DropdownMenuItem(
                                value: staff,
                                child: Text(
                                  '${staff.staffName} (${staff.role ?? 'Staff'})',
                                  style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() {
                              _selectedStaff = val;
                              _selectedSlotStr = null;
                            }),
                          );
                        }),

                        // --- STAFF LEAVE WARNING BANNER ---
                        if (staffLeave != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(isDark ? 0.2 : 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.orange.withOpacity(0.4)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.beach_access, color: Colors.orangeAccent, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${_selectedStaff?.staffName} is on leave (${staffLeave.leaveType ?? 'Leave'}) ${staffLeave.isAllDay == true ? 'All Day' : 'during ${staffLeave.startTime} - ${staffLeave.endTime}'}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orangeAccent),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // --- DATE & AVAILABLE SLOTS SECTION ---
                        _buildSectionHeader(context, 'Date & Time Slot', Icons.calendar_today_outlined, isDark, primaryColor),
                        const SizedBox(height: 12),
                        InkWell(
                          onTap: _pickDate,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.surfaceDark : Colors.white,
                              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.event, size: 20, color: primaryColor),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    DateFormat('EEEE, MMM dd, yyyy').format(_selectedDate),
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Theme.of(context).textTheme.bodyLarge?.color,
                                    ),
                                  ),
                                ),
                                Icon(Icons.arrow_drop_down, color: isDark ? AppColors.lavender400 : Colors.grey),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // AVAILABLE STAFF TIME SLOTS
                        if (_selectedStaff == null) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'Please select a staff member to see available time slots.',
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.lavender400 : Colors.grey,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ] else if (closure != null && closure.isAllDay == true) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No slots available. Business is closed for ${closure.title ?? 'Holiday'}.',
                              style: const TextStyle(fontSize: 13, color: Colors.redAccent, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ] else if (staffLeave != null && staffLeave.isAllDay == true) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No slots available. ${_selectedStaff?.staffName} is on leave (${staffLeave.leaveType}).',
                              style: const TextStyle(fontSize: 13, color: Colors.orangeAccent, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ] else if (availableSlots.isEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.orange.withOpacity(isDark ? 0.2 : 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.orange.withOpacity(0.4)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline, color: Colors.orangeAccent, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'No available slots for ${_selectedStaff?.staffName} on ${DateFormat('EEEE').format(_selectedDate)}. Try selecting another date or staff.',
                                      style: const TextStyle(fontSize: 12, color: Colors.orangeAccent),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ] else ...[
                          Text(
                            'Available Staff Time Slots:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: primaryColor),
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
                                selectedColor: primaryColor,
                                labelStyle: TextStyle(
                                  color: isSelected
                                      ? Colors.white
                                      : (isDark ? AppColors.textPrimaryDark : AppColors.primary),
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
                            color: primaryColor.withOpacity(isDark ? 0.15 : 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: isDark ? Border.all(color: primaryColor.withOpacity(0.3)) : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Selected Window:',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Theme.of(context).textTheme.bodyLarge?.color,
                                ),
                              ),
                              Text(
                                _selectedSlotStr != null
                                    ? '${_formatDisplayTime(_startTime)} - ${_formatDisplayTime(_endTime)}'
                                    : 'Select a time slot above',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _selectedSlotStr != null ? primaryColor : (isDark ? AppColors.lavender400 : Colors.grey),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // --- PAYMENT OPTIONS & STATUS ---
                        _buildSectionHeader(context, 'Payment Options & Status', Icons.payments_outlined, isDark, primaryColor),
                        const SizedBox(height: 12),
                        
                        Text(
                          'Select Payment Method:',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildPaymentMethodChip(context, 'Cash', Icons.money_rounded, isDark, primaryColor)),
                            const SizedBox(width: 6),
                            Expanded(child: _buildPaymentMethodChip(context, 'Razorpay', Icons.credit_card_rounded, isDark, primaryColor)),
                            const SizedBox(width: 6),
                            Expanded(child: _buildPaymentMethodChip(context, 'UPI', Icons.qr_code_2_rounded, isDark, primaryColor)),
                            const SizedBox(width: 6),
                            Expanded(child: _buildPaymentMethodChip(context, 'Card', Icons.payment_rounded, isDark, primaryColor)),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Mark as Paid Switch
                        SwitchListTile(
                          title: Text(
                            'Mark Payment as Received',
                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            _isPaid ? 'Payment received via $_selectedPaymentMethod' : 'Payment pending (Pay on Arrival)',
                            style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color),
                          ),
                          value: _isPaid,
                          activeThumbColor: AppColors.success,
                          onChanged: (val) {
                            setState(() {
                              _isPaid = val;
                              if (val) {
                                _paidAmountController.text = _totalPrice.toStringAsFixed(0);
                              } else {
                                _paidAmountController.clear();
                              }
                            });
                          },
                          contentPadding: EdgeInsets.zero,
                        ),

                        if (_isPaid) ...[
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _paidAmountController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                            decoration: _inputDecoration(context, 'Collected Amount (₹)', Icons.currency_rupee_rounded, isDark, primaryColor),
                          ),
                        ],

                        const SizedBox(height: 16),

                        // Pricing Summary Box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.surfaceDark : AppColors.violet50,
                            borderRadius: BorderRadius.circular(16),
                            border: isDark
                                ? Border.all(color: Colors.white10)
                                : Border.all(color: AppColors.primary.withOpacity(0.2)),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Total Booking Amount:', style: TextStyle(fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge?.color)),
                                  Text(
                                    '₹${_totalPrice.toStringAsFixed(0)}',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: primaryColor),
                                  ),
                                ],
                              ),
                              if (_isPaid) ...[
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Amount Collected:', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w600)),
                                    Text(
                                      '₹${(double.tryParse(_paidAmountController.text) ?? _totalPrice).toStringAsFixed(0)}',
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.success),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
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
                                backgroundColor: primaryColor,
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

  Widget _buildSectionHeader(BuildContext context, String title, IconData icon, bool isDark, Color primaryColor) {
    return Row(
      children: [
        Icon(icon, size: 18, color: primaryColor),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            color: Theme.of(context).textTheme.titleMedium?.color,
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(BuildContext context, String label, IconData icon, bool isDark, Color primaryColor) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
      prefixIcon: Icon(icon, size: 20, color: primaryColor),
      filled: true,
      fillColor: isDark ? AppColors.surfaceDark : Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: isDark ? const BorderSide(color: Colors.white12) : BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: isDark ? const BorderSide(color: Colors.white12) : const BorderSide(color: AppColors.borderLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: primaryColor, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  Widget _buildPaymentMethodChip(BuildContext context, String label, IconData icon, bool isDark, Color primaryColor) {
    final isSelected = _selectedPaymentMethod == label;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedPaymentMethod = label;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? AppColors.accent.withOpacity(0.2) : primaryColor.withOpacity(0.1))
              : (isDark ? AppColors.surfaceDark : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? (isDark ? AppColors.accent : primaryColor)
                : (isDark ? Colors.white12 : AppColors.borderLight),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected
                  ? (isDark ? AppColors.accent : primaryColor)
                  : (isDark ? AppColors.lavender400 : Colors.grey),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected
                    ? (isDark ? AppColors.accent : primaryColor)
                    : Theme.of(context).textTheme.bodyMedium?.color,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
