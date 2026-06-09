import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/booking_model.dart';
import '../controllers/bookings_controller.dart';

class BookingsView extends GetView<BookingsController> {
  const BookingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildFilterBar(),
        Expanded(
          child: Obx(() {
            if (controller.isLoading.value && controller.bookings.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (controller.filteredBookings.isEmpty) {
              return _buildEmptyState();
            }

            return RefreshIndicator(
              onRefresh: () async => controller.refreshData(),
              child: ListView.builder(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
                itemCount: controller.filteredBookings.length,
                itemBuilder: (context, index) {
                  return _buildBookingCard(context, controller.filteredBookings[index]);
                },
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildFilterBar() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildFilterChip('All', 'all'),
          _buildFilterChip('Pending', 'pending'),
          _buildFilterChip('Confirmed', 'confirmed'),
          _buildFilterChip('Cancelled', 'cancelled'),
          _buildFilterChip('Completed', 'completed'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    return Obx(() {
      final isSelected = controller.selectedStatus.value == value;
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: FilterChip(
          label: Text(label),
          selected: isSelected,
          onSelected: (_) => controller.setFilter(value),
          backgroundColor: Colors.white,
          selectedColor: AppColors.primary.withOpacity(0.2),
          checkmarkColor: AppColors.primary,
          labelStyle: TextStyle(
            color: isSelected ? AppColors.primary : AppColors.textSecondaryLight,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          side: BorderSide(color: isSelected ? AppColors.primary : AppColors.dividerLight),
        ),
      );
    });
  }

  Widget _buildBookingCard(BuildContext context, BookingModel booking) {
    final statusColor = _getStatusColor(booking.status ?? '');
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Theme.of(context).brightness == Brightness.dark 
            ? Border.all(color: Colors.white10, width: 1) 
            : null,
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black26 
                : Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDateBadge(context, booking.bookingDate ?? ''),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Booking #${booking.id}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Theme.of(context).textTheme.titleMedium?.color,
                            ),
                          ),
                          _buildStatusBadge(context, booking.status ?? '', statusColor),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 16, color: AppColors.lavender400),
                          const SizedBox(width: 4),
                          Text(
                            '${booking.startTime} - ${booking.endTime}',
                            style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.payments_outlined, size: 16, color: AppColors.lavender400),
                          const SizedBox(width: 4),
                          Text(
                            '₹${booking.totalAmount?.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: Theme.of(context).brightness == Brightness.dark ? AppColors.navy300 : AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (booking.status?.toLowerCase() == 'pending') ...[
            const Divider(height: 1),
            _buildActionButtons(booking),
          ],
        ],
      ),
    );
  }

  Widget _buildDateBadge(BuildContext context, String dateStr) {
    DateTime? date;
    try {
      date = DateTime.parse(dateStr);
    } catch (_) {}
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: (Theme.of(context).brightness == Brightness.dark ? AppColors.navy300 : AppColors.primary).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            date != null ? DateFormat('MMM').format(date).toUpperCase() : '---',
            style: TextStyle(
              color: Theme.of(context).brightness == Brightness.dark ? AppColors.navy300 : AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          Text(
            date != null ? date.day.toString() : '--',
            style: TextStyle(
              color: Theme.of(context).brightness == Brightness.dark ? AppColors.navy300 : AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context, String status, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildActionButtons(BookingModel booking) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: TextButton.icon(
              onPressed: () => _confirmAction(booking.id!, 'cancelled'),
              icon: const Icon(Icons.close_rounded, color: AppColors.error, size: 18),
              label: const Text('Cancel', style: TextStyle(color: AppColors.error)),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => controller.updateBookingStatus(booking.id!, 'confirmed'),
              icon: const Icon(Icons.check_rounded, size: 18),
              label: const Text('Confirm'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmAction(int id, String status) {
    Get.dialog(
      AlertDialog(
        title: Text('Confirm $status'),
        content: Text('Are you sure you want to $status this booking?'),
        actions: [
          TextButton(onPressed: () => Get.back(), child: const Text('No')),
          TextButton(
            onPressed: () {
              Get.back();
              controller.updateBookingStatus(id, status);
            },
            child: const Text('Yes', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending': return AppColors.warning;
      case 'confirmed': return AppColors.success;
      case 'cancelled': return AppColors.error;
      case 'completed': return AppColors.primary;
      default: return AppColors.textTertiaryLight;
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.calendar_today_outlined, size: 64, color: AppColors.dividerLight),
          const SizedBox(height: 16),
          const Text(
            'No bookings found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }
}
