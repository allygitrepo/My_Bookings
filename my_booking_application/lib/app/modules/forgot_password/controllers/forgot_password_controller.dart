import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/services/api_client.dart';
import '../../../core/constants/apiConstants.dart';
import '../../../routes/appPages.dart';

class ForgotPasswordController extends GetxController {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  // 4 individual digit controllers for Step 2 OTP screen
  final pin1Controller = TextEditingController();
  final pin2Controller = TextEditingController();
  final pin3Controller = TextEditingController();
  final pin4Controller = TextEditingController();

  // Focus nodes for OTP digits to handle auto-focus shifting
  final pin1FocusNode = FocusNode();
  final pin2FocusNode = FocusNode();
  final pin3FocusNode = FocusNode();
  final pin4FocusNode = FocusNode();

  final currentStep = 1.obs; // 1: Email, 2: OTP verification, 3: Password reset
  final isLoading = false.obs;
  final isPasswordVisible = false.obs;
  final isConfirmPasswordVisible = false.obs;

  final _apiClient = Get.find<ApiClient>();

  void togglePasswordVisibility() =>
      isPasswordVisible.value = !isPasswordVisible.value;

  void toggleConfirmPasswordVisibility() =>
      isConfirmPasswordVisible.value = !isConfirmPasswordVisible.value;

  // Step 1: Send OTP to email
  Future<void> sendForgotPasswordOtp() async {
    final email = emailController.text.trim();
    if (email.isEmpty) {
      _showSnackbar('Missing Field', 'Please enter your registered email', isError: true);
      return;
    }

    if (!GetUtils.isEmail(email)) {
      _showSnackbar('Invalid Email', 'Please enter a valid email address', isError: true);
      return;
    }

    try {
      isLoading.value = true;
      final response = await _apiClient.post(
        ApiConstants.forgotPassword,
        data: {'email': email},
      );

      if (response.data['success'] == true) {
        _showSnackbar('Success', response.data['message'] ?? 'OTP sent to email', isError: false);
        currentStep.value = 2;
        // Shift focus to first pin box
        WidgetsBinding.instance.addPostFrameCallback((_) {
          pin1FocusNode.requestFocus();
        });
      } else {
        _showSnackbar('Failed', response.data['message'] ?? 'Unable to send OTP', isError: true);
      }
    } catch (e) {
      _showSnackbar('Error', 'Unable to reach the server. Please check your connection.', isError: true);
    } finally {
      isLoading.value = false;
    }
  }

  // Step 2: Verify OTP
  Future<void> verifyOtp() async {
    final email = emailController.text.trim();
    final otp = '${pin1Controller.text}${pin2Controller.text}${pin3Controller.text}${pin4Controller.text}'.trim();

    if (otp.length < 4) {
      _showSnackbar('Incomplete OTP', 'Please enter all 4 digits of the OTP code', isError: true);
      return;
    }

    try {
      isLoading.value = true;
      final response = await _apiClient.post(
        ApiConstants.verifyResetOtp,
        data: {'email': email, 'otp': otp},
      );

      if (response.data['success'] == true) {
        _showSnackbar('Verified', response.data['message'] ?? 'OTP verified successfully', isError: false);
        currentStep.value = 3;
      } else {
        _showSnackbar('Verification Failed', response.data['message'] ?? 'Invalid OTP code', isError: true);
      }
    } catch (e) {
      _showSnackbar('Error', 'Unable to reach the server. Please check your connection.', isError: true);
    } finally {
      isLoading.value = false;
    }
  }

  // Step 3: Set new password
  Future<void> submitNewPassword() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();
    final confirmPassword = confirmPasswordController.text.trim();

    if (password.isEmpty || confirmPassword.isEmpty) {
      _showSnackbar('Missing Fields', 'Please fill in both password fields', isError: true);
      return;
    }

    if (password.length < 6) {
      _showSnackbar('Weak Password', 'Password must be at least 6 characters long', isError: true);
      return;
    }

    if (password != confirmPassword) {
      _showSnackbar('Mismatch', 'Passwords do not match', isError: true);
      return;
    }

    try {
      isLoading.value = true;
      final response = await _apiClient.post(
        ApiConstants.resetPassword,
        data: {
          'email': email,
          'password': password,
          'confirmPassword': confirmPassword,
        },
      );

      if (response.data['success'] == true) {
        _showSnackbar('Success', response.data['message'] ?? 'Password reset successfully', isError: false);
        // Clear variables
        _clearFields();
        Get.offAllNamed(Routes.LOGIN);
      } else {
        _showSnackbar('Failed', response.data['message'] ?? 'Could not reset password', isError: true);
      }
    } catch (e) {
      _showSnackbar('Error', 'Unable to reach the server. Please check your connection.', isError: true);
    } finally {
      isLoading.value = false;
    }
  }

  void _clearFields() {
    emailController.clear();
    passwordController.clear();
    confirmPasswordController.clear();
    pin1Controller.clear();
    pin2Controller.clear();
    pin3Controller.clear();
    pin4Controller.clear();
    currentStep.value = 1;
  }

  void _showSnackbar(String title, String message, {required bool isError}) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: isError ? Colors.redAccent : Colors.green,
      colorText: Colors.white,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
      duration: const Duration(seconds: 3),
    );
  }

  @override
  void onClose() {
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    pin1Controller.dispose();
    pin2Controller.dispose();
    pin3Controller.dispose();
    pin4Controller.dispose();
    pin1FocusNode.dispose();
    pin2FocusNode.dispose();
    pin3FocusNode.dispose();
    pin4FocusNode.dispose();
    super.onClose();
  }
}
