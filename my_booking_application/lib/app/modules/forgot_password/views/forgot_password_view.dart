import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../controllers/forgot_password_controller.dart';

class ForgotPasswordView extends StatefulWidget {
  const ForgotPasswordView({super.key});

  @override
  State<ForgotPasswordView> createState() => _ForgotPasswordViewState();
}

class _ForgotPasswordViewState extends State<ForgotPasswordView>
    with TickerProviderStateMixin {
  late final AnimationController _bgCtrl;
  late final AnimationController _contentCtrl;

  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  final controller = Get.find<ForgotPasswordController>();

  @override
  void initState() {
    super.initState();
    _bgCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    _contentCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _contentCtrl, curve: Curves.easeIn),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
      CurvedAnimation(parent: _contentCtrl, curve: Curves.easeOutCubic),
    );

    _contentCtrl.forward();
  }

  @override
  void dispose() {
    _bgCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            size: 20,
          ),
          onPressed: () => Get.back(),
        ),
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // ── Background Animations ──
          _buildAnimatedBackground(isDark),

          // ── Main Content ──
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 28.0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - 50,
                    ),
                    child: IntrinsicHeight(
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: SlideTransition(
                          position: _slideAnimation,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // ── Logo ──
                              Center(
                                child: Hero(
                                  tag: 'app_logo',
                                  child: Container(
                                    width: 80,
                                    height: 80,
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: AppColors.logoGradient,
                                      border: Border.all(
                                        color: Colors.white.withOpacity(isDark ? 0.15 : 0.8),
                                        width: 2,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.accent.withOpacity(0.35),
                                          blurRadius: 30,
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                    child: Image.asset(
                                      'assets/icons/app_logo_bg.png',
                                      fit: BoxFit.contain,
                                      errorBuilder: (context, error, stackTrace) =>
                                          const Icon(
                                        Icons.lock_reset_rounded,
                                        color: Colors.white,
                                        size: 30,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // ── Glassmorphism Form Card ──
                              ClipRRect(
                                borderRadius: BorderRadius.circular(28),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 24.0, vertical: 24.0),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(28),
                                      color: isDark
                                          ? AppColors.surfaceDark.withOpacity(0.65)
                                          : Colors.white.withOpacity(0.75),
                                      border: Border.all(
                                        color: isDark
                                            ? Colors.white.withOpacity(0.08)
                                            : AppColors.primary.withOpacity(0.08),
                                        width: 1.5,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(isDark ? 0.25 : 0.05),
                                          blurRadius: 30,
                                          offset: const Offset(0, 15),
                                        ),
                                      ],
                                    ),
                                    child: Obx(() {
                                      switch (controller.currentStep.value) {
                                        case 1:
                                          return _buildStep1(isDark);
                                        case 2:
                                          return _buildStep2(isDark);
                                        case 3:
                                          return _buildStep3(isDark);
                                        default:
                                          return _buildStep1(isDark);
                                      }
                                    }),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 40),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // STEP 1 UI: Ask registered email
  Widget _buildStep1(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Forgot Password',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            fontFamily: 'Syne',
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Enter your registered email address to receive a verification OTP code.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            fontFamily: 'Syne',
          ),
        ),
        const SizedBox(height: 24),
        _buildTextField(
          controller: controller.emailController,
          label: 'Email Address',
          icon: Icons.alternate_email_rounded,
          hint: 'owner@example.com',
          isDark: isDark,
        ),
        const SizedBox(height: 24),
        _buildActionButton(
          label: 'SEND OTP',
          onPressed: controller.sendForgotPasswordOtp,
        ),
      ],
    );
  }

  // STEP 2 UI: OTP verification
  Widget _buildStep2(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Verification Code',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            fontFamily: 'Syne',
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'We have sent a 4-digit code to the email address ${controller.emailController.text}. Please enter it below.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            fontFamily: 'Syne',
          ),
        ),
        const SizedBox(height: 28),

        // OTP inputs
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildOtpBox(
              controller: controller.pin1Controller,
              focusNode: controller.pin1FocusNode,
              nextFocusNode: controller.pin2FocusNode,
              isDark: isDark,
            ),
            _buildOtpBox(
              controller: controller.pin2Controller,
              focusNode: controller.pin2FocusNode,
              prevFocusNode: controller.pin1FocusNode,
              nextFocusNode: controller.pin3FocusNode,
              isDark: isDark,
            ),
            _buildOtpBox(
              controller: controller.pin3Controller,
              focusNode: controller.pin3FocusNode,
              prevFocusNode: controller.pin2FocusNode,
              nextFocusNode: controller.pin4FocusNode,
              isDark: isDark,
            ),
            _buildOtpBox(
              controller: controller.pin4Controller,
              focusNode: controller.pin4FocusNode,
              prevFocusNode: controller.pin3FocusNode,
              isDark: isDark,
            ),
          ],
        ),
        const SizedBox(height: 28),
        _buildActionButton(
          label: 'VERIFY CODE',
          onPressed: controller.verifyOtp,
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton(
            onPressed: () => controller.sendForgotPasswordOtp(),
            child: const Text(
              'Resend OTP Code',
              style: TextStyle(
                color: AppColors.accent,
                fontWeight: FontWeight.bold,
                fontFamily: 'Syne',
                fontSize: 13,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // STEP 3 UI: Reset Password
  Widget _buildStep3(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Reset Password',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            fontFamily: 'Syne',
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Choose a strong new password to secure your account.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            fontFamily: 'Syne',
          ),
        ),
        const SizedBox(height: 24),
        Obx(
          () => _buildTextField(
            controller: controller.passwordController,
            label: 'New Password',
            icon: Icons.lock_outline_rounded,
            hint: '••••••••',
            isPassword: true,
            obscureText: !controller.isPasswordVisible.value,
            onTogglePassword: controller.togglePasswordVisibility,
            isDark: isDark,
          ),
        ),
        const SizedBox(height: 16),
        Obx(
          () => _buildTextField(
            controller: controller.confirmPasswordController,
            label: 'Confirm Password',
            icon: Icons.lock_outline_rounded,
            hint: '••••••••',
            isPassword: true,
            obscureText: !controller.isConfirmPasswordVisible.value,
            onTogglePassword: controller.toggleConfirmPasswordVisibility,
            isDark: isDark,
          ),
        ),
        const SizedBox(height: 28),
        _buildActionButton(
          label: 'RESET PASSWORD',
          onPressed: controller.submitNewPassword,
        ),
      ],
    );
  }

  Widget _buildOtpBox({
    required TextEditingController controller,
    required FocusNode focusNode,
    FocusNode? prevFocusNode,
    FocusNode? nextFocusNode,
    required bool isDark,
  }) {
    return Container(
      width: 54,
      height: 54,
      decoration: BoxDecoration(
        color: isDark ? Colors.black.withOpacity(0.2) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : AppColors.borderLight,
          width: 1.5,
        ),
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: TextStyle(
          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          fontSize: 22,
          fontWeight: FontWeight.bold,
          fontFamily: 'Syne',
        ),
        decoration: const InputDecoration(
          counterText: '',
          border: InputBorder.none,
          contentPadding: EdgeInsets.zero,
        ),
        onChanged: (value) {
          if (value.isNotEmpty) {
            if (nextFocusNode != null) {
              nextFocusNode.requestFocus();
            } else {
              focusNode.unfocus();
            }
          } else {
            if (prevFocusNode != null) {
              prevFocusNode.requestFocus();
            }
          }
        },
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required String hint,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onTogglePassword,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              fontFamily: 'Syne',
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: isDark ? Colors.black.withOpacity(0.2) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white.withOpacity(0.08) : AppColors.borderLight,
              width: 1.5,
            ),
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            style: TextStyle(
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              fontFamily: 'Syne',
              fontSize: 15,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                color: isDark ? AppColors.textDisabledDark : AppColors.textDisabledLight.withOpacity(0.7),
                fontSize: 14,
              ),
              prefixIcon: Icon(icon, color: AppColors.accent, size: 20),
              suffixIcon: isPassword
                  ? IconButton(
                      icon: Icon(
                        obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: AppColors.accent.withOpacity(0.5),
                        size: 20,
                      ),
                      onPressed: onTogglePassword,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({required String label, required VoidCallback onPressed}) {
    return Obx(
      () => Container(
        width: double.infinity,
        height: 50,
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.accent.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: controller.isLoading.value ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: controller.isLoading.value
              ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  label,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 1.5,
                    fontFamily: 'Syne',
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildAnimatedBackground(bool isDark) {
    return AnimatedBuilder(
      animation: _bgCtrl,
      builder: (context, child) {
        return Stack(
          children: [
            // Grid
            Positioned.fill(
              child: CustomPaint(
                painter: _GridPainter(
                  isDark
                      ? AppColors.accent.withOpacity(0.03)
                      : AppColors.primary.withOpacity(0.03),
                ),
              ),
            ),
            // Orbs
            _orb(
              size: 300,
              color: isDark ? AppColors.violet900 : AppColors.violet100,
              top: -50,
              right: -50,
              opacity: 0.4,
            ),
            _orb(
              size: 250,
              color: isDark ? AppColors.navy800 : AppColors.navy100,
              bottom: 100,
              left: -50,
              opacity: 0.3,
            ),
          ],
        );
      },
    );
  }

  Widget _orb({
    required double size,
    required Color color,
    double? top,
    double? bottom,
    double? left,
    double? right,
    required double opacity,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color.withOpacity(opacity), Colors.transparent],
          ),
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  final Color color;
  _GridPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}
