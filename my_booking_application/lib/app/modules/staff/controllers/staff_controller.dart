import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/models/staff_availability_model.dart';
import '../../../data/models/staff_leave_model.dart';
import '../../../data/models/location_model.dart';
import '../../../data/models/service_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';

class StaffController extends GetxController {
  final isLoading = false.obs;
  final isLeavesLoading = false.obs;
  final staffList = <StaffModel>[].obs;
  final leavesList = <StaffLeaveModel>[].obs;
  final locationsList = <LocationModel>[].obs;
  final servicesList = <ServiceModel>[].obs;
  final staffServicesList = <Map<String, dynamic>>[].obs;
  final selectedSegment = 0.obs; // 0: Directory, 1: Leaves

  // Search & Filters
  final searchQuery = ''.obs;

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    refreshData();
  }

  List<StaffModel> get filteredStaff {
    if (searchQuery.value.trim().isEmpty) return staffList;
    final q = searchQuery.value.toLowerCase().trim();
    return staffList.where((s) {
      final name = (s.staffName ?? '').toLowerCase();
      final role = (s.role ?? '').toLowerCase();
      final phone = (s.phone ?? '').toLowerCase();
      return name.contains(q) || role.contains(q) || phone.contains(q);
    }).toList();
  }

  Future<void> fetchStaff() async {
    try {
      isLoading.value = true;

      final results = await Future.wait([
        _apiClient.get(ApiConstants.staff).catchError((_) => null),
        _apiClient.get(ApiConstants.staffAvailability).catchError((_) => null),
        _apiClient.get(ApiConstants.locations).catchError((_) => null),
        _apiClient.get(ApiConstants.services).catchError((_) => null),
        _apiClient.get(ApiConstants.staffServices).catchError((_) => null),
      ]);

      // Parse locations
      if (results[2] != null && results[2]!.data['success'] == true) {
        final List locs = results[2]!.data['data'] ?? [];
        locationsList.value = locs.map((j) => LocationModel.fromJson(j)).toList();
      }

      // Parse services
      if (results[3] != null && results[3]!.data['success'] == true) {
        final List svcs = results[3]!.data['data'] ?? [];
        servicesList.value = svcs.map((j) => ServiceModel.fromJson(j)).toList();
      }

      // Parse staff-services mapping
      if (results[4] != null && results[4]!.data['success'] == true) {
        final List ss = results[4]!.data['data'] ?? [];
        staffServicesList.value = ss.map((j) => Map<String, dynamic>.from(j)).toList();
      }

      // Parse availabilities
      List<StaffAvailabilityModel> availabilities = [];
      if (results[1] != null && results[1]!.data['success'] == true) {
        final List availList = results[1]!.data['data'] ?? [];
        availabilities = availList.map((j) => StaffAvailabilityModel.fromJson(j)).toList();
      }

      // Parse staff
      if (results[0] != null && results[0]!.data['success'] == true) {
        final List list = results[0]!.data['data'] ?? [];
        final parsedStaff = list.map((j) => StaffModel.fromJson(j)).toList();

        for (var staff in parsedStaff) {
          if (staff.id != null) {
            // Attach availabilities
            staff.availabilities = availabilities
                .where((a) => a.staffId == staff.id && (a.status == true))
                .toList();

            // Attach assigned service IDs from staffServicesList
            staff.serviceIds = staffServicesList
                .where((ss) => ss['staff_id'] == staff.id)
                .map((ss) => int.tryParse(ss['service_id'].toString()) ?? 0)
                .where((id) => id > 0)
                .toList();
          }
        }
        staffList.value = parsedStaff;
      }
    } catch (e) {
      debugPrint('Error fetching staff: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchLeaves() async {
    try {
      isLeavesLoading.value = true;
      final response = await _apiClient.get(ApiConstants.staffLeaves);
      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        leavesList.value = list.map((j) => StaffLeaveModel.fromJson(j)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching leaves: $e');
    } finally {
      isLeavesLoading.value = false;
    }
  }

  // --- STAFF CRUD & ASSIGNMENTS ---
  Future<bool> createStaff({
    required Map<String, dynamic> staffData,
    required List<int> locationIds,
    required List<int> assignedServiceIds,
    required List<Map<String, dynamic>> availabilityRecords,
  }) async {
    try {
      isLoading.value = true;
      final payload = {
        ...staffData,
        'location_ids': locationIds,
      };

      final response = await _apiClient.post(ApiConstants.createStaff, data: payload);
      if (response.data['success'] == true) {
        final newStaffId = response.data['data']?['id'];
        if (newStaffId != null) {
          // Create service assignments
          await _updateStaffServiceAssignments(newStaffId, assignedServiceIds);
          // Create availability records
          if (availabilityRecords.isNotEmpty) {
            final formattedAvails = availabilityRecords.map((a) => {
              ...a,
              'staff_id': newStaffId,
            }).toList();
            await _apiClient.post(ApiConstants.bulkCreateStaffAvailability, data: formattedAvails).catchError((_) => null);
          }
        }

        Get.snackbar(
          'Success',
          'Staff member created successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.withOpacity(0.1),
          colorText: Colors.green,
        );
        await fetchStaff();
        return true;
      } else {
        Get.snackbar('Error', response.data['message'] ?? 'Failed to create staff');
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to create staff: $e');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> updateStaff({
    required int staffId,
    required Map<String, dynamic> staffData,
    required List<int> locationIds,
    required List<int> assignedServiceIds,
    required List<Map<String, dynamic>> availabilityRecords,
  }) async {
    try {
      isLoading.value = true;
      final payload = {
        ...staffData,
        'location_ids': locationIds,
      };

      final response = await _apiClient.put('${ApiConstants.updateStaff}/$staffId', data: payload);
      if (response.data['success'] == true) {
        // Update service assignments
        await _updateStaffServiceAssignments(staffId, assignedServiceIds);

        // Update availability
        await _apiClient.delete('${ApiConstants.deleteStaffAvailabilityByStaff}/$staffId').catchError((_) => null);
        if (availabilityRecords.isNotEmpty) {
          final formattedAvails = availabilityRecords.map((a) => {
            ...a,
            'staff_id': staffId,
          }).toList();
          await _apiClient.post(ApiConstants.bulkCreateStaffAvailability, data: formattedAvails).catchError((_) => null);
        }

        Get.snackbar(
          'Success',
          'Staff member updated successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.withOpacity(0.1),
          colorText: Colors.green,
        );
        await fetchStaff();
        return true;
      } else {
        Get.snackbar('Error', response.data['message'] ?? 'Failed to update staff');
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to update staff: $e');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _updateStaffServiceAssignments(int staffId, List<int> newServiceIds) async {
    final currentAssigned = staffServicesList.where((ss) => ss['staff_id'] == staffId).toList();
    final currentServiceIds = currentAssigned.map((ss) => int.tryParse(ss['service_id'].toString()) ?? 0).toList();

    // To remove
    final toRemove = currentAssigned.where((ss) => !newServiceIds.contains(ss['service_id'])).toList();
    // To add
    final toAdd = newServiceIds.where((id) => !currentServiceIds.contains(id)).toList();

    for (var ss in toRemove) {
      if (ss['id'] != null) {
        await _apiClient.delete('${ApiConstants.deleteStaffService}/${ss['id']}').catchError((_) => null);
      }
    }
    for (var serviceId in toAdd) {
      await _apiClient.post(ApiConstants.createStaffService, data: {
        'staff_id': staffId,
        'service_id': serviceId,
      }).catchError((_) => null);
    }
  }

  Future<bool> deleteStaff(int staffId) async {
    try {
      isLoading.value = true;
      final response = await _apiClient.delete('${ApiConstants.deleteStaff}/$staffId');
      if (response.data['success'] == true) {
        Get.snackbar(
          'Deleted',
          'Staff member deleted successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.redAccent.withOpacity(0.1),
          colorText: Colors.red,
        );
        await fetchStaff();
        return true;
      } else {
        Get.snackbar('Error', response.data['message'] ?? 'Failed to delete staff');
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to delete staff: $e');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // --- LEAVE ACTIONS ---
  Future<bool> createLeave({
    required int staffId,
    required String leaveType,
    required String startDate,
    required String endDate,
    String? startTime,
    String? endTime,
    required bool isAllDay,
    required String approvalStatus,
    String? reason,
  }) async {
    try {
      final payload = {
        'staff_id': staffId,
        'leave_type': leaveType,
        'start_date': startDate,
        'end_date': endDate,
        'start_time': startTime,
        'end_time': endTime,
        'is_all_day': isAllDay,
        'approval_status': approvalStatus,
        'reason': reason,
      };

      final response = await _apiClient.post(ApiConstants.createStaffLeave, data: payload);
      if (response.data['success'] == true) {
        Get.snackbar(
          'Success',
          'Staff leave recorded successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
        fetchLeaves();
        return true;
      } else {
        Get.snackbar('Error', response.data['message'] ?? 'Failed to apply leave');
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to record staff leave');
      return false;
    }
  }

  Future<bool> updateLeaveStatus(int id, String approvalStatus) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.updateStaffLeave}/$id',
        data: {'approval_status': approvalStatus},
      );

      if (response.data['success'] == true) {
        final index = leavesList.indexWhere((l) => l.id == id);
        if (index != -1) {
          leavesList[index].approvalStatus = approvalStatus;
          leavesList.refresh();
        }
        Get.snackbar(
          'Status Updated',
          'Leave status changed to $approvalStatus',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
        return true;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to update leave status');
    }
    return false;
  }

  Future<bool> deleteLeave(int id) async {
    try {
      final response = await _apiClient.delete('${ApiConstants.deleteStaffLeave}/$id');
      if (response.data['success'] == true) {
        leavesList.removeWhere((l) => l.id == id);
        Get.snackbar(
          'Deleted',
          'Staff leave record removed',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
        return true;
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to delete staff leave');
    }
    return false;
  }

  void refreshData() {
    fetchStaff();
    fetchLeaves();
  }
}
