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

  void togglePasswordVisibility() =>
      isPasswordVisible.value = !isPasswordVisible.value;

  Future<void> loginWithGoogle() async {
    try {
      isLoading.value = true;

      print('Google Sign-In: Initializing plugin...');
      // Initialize the singleton GoogleSignIn instance
      await GoogleSignIn.instance.initialize(
        serverClientId:
            '175183335539-98a7nuhghnanrlboa38dse512er3lgb7.apps.googleusercontent.com',
      );

      print('Google Sign-In: Requesting authentication...');
      final GoogleSignInAccount googleUser =
          await GoogleSignIn.instance.authenticate(
        scopeHint: ['email', 'profile'],
      );

      print('Google Sign-In: User authenticated successfully: ${googleUser.email}');
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        isLoading.value = false;
        print('Google Sign-In Error: idToken is null');
        _showError(
          'Auth Error',
          'Failed to get ID token. Please check SHA-1 in Firebase.',
        );
        return;
      }

      print('Google Sign-In: Sending ID token to backend...');
      final response = await _apiClient.post(
        ApiConstants.googleLogin,
        data: {'credential': idToken},
      );

      print('Google Sign-In: Backend response received: ${response.data}');

      if (response.data != null && response.data['success'] == true) {
        final data = response.data;
        final Map<String, dynamic> userJson = Map<String, dynamic>.from(
          data['user'],
        );

        userJson['token'] = data['token'];
        if (data['activeBusiness'] != null) {
          userJson['business_id'] = data['activeBusiness']['id'];
        }

        final userData = UserModel.fromJson(userJson);
        _authService.login(userData);
        Get.offAllNamed(Routes.HOME);
      } else {
        String msg = response.data is Map
            ? (response.data['message'] ?? 'Google login failed')
            : 'Server error';
        print('Google Sign-In: Backend rejected login. Message: $msg');
        _showError('Login Failed', msg);
      }
    } catch (e) {
      if (e is GoogleSignInException &&
          e.code == GoogleSignInExceptionCode.canceled) {
        print('Google Sign-In: User canceled authentication.');
        return;
      }
      print('Google Login Error Details: $e');
      _showError('Error', 'Google Sign-In failed: $e');
    } finally {
      isLoading.value = false;
    }
  }

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
