import 'package:get/get.dart';
import '../../../data/models/staff_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';

class StaffController extends GetxController {
  final isLoading = false.obs;
  final staffList = <StaffModel>[].obs;

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    fetchStaff();
  }

  Future<void> fetchStaff() async {
    try {
      isLoading.value = true;
      final response = await _apiClient.get(ApiConstants.staff);
      
      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        staffList.value = list.map((j) => StaffModel.fromJson(j)).toList();
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to fetch staff');
    } finally {
      isLoading.value = false;
    }
  }

  void refreshData() => fetchStaff();
}
