import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../data/services/api_client.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/models/user_model.dart';
import '../../../core/constants/apiConstants.dart';
import '../../../routes/appPages.dart';

class LoginController extends GetxController {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final isLoading = false.obs;
  final isPasswordVisible = false.obs;

  final _apiClient = Get.find<ApiClient>();
  final _authService = Get.find<AuthService>();

  // // Web Client ID from your google-services.json (client_type: 3)
  // final GoogleSignIn _googleSignIn = GoogleSignIn(
  //   scopes: ['email', 'profile'],
  //   serverClientId: '175183335539-98a7nuhghnanrlboa38dse512er3lgb7.apps.googleusercontent.com',
  // );

  void togglePasswordVisibility() =>
      isPasswordVisible.value = !isPasswordVisible.value;

  // Future<void> loginWithGoogle() async {
  //   try {
  //     isLoading.value = true;
  //     final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

  //     if (googleUser == null) {
  //       isLoading.value = false;
  //       return;
  //     }

  //     final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
  //     final String? idToken = googleAuth.idToken;

  //     if (idToken == null) {
  //       isLoading.value = false;
  //       _showError('Auth Error', 'Failed to get ID token. Please check SHA-1 in Firebase.');
  //       return;
  //     }

  //     final response = await _apiClient.post(ApiConstants.googleLogin, data: {
  //       'credential': idToken,
  //     });

  //     if (response.data != null && response.data['success'] == true) {
  //       final data = response.data;
  //       final Map<String, dynamic> userJson = Map<String, dynamic>.from(data['user']);

  //       userJson['token'] = data['token'];
  //       if (data['activeBusiness'] != null) {
  //         userJson['business_id'] = data['activeBusiness']['id'];
  //       }

  //       final userData = UserModel.fromJson(userJson);
  //       _authService.login(userData);
  //       Get.offAllNamed(Routes.HOME);
  //     } else {
  //       String msg = response.data is Map ? (response.data['message'] ?? 'Google login failed') : 'Server error';
  //       _showError('Login Failed', msg);
  //     }
  //   } catch (e) {
  //     print('Google Login Error: $e');
  //     _showError('Error', 'Google Sign-In failed. Please try again.');
  //   } finally {
  //     isLoading.value = false;
  //   }
  // }

  Future<void> login() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError('Missing Fields', 'Please enter your email and password');
      return;
    }

    if (!GetUtils.isEmail(email)) {
      _showError('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      isLoading.value = true;
      final response = await _apiClient.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final userJson = Map<String, dynamic>.from(data['user']);
        userJson['token'] = data['token']; // Merge token into user object

        final userData = UserModel.fromJson(userJson);
        _authService.login(userData);
        Get.offAllNamed(Routes.HOME);
      } else {
        _showError(
          'Login Failed',
          response.data['message'] ?? 'Invalid credentials',
        );
      }
    } catch (e) {
      _showError(
        'Connection Error',
        'Unable to reach the server. Please check your internet.',
      );
    } finally {
      isLoading.value = false;
    }
  }

  void _showError(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.redAccent,
      colorText: Colors.white,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
    );
  }

  @override
  void onClose() {
    emailController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}
