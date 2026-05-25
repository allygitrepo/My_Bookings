import 'package:get/get.dart';
import '../../../data/models/service_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';

class ServicesController extends GetxController {
  final isLoading = false.obs;
  final servicesList = <ServiceModel>[].obs;

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    fetchServices();
  }

  Future<void> fetchServices() async {
    try {
      isLoading.value = true;
      final response = await _apiClient.get(ApiConstants.services);
      
      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        servicesList.value = list.map((j) => ServiceModel.fromJson(j)).toList();
      }
    } catch (e) {
      print('Error fetching services: $e');
      Get.snackbar('Error', 'Failed to fetch services: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  void refreshData() => fetchServices();
}
