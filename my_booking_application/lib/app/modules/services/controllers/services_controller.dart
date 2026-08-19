import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/service_model.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';
import '../../../shared/widgets/customDialogue.dart';

class ServicesController extends GetxController {
  final isLoading = false.obs;
  final servicesList = <ServiceModel>[].obs;
  final staffList = <StaffModel>[].obs;
  final staffServicesList = <Map<String, dynamic>>[].obs;

  // Search & Filter State
  final searchQuery = ''.obs;
  final selectedFilter = 'All'.obs; // 'All', 'Active', 'Inactive'

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    fetchServices();
  }

  // Filtered services reactive getter
  List<ServiceModel> get filteredServices {
    return servicesList.where((service) {
      final isActive = service.status == true;
      if (selectedFilter.value == 'Active' && !isActive) return false;
      if (selectedFilter.value == 'Inactive' && isActive) return false;

      if (searchQuery.value.trim().isNotEmpty) {
        final query = searchQuery.value.toLowerCase().trim();
        final name = (service.serviceName ?? '').toLowerCase();
        final price = (service.price ?? 0).toString();
        final duration = (service.durationMinutes ?? 0).toString();
        return name.contains(query) || price.contains(query) || duration.contains(query);
      }
      return true;
    }).toList();
  }

  // Statistics
  int get totalCount => servicesList.length;
  int get activeCount => servicesList.where((s) => s.status == true).length;
  int get inactiveCount => servicesList.where((s) => s.status != true).length;
  double get avgPrice {
    if (servicesList.isEmpty) return 0.0;
    final total = servicesList.fold(0.0, (sum, item) => sum + (item.price ?? 0.0));
    return total / servicesList.length;
  }

  Future<void> fetchServices() async {
    try {
      isLoading.value = true;
      
      final results = await Future.wait([
        _apiClient.get(ApiConstants.services).catchError((_) => null),
        _apiClient.get(ApiConstants.staff).catchError((_) => null),
        _apiClient.get(ApiConstants.staffServices).catchError((_) => null),
      ]);

      if (results[0] != null && results[0]!.data['success'] == true) {
        final List list = results[0]!.data['data'] ?? [];
        servicesList.value = list.map((j) => ServiceModel.fromJson(j)).toList();
      }

      if (results[1] != null && results[1]!.data['success'] == true) {
        final List stf = results[1]!.data['data'] ?? [];
        staffList.value = stf.map((j) => StaffModel.fromJson(j)).toList();
      }

      if (results[2] != null && results[2]!.data['success'] == true) {
        final List ss = results[2]!.data['data'] ?? [];
        staffServicesList.value = ss.map((j) => Map<String, dynamic>.from(j)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching services: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> createService(Map<String, dynamic> data, {List<int> assignedStaffIds = const []}) async {
    try {
      isLoading.value = true;
      final response = await _apiClient.post(ApiConstants.createService, data: data);
      if (response.data['success'] == true) {
        final newServiceId = response.data['data']?['id'];
        if (newServiceId != null && assignedStaffIds.isNotEmpty) {
          await _updateServiceStaffAssignments(newServiceId, assignedStaffIds);
        }

        Get.snackbar(
          'Success',
          'Service created successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.withOpacity(0.1),
          colorText: Colors.green,
        );
        await fetchServices();
        return true;
      } else {
        Get.snackbar(
          'Error',
          response.data['message'] ?? 'Failed to create service',
          snackPosition: SnackPosition.BOTTOM,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to create service: $e', snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> updateService(int id, Map<String, dynamic> data, {List<int> assignedStaffIds = const []}) async {
    try {
      isLoading.value = true;
      final response = await _apiClient.put('${ApiConstants.updateService}/$id', data: data);
      if (response.data['success'] == true) {
        await _updateServiceStaffAssignments(id, assignedStaffIds);

        Get.snackbar(
          'Success',
          'Service updated successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.withOpacity(0.1),
          colorText: Colors.green,
        );
        await fetchServices();
        return true;
      } else {
        Get.snackbar(
          'Error',
          response.data['message'] ?? 'Failed to update service',
          snackPosition: SnackPosition.BOTTOM,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to update service: $e', snackPosition: SnackPosition.BOTTOM);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _updateServiceStaffAssignments(int serviceId, List<int> newStaffIds) async {
    final currentAssigned = staffServicesList.where((ss) => ss['service_id'] == serviceId).toList();
    final currentStaffIds = currentAssigned.map((ss) => int.tryParse(ss['staff_id'].toString()) ?? 0).toList();

    final toRemove = currentAssigned.where((ss) => !newStaffIds.contains(ss['staff_id'])).toList();
    final toAdd = newStaffIds.where((id) => !currentStaffIds.contains(id)).toList();

    for (var ss in toRemove) {
      if (ss['id'] != null) {
        try {
          await _apiClient.delete('${ApiConstants.deleteStaffService}/${ss['id']}');
        } catch (_) {}
      }
    }
    for (var staffId in toAdd) {
      try {
        await _apiClient.post(ApiConstants.createStaffService, data: {
          'staff_id': staffId,
          'service_id': serviceId,
        });
      } catch (_) {}
    }
  }

  Future<void> toggleServiceStatus(ServiceModel service) async {
    if (service.id == null) return;
    final newStatus = !(service.status ?? false);
    final previousStatus = service.status;
    
    // Optimistic update
    service.status = newStatus;
    servicesList.refresh();

    try {
      final response = await _apiClient.put(
        '${ApiConstants.updateService}/${service.id}',
        data: {'status': newStatus},
      );

      if (response.data['success'] != true) {
        service.status = previousStatus;
        servicesList.refresh();
        Get.snackbar('Error', 'Failed to update service status', snackPosition: SnackPosition.BOTTOM);
      }
    } catch (e) {
      service.status = previousStatus;
      servicesList.refresh();
      Get.snackbar('Error', 'Failed to update status: $e', snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<void> deleteService(int id) async {
    CustomDialogue.show(
      title: 'Delete Service',
      description: 'Are you sure you want to delete this service? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: Colors.redAccent,
      icon: Icons.delete_forever_rounded,
      onConfirm: () async {
        try {
          isLoading.value = true;
          final response = await _apiClient.delete('${ApiConstants.deleteService}/$id');
          if (response.data['success'] == true) {
            Get.snackbar(
              'Deleted',
              'Service deleted successfully',
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.redAccent.withOpacity(0.1),
              colorText: Colors.redAccent,
            );
            await fetchServices();
          } else {
            Get.snackbar('Error', response.data['message'] ?? 'Failed to delete service', snackPosition: SnackPosition.BOTTOM);
          }
        } catch (e) {
          Get.snackbar('Error', 'Failed to delete service: $e', snackPosition: SnackPosition.BOTTOM);
        } finally {
          isLoading.value = false;
        }
      },
    );
  }

  void refreshData() => fetchServices();
}
