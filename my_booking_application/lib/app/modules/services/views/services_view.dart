import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/service_model.dart';
import '../controllers/services_controller.dart';
import 'services_forms.dart';

class ServicesView extends GetView<ServicesController> {
  const ServicesView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Obx(() {
        if (controller.isLoading.value && controller.servicesList.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        return RefreshIndicator(
          onRefresh: () => controller.fetchServices(),
          child: Column(
            children: [
              // --- 1. COMPACT SEARCH & FILTER BAR ---
              _buildCompactHeaderControls(context),

              // --- 2. SERVICES LIST OR EMPTY STATE ---
              Expanded(
                child: controller.filteredServices.isEmpty
                    ? _buildEmptyState(context)
                    : ListView.builder(
                        padding: const EdgeInsets.only(
                          left: 14,
                          right: 14,
                          top: 4,
                          bottom: 95,
                        ),
                        itemCount: controller.filteredServices.length,
                        itemBuilder: (context, index) {
                          final service = controller.filteredServices[index];
                          return _buildCompactServiceCard(context, service);
                        },
                      ),
              ),
            ],
          ),
        );
      }),
    );
  }

  // --- COMPACT HEADER & SEARCH CONTROLS ---
  Widget _buildCompactHeaderControls(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
      child: Column(
        children: [
          // Row 1: Compact Search Input + Add Service Button
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade300,
                    ),
                  ),
                  child: TextField(
                    onChanged: (val) => controller.searchQuery.value = val,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white : AppColors.navy900,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search service name, price...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: isDark ? Colors.white38 : Colors.grey.shade500,
                      ),
                      prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Colors.grey),
                      suffixIcon: Obx(() {
                        if (controller.searchQuery.value.isEmpty) return const SizedBox.shrink();
                        return IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 16, color: Colors.grey),
                          onPressed: () => controller.searchQuery.value = '',
                        );
                      }),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: () => ServicesForm.show(context),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.add_rounded, color: Colors.white, size: 18),
                      SizedBox(width: 4),
                      Text(
                        'Add',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Row 2: Compact Filter Segment Pills + Micro Quick Stats
          Obx(() {
            return Row(
              children: [
                _buildCompactFilterChip(context, label: 'All', count: controller.totalCount, value: 'All'),
                const SizedBox(width: 6),
                _buildCompactFilterChip(context, label: 'Active', count: controller.activeCount, value: 'Active'),
                const SizedBox(width: 6),
                _buildCompactFilterChip(context, label: 'Inactive', count: controller.inactiveCount, value: 'Inactive'),
                const Spacer(),
                // Micro Avg Price Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Avg: ₹${controller.avgPrice.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white70 : Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCompactFilterChip(
    BuildContext context, {
    required String label,
    required int count,
    required String value,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSelected = controller.selectedFilter.value == value;

    return InkWell(
      onTap: () => controller.selectedFilter.value = value,
      borderRadius: BorderRadius.circular(8),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : (isDark ? AppColors.surfaceDark : Colors.white),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? Colors.white10 : Colors.grey.shade300),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : Colors.grey.shade700),
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withOpacity(0.25)
                    : (isDark ? Colors.white10 : Colors.grey.shade200),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? Colors.white70 : Colors.grey.shade800),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- SLEEK COMPACT SERVICE CARD ---
  Widget _buildCompactServiceCard(BuildContext context, ServiceModel service) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isActive = service.status ?? false;
    final categoryInfo = _inferCategoryAndIcon(service.serviceName ?? '');

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.08)
              : Colors.grey.shade200,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => _showServiceDetailModal(context, service),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                // 1. Compact Dynamic Icon
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: categoryInfo.color.withOpacity(isDark ? 0.18 : 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    categoryInfo.icon,
                    color: categoryInfo.color,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),

                // 2. Service Details (Name + Inline Specs)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          // Status Dot Indicator
                          Container(
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                              color: isActive ? Colors.green : Colors.redAccent,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              service.serviceName ?? 'Unnamed Service',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: isDark ? Colors.white : AppColors.navy900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          // Price
                          Text(
                            '₹${(service.price ?? 0.0).toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.lightBlueAccent : AppColors.primary,
                            ),
                          ),
                          Text(
                            '  •  ',
                            style: TextStyle(
                              fontSize: 10,
                              color: isDark ? Colors.white38 : Colors.grey.shade400,
                            ),
                          ),
                          // Duration
                          Icon(
                            Icons.timer_outlined,
                            size: 12,
                            color: isDark ? Colors.white60 : Colors.grey.shade600,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            _formatDuration(service.durationMinutes),
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white70 : Colors.grey.shade700,
                            ),
                          ),
                          Text(
                            '  •  ',
                            style: TextStyle(
                              fontSize: 10,
                              color: isDark ? Colors.white38 : Colors.grey.shade400,
                            ),
                          ),
                          // Category Label
                          Expanded(
                            child: Text(
                              (service.serviceType != null && service.serviceType!.trim().isNotEmpty)
                                  ? service.serviceType!
                                  : categoryInfo.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11,
                                color: categoryInfo.color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),

                // 3. Compact Active Switch & Popup Action
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Transform.scale(
                      scale: 0.7,
                      child: Switch(
                        value: isActive,
                        activeColor: Colors.green,
                        onChanged: (_) => controller.toggleServiceStatus(service),
                      ),
                    ),
                    PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.more_vert_rounded, size: 18, color: Colors.grey),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      onSelected: (val) {
                        if (val == 'edit') {
                          ServicesForm.show(context, service: service);
                        } else if (val == 'toggle') {
                          controller.toggleServiceStatus(service);
                        } else if (val == 'delete' && service.id != null) {
                          controller.deleteService(service.id!);
                        }
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'edit',
                          height: 36,
                          child: Row(
                            children: const [
                              Icon(Icons.edit_rounded, size: 16, color: Colors.blue),
                              SizedBox(width: 8),
                              Text('Edit', style: TextStyle(fontSize: 13)),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'toggle',
                          height: 36,
                          child: Row(
                            children: [
                              Icon(
                                isActive ? Icons.pause_circle_outline : Icons.play_circle_outline,
                                size: 16,
                                color: isActive ? Colors.orange : Colors.green,
                              ),
                              const SizedBox(width: 8),
                              Text(isActive ? 'Deactivate' : 'Activate', style: const TextStyle(fontSize: 13)),
                            ],
                          ),
                        ),
                        const PopupMenuDivider(height: 1),
                        PopupMenuItem(
                          value: 'delete',
                          height: 36,
                          child: Row(
                            children: const [
                              Icon(Icons.delete_outline_rounded, size: 16, color: Colors.redAccent),
                              SizedBox(width: 8),
                              Text('Delete', style: TextStyle(fontSize: 13, color: Colors.redAccent)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- SERVICE DETAILS MODAL SHEET ---
  void _showServiceDetailModal(BuildContext context, ServiceModel service) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final categoryInfo = _inferCategoryAndIcon(service.serviceName ?? '');
    final isActive = service.status ?? false;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: categoryInfo.color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(categoryInfo.icon, color: categoryInfo.color, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        categoryInfo.label.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: categoryInfo.color,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        service.serviceName ?? 'Unnamed Service',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : AppColors.navy900,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Divider(color: isDark ? Colors.white10 : Colors.grey.shade200, height: 1),
            const SizedBox(height: 12),

            _buildDetailRow(context, 'Service ID', '#${service.id ?? "N/A"}'),
            _buildDetailRow(
              context,
              'Category / Type',
              (service.serviceType != null && service.serviceType!.trim().isNotEmpty)
                  ? service.serviceType!
                  : categoryInfo.label,
            ),
            _buildDetailRow(context, 'Duration', _formatDuration(service.durationMinutes)),
            _buildDetailRow(context, 'Standard Price', '₹${(service.price ?? 0.0).toStringAsFixed(2)}'),
            _buildDetailRow(
              context,
              'Minimum Charge',
              '₹${(service.minimumBookingCharge ?? 0.0).toStringAsFixed(2)}',
            ),
            _buildDetailRow(
              context,
              'Catalog Status',
              isActive ? 'Active (Visible to Clients)' : 'Inactive (Hidden)',
              valueColor: isActive ? Colors.green : Colors.redAccent,
            ),

            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      ServicesForm.show(context, service: service);
                    },
                    icon: const Icon(Icons.edit_rounded, size: 16),
                    label: const Text('Edit Service'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      Get.find<ServicesController>().toggleServiceStatus(service);
                    },
                    icon: Icon(isActive ? Icons.pause_rounded : Icons.play_arrow_rounded, size: 16),
                    label: Text(isActive ? 'Deactivate' : 'Activate'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isActive ? Colors.orange : Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value, {
    Color? valueColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: valueColor ?? (isDark ? Colors.white : AppColors.navy900),
            ),
          ),
        ],
      ),
    );
  }

  // --- EMPTY STATE ---
  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.design_services_outlined,
                size: 48,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No services found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'No matching services in catalog. Tap below to add a new service.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => ServicesForm.show(context),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Service'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- HELPER UTILITIES ---
  String _formatDuration(double? minutes) {
    if (minutes == null || minutes <= 0) return '0 min';
    final mins = minutes.toInt();
    if (mins < 60) return '$mins min';
    final hours = mins ~/ 60;
    final remMins = mins % 60;
    if (remMins == 0) return '${hours}h';
    return '${hours}h ${remMins}m';
  }

  _CategoryMeta _inferCategoryAndIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('hair') || lower.contains('cut') || lower.contains('barber') || lower.contains('style')) {
      return _CategoryMeta('Hair & Styling', Icons.content_cut_rounded, Colors.purple);
    } else if (lower.contains('spa') || lower.contains('massage') || lower.contains('facial') || lower.contains('relax')) {
      return _CategoryMeta('Spa & Wellness', Icons.spa_rounded, Colors.teal);
    } else if (lower.contains('tooth') || lower.contains('dental') || lower.contains('doctor') || lower.contains('health')) {
      return _CategoryMeta('Health & Medical', Icons.medical_services_rounded, Colors.blue);
    } else if (lower.contains('nail') || lower.contains('makeup') || lower.contains('beauty') || lower.contains('skin')) {
      return _CategoryMeta('Beauty & Skincare', Icons.face_retouching_natural_rounded, Colors.pink);
    } else if (lower.contains('clean') || lower.contains('wash')) {
      return _CategoryMeta('Cleaning & Wash', Icons.cleaning_services_rounded, Colors.lightBlue);
    } else if (lower.contains('repair') || lower.contains('fit') || lower.contains('tech') || lower.contains('fix') || lower.contains('dev') || lower.contains('code')) {
      return _CategoryMeta('Development & Tech', Icons.code_rounded, Colors.orange);
    } else if (lower.contains('consult') || lower.contains('advice') || lower.contains('session')) {
      return _CategoryMeta('Consultation', Icons.support_agent_rounded, Colors.indigo);
    }
    return _CategoryMeta('General Service', Icons.auto_awesome_rounded, AppColors.primary);
  }
}

class _CategoryMeta {
  final String label;
  final IconData icon;
  final Color color;

  _CategoryMeta(this.label, this.icon, this.color);
}
