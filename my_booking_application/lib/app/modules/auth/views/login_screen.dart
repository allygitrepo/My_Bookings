import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../controllers/login_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  late final AnimationController _bgCtrl;
  late final AnimationController _contentCtrl;

  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  final controller = Get.find<LoginController>();

  @override
  void initState() {
    super.initState();
    _bgCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    _contentCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _contentCtrl, curve: Curves.easeIn));

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
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
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
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: SlideTransition(
                          position: _slideAnimation,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 40),
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
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.accent.withOpacity(
                                            0.3,
                                          ),
                                          blurRadius: 25,
                                          spreadRadius: 1,
                                        ),
                                      ],
                                    ),
                                    child: Image.asset(
                                      'assets/icons/application_logo_bg.png',
                                      fit: BoxFit.contain,
                                      errorBuilder:
                                          (context, error, stackTrace) =>
                                              const Icon(
                                                Icons.calendar_today_rounded,
                                                color: Colors.white,
                                                size: 30,
                                              ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 32),

                              // ── Header ──
                              Text(
                                'Welcome Back',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w900,
                                  color: isDark
                                      ? AppColors.textPrimaryDark
                                      : AppColors.textPrimaryLight,
                                  fontFamily: 'Syne',
                                  letterSpacing: -1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Your Booking Partner is ready to assist you.',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isDark
                                      ? AppColors.textSecondaryDark
                                      : AppColors.textSecondaryLight,
                                  fontFamily: 'Syne',
                                ),
                              ),

                              const SizedBox(height: 32),

                              // ── Login Form ──
                              _buildLoginForm(isDark),

                              const SizedBox(height: 8),

                              // ── Forgot Password ──
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {},
                                  child: Text(
                                    'Forgot Password?',
                                    style: TextStyle(
                                      color: AppColors.accent,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'Syne',
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(height: 16),

                              // ── Login Button ──
                              _buildLoginButton(isDark),

                              const SizedBox(height: 24),

                              // ── Social Login ──
                              _buildSocialLogin(isDark),
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

  Widget _buildSocialLogin(bool isDark) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Divider(
                color: isDark ? AppColors.dividerDark : AppColors.dividerLight,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'OR',
                style: TextStyle(
                  color: isDark
                      ? AppColors.textDisabledDark
                      : AppColors.textDisabledLight,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            Expanded(
              child: Divider(
                color: isDark ? AppColors.dividerDark : AppColors.dividerLight,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: () {
            controller.loginWithGoogle();
          },
          style: OutlinedButton.styleFrom(
            fixedSize: const Size(double.maxFinite, 56),
            side: BorderSide.none,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(28),
            ),
            backgroundColor: const Color(0xFF1A73E8),
            padding: EdgeInsets.zero,
          ),
          child: Row(
            children: [
              const SizedBox(width: 4),
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                padding: const EdgeInsets.all(10),
                child: Image.asset(
                  'assets/icons/google_logo.png',
                  fit: BoxFit.contain,
                ),
              ),
              const Expanded(
                child: Center(
                  child: Text(
                    'Continue with Google',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      fontFamily: 'Syne',
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 52),
            ],
          ),
        ),
      ],
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

  Widget _buildLoginForm(bool isDark) {
    return Column(
      children: [
        _buildTextField(
          controller: controller.emailController,
          label: 'Email Address',
          icon: Icons.alternate_email_rounded,
          hint: 'owner@example.com',
          isDark: isDark,
        ),
        const SizedBox(height: 24),
        Obx(
          () => _buildTextField(
            controller: controller.passwordController,
            label: 'Password',
            icon: Icons.lock_outline_rounded,
            hint: '••••••••',
            isPassword: true,
            obscureText: !controller.isPasswordVisible.value,
            onTogglePassword: controller.togglePasswordVisibility,
            isDark: isDark,
          ),
        ),
      ],
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
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
              fontFamily: 'Syne',
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1,
            ),
            boxShadow: [
              if (!isDark)
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
            ],
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            style: TextStyle(
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
              fontFamily: 'Syne',
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                color: isDark
                    ? AppColors.textDisabledDark
                    : AppColors.textDisabledLight,
                fontSize: 14,
              ),
              prefixIcon: Icon(icon, color: AppColors.accent, size: 20),
              suffixIcon: isPassword
                  ? IconButton(
                      icon: Icon(
                        obscureText
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppColors.accent.withOpacity(0.5),
                        size: 20,
                      ),
                      onPressed: onTogglePassword,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 18,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton(bool isDark) {
    return Obx(
      () => Container(
        width: double.infinity,
        height: 60,
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
          onPressed: controller.isLoading.value ? null : controller.login,
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
              : const Text(
                  'SIGN IN',
                  style: TextStyle(
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
