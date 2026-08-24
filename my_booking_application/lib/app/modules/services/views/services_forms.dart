import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/service_model.dart';
import '../controllers/services_controller.dart';

class ServicesForm extends StatefulWidget {
  final ServiceModel? service;

  const ServicesForm({super.key, this.service});

  static void show(BuildContext context, {ServiceModel? service}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ServicesForm(service: service),
    );
  }

  @override
  State<ServicesForm> createState() => _ServicesFormState();
}

class _ServicesFormState extends State<ServicesForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _typeController;
  late TextEditingController _priceController;
  late TextEditingController _durationController;
  late TextEditingController _minChargeController;
  final FocusNode _typeFocusNode = FocusNode();

  bool _status = true;
  bool _isSubmitting = false;

  final List<int> _selectedStaffIds = [];
  final List<String> _selectedServiceTypes = [];

  @override
  void initState() {
    super.initState();
    final controller = Get.find<ServicesController>();

    _nameController = TextEditingController(text: widget.service?.serviceName ?? '');
    _typeController = TextEditingController();

    if (widget.service?.serviceType != null && widget.service!.serviceType!.trim().isNotEmpty) {
      final initialTypes = widget.service!.serviceType!
          .split(',')
          .map((t) => t.trim())
          .where((t) => t.isNotEmpty)
          .toList();
      _selectedServiceTypes.addAll(initialTypes);
    }

    _priceController = TextEditingController(
      text: widget.service?.price != null ? widget.service!.price!.toStringAsFixed(2) : '',
    );
    _durationController = TextEditingController(
      text: widget.service?.durationMinutes != null
          ? widget.service!.durationMinutes!.toStringAsFixed(0)
          : '30',
    );
    _minChargeController = TextEditingController(
      text: widget.service?.minimumBookingCharge != null
          ? widget.service!.minimumBookingCharge!.toStringAsFixed(2)
          : '0.00',
    );
    _status = widget.service?.status ?? true;

    // Load existing staff assignments if editing
    if (widget.service?.id != null) {
      final assigned = controller.staffServicesList
          .where((ss) => ss['service_id'] == widget.service!.id)
          .map((ss) => int.tryParse(ss['staff_id'].toString()) ?? 0)
          .where((id) => id > 0)
          .toList();
      _selectedStaffIds.addAll(assigned);
    }
  }

  @override
  void dispose() {
    _typeFocusNode.dispose();
    _typeController.dispose();
    _nameController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    _minChargeController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate() || _isSubmitting) return;

    setState(() => _isSubmitting = true);

    final controller = Get.find<ServicesController>();

    final serviceTypeVal = _selectedServiceTypes.isNotEmpty
        ? _selectedServiceTypes.join(', ')
        : _typeController.text.trim();

    final data = {
      'service_name': _nameController.text.trim(),
      'service_type': serviceTypeVal,
      'price': double.tryParse(_priceController.text.trim()) ?? 0.0,
      'duration_minutes': double.tryParse(_durationController.text.trim()) ?? 30.0,
      'minimum_booking_charge': double.tryParse(_minChargeController.text.trim()) ?? 0.0,
      'status': _status,
    };

    bool success = false;
    if (widget.service != null && widget.service!.id != null) {
      success = await controller.updateService(
        widget.service!.id!,
        data,
        assignedStaffIds: _selectedStaffIds,
      );
    } else {
      success = await controller.createService(
        data,
        assignedStaffIds: _selectedStaffIds,
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
    final isEdit = widget.service != null;
    final controller = Get.find<ServicesController>();

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
              // Modal Handle & Top Title Bar
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
                      isEdit ? Icons.edit_note_rounded : Icons.add_task_rounded,
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
                          isEdit ? 'Edit Service' : 'Add New Service',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppColors.navy900,
                            fontFamily: 'Syne',
                          ),
                        ),
                        Text(
                          isEdit ? 'Update service parameters & staff assignment' : 'Define a service offering for your business',
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

              // ── SECTION 1: SERVICE DETAILS ──
              _buildSectionHeader('Service Details'),
              const SizedBox(height: 10),

              // Service Name
              TextFormField(
                controller: _nameController,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white : AppColors.navy900,
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Service name is required';
                  if (val.trim().length < 2) return 'Service name must be at least 2 characters';
                  return null;
                },
                decoration: _buildInputDecoration(
                  context,
                  label: 'Service Name *',
                  hint: 'e.g. Full Body Checkup, Haircut & Style',
                  icon: Icons.design_services_outlined,
                ),
              ),
              const SizedBox(height: 12),

              // ── SERVICE TYPE / CATEGORY MULTI-SELECT DROPDOWN & TYPEAHEAD ──
              Obx(() {
                final suggestions = controller.availableServiceTypes;
                final filter = _typeController.text.toLowerCase().trim();

                final filteredSuggestions = suggestions.where((option) {
                  return filter.isEmpty || option.toLowerCase().contains(filter);
                }).toList();

                final isAllSelected = suggestions.isNotEmpty &&
                    _selectedServiceTypes.length >= suggestions.length &&
                    suggestions.every((s) => _selectedServiceTypes.contains(s));

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Service Type / Category',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white70 : AppColors.navy900,
                          ),
                        ),
                        if (suggestions.isNotEmpty)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _selectedServiceTypes.clear();
                                    _selectedServiceTypes.addAll(suggestions);
                                  });
                                },
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: const Size(64, 24),
                                ),
                                child: const Text(
                                  'Select All',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _selectedServiceTypes.clear();
                                  });
                                },
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: const Size(50, 24),
                                ),
                                child: const Text(
                                  'Clear All',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.redAccent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // TypeAhead Search / Custom Category Input
                    TextFormField(
                      controller: _typeController,
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? Colors.white : AppColors.navy900,
                      ),
                      onChanged: (_) => setState(() {}),
                      onFieldSubmitted: (val) {
                        final trimmed = val.trim();
                        if (trimmed.isNotEmpty) {
                          setState(() {
                            if (!_selectedServiceTypes.contains(trimmed)) {
                              _selectedServiceTypes.add(trimmed);
                            }
                            _typeController.clear();
                          });
                        }
                      },
                      decoration: _buildInputDecoration(
                        context,
                        label: 'Type Ahead or Filter Categories',
                        hint: 'Type new category name or filter below...',
                        icon: Icons.category_outlined,
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary),
                          tooltip: 'Add Custom Category',
                          onPressed: () {
                            final trimmed = _typeController.text.trim();
                            if (trimmed.isNotEmpty) {
                              setState(() {
                                if (!_selectedServiceTypes.contains(trimmed)) {
                                  _selectedServiceTypes.add(trimmed);
                                }
                                _typeController.clear();
                              });
                            }
                          },
                        ),
                      ),
                    ),

                    // Selected Chips Display
                    if (_selectedServiceTypes.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _selectedServiceTypes.map((type) {
                          return Chip(
                            label: Text(
                              type,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            backgroundColor: AppColors.primary,
                            deleteIcon: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                            onDeleted: () {
                              setState(() {
                                _selectedServiceTypes.remove(type);
                              });
                            },
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          );
                        }).toList(),
                      ),
                    ],

                    // Inline Multi-Select Dropdown List
                    if (suggestions.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        constraints: const BoxConstraints(maxHeight: 180),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? Colors.white10 : Colors.grey.shade300,
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: ListView(
                            shrinkWrap: true,
                            padding: EdgeInsets.zero,
                            children: [
                              // Select All Option
                              if (filter.isEmpty) ...[
                                InkWell(
                                  onTap: () {
                                    setState(() {
                                      if (isAllSelected) {
                                        _selectedServiceTypes.clear();
                                      } else {
                                        _selectedServiceTypes.clear();
                                        _selectedServiceTypes.addAll(suggestions);
                                      }
                                    });
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isAllSelected
                                              ? Icons.check_box_rounded
                                              : Icons.check_box_outline_blank_rounded,
                                          size: 18,
                                          color: AppColors.primary,
                                        ),
                                        const SizedBox(width: 8),
                                        const Text(
                                          'Select All Categories',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                Divider(height: 1, color: isDark ? Colors.white10 : Colors.grey.shade200),
                              ],

                              // Filtered Suggestions List
                              ...filteredSuggestions.map((opt) {
                                final isChecked = _selectedServiceTypes.contains(opt);
                                return InkWell(
                                  onTap: () {
                                    setState(() {
                                      if (isChecked) {
                                        _selectedServiceTypes.remove(opt);
                                      } else {
                                        _selectedServiceTypes.add(opt);
                                      }
                                    });
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isChecked
                                              ? Icons.check_box_rounded
                                              : Icons.check_box_outline_blank_rounded,
                                          size: 18,
                                          color: isChecked ? AppColors.primary : Colors.grey,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            opt,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: isChecked ? FontWeight.bold : FontWeight.normal,
                                              color: isDark ? Colors.white : AppColors.navy900,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                );
              }),
              const SizedBox(height: 12),

              // Duration Input
              TextFormField(
                controller: _durationController,
                keyboardType: TextInputType.number,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white : AppColors.navy900,
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Duration is required';
                  final mins = double.tryParse(val.trim());
                  if (mins == null || mins < 1) return 'Duration must be at least 1 minute';
                  return null;
                },
                decoration: _buildInputDecoration(
                  context,
                  label: 'Duration (Minutes) *',
                  hint: '30',
                  icon: Icons.timer_outlined,
                  suffixText: 'min',
                ),
              ),
              const SizedBox(height: 20),

              // ── SECTION 2: PRICING & CHARGES ──
              _buildSectionHeader('Pricing & Charges'),
              const SizedBox(height: 10),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Standard Price
                  Expanded(
                    child: TextFormField(
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? Colors.white : AppColors.navy900,
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'Price is required';
                        final price = double.tryParse(val.trim());
                        if (price == null || price < 0) return 'Price cannot be negative';
                        return null;
                      },
                      decoration: _buildInputDecoration(
                        context,
                        label: 'Standard Price *',
                        hint: '500.00',
                        prefixText: '₹ ',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Min Booking Charge
                  Expanded(
                    child: TextFormField(
                      controller: _minChargeController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? Colors.white : AppColors.navy900,
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return null;
                        final charge = double.tryParse(val.trim());
                        final price = double.tryParse(_priceController.text.trim()) ?? 0.0;
                        if (charge == null || charge < 0) return 'Cannot be negative';
                        if (price > 0 && charge >= price) return 'Must be less than price';
                        return null;
                      },
                      decoration: _buildInputDecoration(
                        context,
                        label: 'Min. Booking Charge',
                        hint: '100.00',
                        prefixText: '₹ ',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ── SECTION 3: ASSIGN STAFF (Matches Client Web App) ──
              _buildSectionHeader('Assign Staff Members'),
              const SizedBox(height: 8),

              Obx(() {
                final staff = controller.staffList;
                if (staff.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'No staff members found. Add staff in Staff Directory to assign them.',
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : Colors.grey.shade600),
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'Select staff members who provide this service:',
                            style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : Colors.grey.shade600),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _selectedStaffIds.clear();
                                  _selectedStaffIds.addAll(staff.map((s) => s.id!).where((id) => id > 0));
                                });
                              },
                              style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(60, 24)),
                              child: const Text('Select All', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 4),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _selectedStaffIds.clear();
                                });
                              },
                              style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(40, 24)),
                              child: const Text('Clear', style: TextStyle(fontSize: 11, color: Colors.redAccent)),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: staff.map((s) {
                        final isSelected = s.id != null && _selectedStaffIds.contains(s.id);
                        final labelText = '${s.staffName ?? 'Staff'}${s.role != null && s.role!.isNotEmpty ? ' (${s.role})' : ''}';

                        return FilterChip(
                          selected: isSelected,
                          label: Text(labelText),
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
                              if (s.id != null) {
                                if (selected) {
                                  _selectedStaffIds.add(s.id!);
                                } else {
                                  _selectedStaffIds.remove(s.id!);
                                }
                              }
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                );
              }),
              const SizedBox(height: 20),

              // ── SECTION 4: CATALOG STATUS ──
              _buildSectionHeader('Catalog Status'),
              const SizedBox(height: 10),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.grey.shade200,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _status
                                ? Colors.green.withOpacity(0.12)
                                : Colors.red.withOpacity(0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _status ? Icons.check_circle_rounded : Icons.pause_circle_rounded,
                            color: _status ? Colors.green : Colors.redAccent,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Service Visibility',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: isDark ? Colors.white : AppColors.navy900,
                              ),
                            ),
                            Text(
                              _status ? 'Active & visible for bookings' : 'Inactive (Hidden from catalog)',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white60 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Switch(
                      value: _status,
                      activeColor: Colors.green,
                      onChanged: (val) => setState(() => _status = val),
                    ),
                  ],
                ),
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
                          isEdit ? 'Update Service' : 'Create Service',
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

  Widget _buildSectionHeader(String title) {
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
    String? prefixText,
    String? suffixText,
    Widget? suffixIcon,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(
        fontSize: 13,
        color: isDark ? Colors.white70 : Colors.grey.shade700,
      ),
      hintText: hint,
      hintStyle: TextStyle(
        fontSize: 13,
        color: isDark ? Colors.white38 : Colors.grey.shade400,
      ),
      prefixIcon: icon != null
          ? Icon(
              icon,
              size: 18,
              color: isDark ? Colors.white70 : AppColors.accent,
            )
          : null,
      prefixText: prefixText,
      prefixStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: isDark ? Colors.white : AppColors.navy900,
      ),
      suffixIcon: suffixIcon,
      suffixText: suffixText,
      suffixStyle: TextStyle(
        fontSize: 13,
        color: isDark ? Colors.white60 : Colors.grey.shade600,
      ),
      filled: true,
      fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade300,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: AppColors.primary,
          width: 1.5,
        ),
      ),
    );
  }
}
