import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../../../data/models/service_model.dart';
import '../controllers/services_controller.dart';

class ServicesView extends GetView<ServicesController> {
  const ServicesView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (controller.isLoading.value && controller.servicesList.isEmpty) {
        return const Center(child: CircularProgressIndicator());
      }
      
      if (controller.servicesList.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.secondary.withOpacity(0.5)),
              const SizedBox(height: 16),
              const Text(
                'No services found',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Services for your organization will appear here.',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        );
      }

      return ListView.builder(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
        itemCount: controller.servicesList.length,
        itemBuilder: (context, index) {
          final service = controller.servicesList[index];
          return _buildServiceCard(context, service);
        },
      );
    });
  }

  Widget _buildServiceCard(BuildContext context, ServiceModel service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.secondary.withOpacity(0.1), 
              borderRadius: BorderRadius.circular(12)
            ),
            child: const Icon(Icons.design_services_outlined, color: AppColors.secondary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.serviceName ?? 'Unknown',
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    fontSize: 16,
                    color: Theme.of(context).textTheme.titleMedium?.color,
                  ),
                ),
                Text(
                  '${service.durationMinutes?.toStringAsFixed(0)} min • ₹${service.price?.toStringAsFixed(2)}',
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
