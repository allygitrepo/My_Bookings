import 'package:get/get.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';

class HomeController extends GetxController {
  final isLoading = false.obs;
  
  // Statistics
  final todayBookingsCount = 0.obs;
  final overallBookingsCount = 0.obs;
  final totalRevenue = 0.0.obs;
  final pendingBookingsCount = 0.obs;

  final _apiClient = Get.find<ApiClient>();

  @override
  void onInit() {
    super.onInit();
    fetchStatistics();
  }

  Future<void> fetchStatistics() async {
    try {
      isLoading.value = true;
      
      // For now, we fetch all bookings and calculate stats locally
      // In a real scenario, we would have a /stats endpoint
      final response = await _apiClient.get(ApiConstants.bookings);
      
      if (response.data['success'] == true) {
        final List bookingsJson = response.data['data'] ?? [];
        final bookings = bookingsJson.map((j) => BookingModel.fromJson(j)).toList();
        
        overallBookingsCount.value = bookings.length;
        
        final now = DateTime.now();
        final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
        
        todayBookingsCount.value = bookings.where((b) => b.bookingDate == todayStr).length;
        pendingBookingsCount.value = bookings.where((b) => b.status == 'pending' || b.status == 'PENDING').length;
        
        totalRevenue.value = bookings.fold(0.0, (sum, b) => sum + (b.totalAmount ?? 0.0));
      }
    } catch (e) {
      print('Error fetching stats: $e');
    } finally {
      isLoading.value = false;
    }
  }

  void refreshData() => fetchStatistics();
}
