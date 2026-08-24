import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/business_model.dart';
import '../../../data/services/api_client.dart';
import '../../../data/services/auth_service.dart';

class SettingsController extends GetxController {
  final isLoading = false.obs;
  final business = Rxn<BusinessModel>();
  final selectedThemeMode = ThemeMode.system.obs;

  final nameController = TextEditingController();
  final addressController = TextEditingController();
  final cityController = TextEditingController();
  final stateController = TextEditingController();

  void changeTheme(ThemeMode mode) {
    selectedThemeMode.value = mode;
    Get.changeThemeMode(mode);
  }

  final _apiClient = Get.find<ApiClient>();
  final _authService = Get.find<AuthService>();

  @override
  void onInit() {
    super.onInit();
    fetchBusinessProfile();
  }

  Future<void> fetchBusinessProfile() async {
    try {
      isLoading.value = true;
      // We fetch the first business owned by the user for now
      final response = await _apiClient.get('/business/all');
      
      if (response.data['success'] == true && response.data['data'].isNotEmpty) {
        business.value = BusinessModel.fromJson(response.data['data'][0]);
        _populateFields();
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to fetch business profile');
    } finally {
      isLoading.value = false;
    }
  }

  void _populateFields() {
    nameController.text = business.value?.businessName ?? '';
    addressController.text = business.value?.address ?? '';
    cityController.text = business.value?.city ?? '';
    stateController.text = business.value?.state ?? '';
  }

  Future<void> updateProfile() async {
    if (business.value == null) return;

    try {
      isLoading.value = true;
      final updatedData = {
        'business_name': nameController.text,
        'address': addressController.text,
        'city': cityController.text,
        'state': stateController.text,
      };

      final response = await _apiClient.put('/business/update/${business.value!.id}', data: updatedData);
      
      if (response.data['success'] == true) {
        business.value = BusinessModel.fromJson(response.data['data']);
        Get.snackbar('Success', 'Profile updated successfully',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white);
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to update profile');
    } finally {
      isLoading.value = false;
    }
  }

  void logout() => _authService.logout();

  @override
  void onClose() {
    nameController.dispose();
    addressController.dispose();
    cityController.dispose();
    stateController.dispose();
    super.onClose();
  }
}
