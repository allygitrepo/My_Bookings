import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:my_booking_application/app/data/services/auth_service.dart';
import 'package:my_booking_application/app/routes/appPages.dart';
import '../../../core/constants/appColors.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // ── Controllers ──────────────────────────────────────────────
  late final AnimationController _orbCtrl;
  late final AnimationController _logoCtrl;
  late final AnimationController _arcCtrl;
  late final AnimationController _pulseCtrl;
  late final AnimationController _textCtrl;
  late final AnimationController _progressCtrl;
  late final AnimationController _shardCtrl;

  // ── Animations ───────────────────────────────────────────────
  late final Animation<double> _orbOpacity;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoOpacity;
  late final Animation<double> _arcRotation;
  late final Animation<double> _pulseScale;
  late final Animation<double> _pulseOpacity;
  late final Animation<double> _brandOpacity;
  late final Animation<Offset> _brandSlide;
  late final Animation<double> _taglineOpacity;
  late final Animation<double> _progressValue;
  late final Animation<double> _progressOpacity;

  @override
  void initState() {
    super.initState();
    _initControllers();
    _initAnimations();
    _startSequence();
  }

  void _initControllers() {
    _orbCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _logoCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _arcCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _textCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _progressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );
    _shardCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4000),
    )..repeat(reverse: true);
  }

  void _initAnimations() {
    // Orbs
    _orbOpacity = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _orbCtrl, curve: Curves.easeOut));

    // Logo spring
    _logoScale = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _logoCtrl,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    // Arc spin (0 → 2π continuous)
    _arcRotation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(parent: _arcCtrl, curve: Curves.linear));

    // Pulse rings
    _pulseScale = Tween<double>(
      begin: 1.0,
      end: 1.06,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _pulseOpacity = Tween<double>(
      begin: 0.35,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    // Brand name / Tagline
    _brandOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _textCtrl,
        curve: const Interval(0.0, 0.55, curve: Curves.easeOut),
      ),
    );
    _brandSlide = Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _textCtrl,
            curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
          ),
        );
    _taglineOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _textCtrl,
        curve: const Interval(0.45, 1.0, curve: Curves.easeOut),
      ),
    );

    // Progress bar
    _progressOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _progressCtrl,
        curve: const Interval(0.0, 0.1, curve: Curves.easeOut),
      ),
    );
    _progressValue = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _progressCtrl,
        curve: const Interval(0.05, 1.0, curve: _ProgressCurve()),
      ),
    );
  }

  Future<void> _startSequence() async {
    // 1. Orbs fade in
    _orbCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 300));

    // 2. Logo spring in
    _logoCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 600));

    // 3. Text slides up
    _textCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 500));

    // 4. Progress bar
    _progressCtrl.forward();

    // 5. Navigate when progress completes
    await Future.delayed(const Duration(milliseconds: 3000));
    if (mounted) {
      final authService = Get.find<AuthService>();
      final destination = authService.isLogged ? Routes.HOME : Routes.LOGIN;

      Get.offAllNamed(destination);
    }
  }

  @override
  void dispose() {
    _orbCtrl.dispose();
    _logoCtrl.dispose();
    _arcCtrl.dispose();
    _pulseCtrl.dispose();
    _textCtrl.dispose();
    _progressCtrl.dispose();
    _shardCtrl.dispose();
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
          // ── Grid background ──
          _buildGrid(isDark),

          // ── Ambient orbs ──
          _buildOrbs(isDark),

          // ── Floating shards ──
          _buildShards(isDark),

          // ── Main content ──
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLogoRing(isDark),
                const SizedBox(height: 28),
                _buildBrandText(isDark),
                const SizedBox(height: 52),
                _buildProgressBar(isDark),
              ],
            ),
          ),

          // ── Footer: Developed By ──
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: _taglineOpacity,
              child: Column(
                children: [
                  Text(
                    'Developed By:',
                    style: TextStyle(
                      fontSize: 12,
                      letterSpacing: 1.2,
                      color: isDark
                          ? AppColors.textSecondaryDark.withOpacity(0.5)
                          : AppColors.textSecondaryLight.withOpacity(0.5),
                      fontFamily: 'Syne',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Image.asset(
                    'assets/images/company_logo.png',
                    height: 30,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.business_rounded,
                      color: AppColors.accent,
                      size: 30,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Grid ──────────────────────────────────────────────────────
  Widget _buildGrid(bool isDark) {
    return Positioned.fill(
      child: AnimatedBuilder(
        animation: _orbOpacity,
        builder: (_, __) => Opacity(
          opacity: _orbOpacity.value * 0.5,
          child: CustomPaint(painter: _GridPainter(isDark)),
        ),
      ),
    );
  }

  // ── Orbs ─────────────────────────────────────────────────────
  Widget _buildOrbs(bool isDark) {
    return AnimatedBuilder(
      animation: _orbOpacity,
      builder: (_, __) => Stack(
        children: [
          _orb(
            size: 380,
            color: isDark ? AppColors.violet900 : AppColors.violet100,
            top: -80,
            right: -60,
          ),
          _orb(
            size: 320,
            color: isDark ? AppColors.navy800 : AppColors.navy100,
            bottom: -70,
            left: -60,
          ),
          _orb(
            size: 200,
            color: isDark
                ? AppColors.primaryDark
                : AppColors.primaryLight.withOpacity(0.3),
            centerOffset: true,
          ),
        ],
      ),
    );
  }

  Widget _orb({
    required double size,
    required Color color,
    double? top,
    double? bottom,
    double? left,
    double? right,
    bool centerOffset = false,
  }) {
    final child = Opacity(
      opacity: _orbOpacity.value,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color.withOpacity(0.65), Colors.transparent],
          ),
        ),
      ),
    );
    if (centerOffset) {
      return Positioned(
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        child: Center(
          child: Transform.translate(
            offset: const Offset(0, -60),
            child: child,
          ),
        ),
      );
    }
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: child,
    );
  }

  // ── Floating shards ───────────────────────────────────────────
  Widget _buildShards(bool isDark) {
    return AnimatedBuilder(
      animation: _shardCtrl,
      builder: (_, __) => Stack(
        children: [
          _shard(0.13, 0.55, 10, 0.38, isDark),
          _shard(0.82, 0.42, 8, -0.26, isDark),
          _shard(0.78, 0.68, 7, 0.61, isDark),
          _shard(0.22, 0.24, 11, -0.52, isDark),
        ],
      ),
    );
  }

  Widget _shard(
    double x,
    double y,
    double size,
    double baseRotation,
    bool isDark,
  ) {
    final t = _shardCtrl.value;
    final opacity =
        (t < 0.3
            ? t / 0.3
            : t > 0.8
            ? (1 - t) / 0.2
            : 1.0) *
        0.22;
    final dy = -28.0 * t;
    final rot = baseRotation + t * 0.3;
    return Positioned(
      left: MediaQuery.of(context).size.width * x,
      top: MediaQuery.of(context).size.height * y + dy,
      child: Opacity(
        opacity: opacity.clamp(0.0, 1.0),
        child: Transform.rotate(
          angle: rot,
          child: CustomPaint(
            size: Size(size, size * 1.4),
            painter: _DiamondPainter(
              (isDark ? AppColors.accent : AppColors.primary).withOpacity(0.4),
            ),
          ),
        ),
      ),
    );
  }

  // ── Logo ring ─────────────────────────────────────────────────
  Widget _buildLogoRing(bool isDark) {
    return AnimatedBuilder(
      animation: Listenable.merge([_logoCtrl, _arcCtrl, _pulseCtrl]),
      builder: (_, __) {
        return ScaleTransition(
          scale: _logoScale,
          child: FadeTransition(
            opacity: _logoOpacity,
            child: SizedBox(
              width: 160,
              height: 160,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Outer pulse ring 2
                  Transform.scale(
                    scale: _pulseScale.value * 1.04,
                    child: Opacity(
                      opacity: _pulseOpacity.value * 0.55,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.accent.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Outer pulse ring 1
                  Transform.scale(
                    scale: _pulseScale.value,
                    child: Opacity(
                      opacity: _pulseOpacity.value,
                      child: Container(
                        width: 142,
                        height: 142,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.accent.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Spinning arc
                  Transform.rotate(
                    angle: _arcRotation.value,
                    child: CustomPaint(
                      size: const Size(130, 130),
                      painter: _ArcPainter(),
                    ),
                  ),
                  // Inner logo circle
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.logoGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accent.withOpacity(0.45),
                          blurRadius: 40,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Image.asset(
                          'assets/icons/app_logo_bg.png',
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(
                                Icons.calendar_today_rounded,
                                color: Colors.white,
                                size: 40,
                              ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ── Brand text ────────────────────────────────────────────────
  Widget _buildBrandText(bool isDark) {
    return Column(
      children: [
        SlideTransition(
          position: _brandSlide,
          child: FadeTransition(
            opacity: _brandOpacity,
            child: ShaderMask(
              shaderCallback: (bounds) =>
                  AppColors.textGradient.createShader(bounds),
              child: const Text(
                'My Bookings',
                style: TextStyle(
                  fontSize: 38,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -0.5,
                  fontFamily: 'Syne',
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        FadeTransition(
          opacity: _taglineOpacity,
          child: Text(
            'YOUR BOOKING PARTNER',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 3.5,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
              fontWeight: FontWeight.w400,
              fontFamily: 'Syne',
            ),
          ),
        ),
      ],
    );
  }

  // ── Progress bar ─────────────────────────────────────────────
  Widget _buildProgressBar(bool isDark) {
    return AnimatedBuilder(
      animation: _progressCtrl,
      builder: (_, __) {
        return FadeTransition(
          opacity: _progressOpacity,
          child: SizedBox(
            width: 180,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Track
                Container(
                  height: 2,
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Fill
                FractionallySizedBox(
                  widthFactor: _progressValue.value,
                  child: Container(
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: AppColors.accentGradient,
                      borderRadius: BorderRadius.circular(2),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accent.withOpacity(0.7),
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  ),
                ),
                // Glow dot
                Positioned(
                  left: 180 * _progressValue.value - 6,
                  top: -4,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.accent.withOpacity(0.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.accent.withOpacity(0.6),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ── Custom Painters ────────────────────────────────────────────

class _GridPainter extends CustomPainter {
  final bool isDark;
  _GridPainter(this.isDark);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = (isDark ? AppColors.accent : AppColors.primary).withOpacity(
        0.04,
      )
      ..strokeWidth = 1;
    const step = 34.0;
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

class _ArcPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..shader = const SweepGradient(
        colors: [
          Colors.transparent,
          AppColors.splashArcStart,
          AppColors.splashArcEnd,
        ],
        stops: [0.0, 0.6, 1.0],
      ).createShader(rect);
    canvas.drawArc(rect.deflate(1), 0, math.pi * 1.65, false, paint);
  }

  @override
  bool shouldRepaint(_) => false;
}

class _DiamondPainter extends CustomPainter {
  final Color color;
  const _DiamondPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(size.width / 2, 0)
      ..lineTo(size.width, size.height / 2)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(0, size.height / 2)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_) => false;
}

// Custom easing for progress bar
class _ProgressCurve extends Curve {
  const _ProgressCurve();
  @override
  double transformInternal(double t) {
    if (t < 0.6) return t * 1.15;
    if (t < 0.85) return 0.69 + (t - 0.6) * 0.44;
    return 0.80 + (t - 0.85) * 1.33;
  }
}
