import 'package:flutter/material.dart';

class ScreenAdapter {
  static late MediaQueryData _mediaQueryData;
  static late double screenWidth;
  static late double screenHeight;
  static late double pixelRatio;
  static late Orientation orientation;

  /// Initialize the adapter with context. Best called in the build method of the root widget.
  static void init(BuildContext context) {
    _mediaQueryData = MediaQuery.of(context);
    screenWidth = _mediaQueryData.size.width;
    screenHeight = _mediaQueryData.size.height;
    pixelRatio = _mediaQueryData.devicePixelRatio;
    orientation = _mediaQueryData.orientation;
  }

  // ── Breakpoints ──
  static const double mobileBreakpoint = 600;
  static const double tabletBreakpoint = 1024;

  // ── Helper Getters ──
  static bool isMobile(BuildContext context) => 
      MediaQuery.of(context).size.width < mobileBreakpoint;

  static bool isTablet(BuildContext context) => 
      MediaQuery.of(context).size.width >= mobileBreakpoint && 
      MediaQuery.of(context).size.width < tabletBreakpoint;

  static bool isDesktop(BuildContext context) => 
      MediaQuery.of(context).size.width >= tabletBreakpoint;

  // ── Proportional Scaling ──
  /// Returns a width proportional to the design screen width (e.g. 375 for mobile)
  static double setWidth(double width) {
    return width * (screenWidth / 375);
  }

  /// Returns a height proportional to the design screen height (e.g. 812 for mobile)
  static double setHeight(double height) {
    return height * (screenHeight / 812);
  }

  /// Returns a font size proportional to the screen width
  static double setFontSize(double fontSize) {
    return fontSize * (screenWidth / 375);
  }
}

// ── RESPONSIVE WIDGET HELPER ──
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    required this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= ScreenAdapter.tabletBreakpoint) {
          return desktop;
        } else if (constraints.maxWidth >= ScreenAdapter.mobileBreakpoint) {
          return tablet ?? mobile;
        } else {
          return mobile;
        }
      },
    );
  }
}
