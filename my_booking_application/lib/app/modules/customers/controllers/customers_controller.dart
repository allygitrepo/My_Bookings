import 'package:get/get.dart';
import '../../../data/models/customer_model.dart';
import '../../../data/services/api_client.dart';

class CustomersController extends GetxController {
  final isLoading = false.obs;
  final customersList = <CustomerModel>[].obs;

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    fetchCustomers();
  }

  Future<void> fetchCustomers() async {
    try {
      isLoading.value = true;
      final response = await _apiClient.get('/customers/all');
      
      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        customersList.value = list.map((j) => CustomerModel.fromJson(j)).toList();
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to fetch customers');
    } finally {
      isLoading.value = false;
    }
  }

  void refreshData() => fetchCustomers();
}
