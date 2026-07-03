import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:my_booking_application/app/data/services/socket_service.dart';
import 'package:my_booking_application/app/routes/appPages.dart';
import '../models/user_model.dart';
import 'fcm_service.dart';

class AuthService extends GetxService {
  final _storage = GetStorage();
  final _isLogged = false.obs;
  final _user = Rxn<UserModel>();

  bool get isLogged => _isLogged.value;
  UserModel? get user => _user.value;
  String? get token => _user.value?.token;

  Future<AuthService> init() async {
    final userData = _storage.read('user');
    if (userData != null) {
      _user.value = UserModel.fromJson(userData);
      _isLogged.value = true;
    }
    return this;
  }

  void login(UserModel user) {
    _user.value = user;
    _isLogged.value = true;
    _storage.write('user', user.toJson());
    Get.find<SocketService>().connect();
    
    // Update FCM token on server for this user
    if (Get.isRegistered<FCMService>()) {
      Get.find<FCMService>().updateToken();
    }
  }

  void logout() {
    _user.value = null;
    _isLogged.value = false;
    _storage.remove('user');
    Get.find<SocketService>().disconnect();
    Get.offAllNamed(Routes.LOGIN);
  }

  void clearData() {
    _user.value = null;
    _isLogged.value = false;
  }
}
