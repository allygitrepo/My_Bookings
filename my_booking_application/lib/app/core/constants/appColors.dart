import 'package:flutter/material.dart';

/// ─────────────────────────────────────────────────────────────────────────────
/// AppColors — Momentra Design System
/// ─────────────────────────────────────────────────────────────────────────────
/// Usage:
///   • AppColors.primary          → main brand color
///   • AppColors.light            → full light-mode ColorScheme
///   • AppColors.dark             → full dark-mode ColorScheme
///   • AppColors.primarySwatch    → MaterialColor for ThemeData
///
/// In ThemeData:
///   ThemeData(
///     colorScheme: AppColors.light,
///     // or
///     colorScheme: AppColors.dark,
///   )
/// ─────────────────────────────────────────────────────────────────────────────

abstract final class AppColors {
  AppColors._();

  // ───────────────────────────────────────────────
  // 1. RAW PALETTE  (reference these everywhere)
  // ───────────────────────────────────────────────

  // Navy ramp
  static const Color navy900 = Color(0xFF080D2B);
  static const Color navy800 = Color(0xFF0D1245);
  static const Color navy700 = Color(0xFF141A60);
  static const Color navy600 = Color(0xFF1A237E); // ← primary brand
  static const Color navy500 = Color(0xFF2535A0);
  static const Color navy400 = Color(0xFF3A4DC4);
  static const Color navy300 = Color(0xFF6474D8);
  static const Color navy200 = Color(0xFF9BA8E8);
  static const Color navy100 = Color(0xFFC5CAE9);
  static const Color navy50  = Color(0xFFE8EAF6);

  // Violet ramp
  static const Color violet900 = Color(0xFF1A0535);
  static const Color violet800 = Color(0xFF2D0A5E);
  static const Color violet700 = Color(0xFF3D1080);
  static const Color violet600 = Color(0xFF4A148C); // ← secondary brand
  static const Color violet500 = Color(0xFF6A1BAD);
  static const Color violet400 = Color(0xFF7C4DFF); // ← accent / CTA
  static const Color violet300 = Color(0xFF9575CD);
  static const Color violet200 = Color(0xFFB39DDB);
  static const Color violet100 = Color(0xFFD1C4E9);
  static const Color violet50  = Color(0xFFEDE7F6);

  // Lavender (neutral tones)
  static const Color lavender400 = Color(0xFF9575CD);
  static const Color lavender300 = Color(0xFFB0A8D8);
  static const Color lavender200 = Color(0xFFC5CAE9);
  static const Color lavender100 = Color(0xFFE0E0F0);
  static const Color lavender50  = Color(0xFFF5F3FF);

  // ───────────────────────────────────────────────
  // 2. SEMANTIC TOKENS
  // ───────────────────────────────────────────────

  // Brand
  static const Color primary        = navy600;       // #1A237E
  static const Color primaryLight   = navy400;       // #3A4DC4
  static const Color primaryDark    = navy800;       // #0D1245

  static const Color secondary      = violet600;     // #4A148C
  static const Color secondaryLight = violet400;     // #7C4DFF
  static const Color secondaryDark  = violet800;     // #2D0A5E

  static const Color accent         = violet400;     // #7C4DFF  — CTA, FAB, active
  static const Color accentSoft     = lavender400;   // #9575CD  — hover, highlight

  // Functional (status)
  static const Color success        = Color(0xFF00BFA5);
  static const Color successLight   = Color(0xFFE0F5F1);
  static const Color successDark    = Color(0xFF007A68);

  static const Color warning        = Color(0xFFFFB300);
  static const Color warningLight   = Color(0xFFFFF8E1);
  static const Color warningDark    = Color(0xFFE65100);

  static const Color error          = Color(0xFFF44336);
  static const Color errorLight     = Color(0xFFFFEBEE);
  static const Color errorDark      = Color(0xFFB71C1C);

  static const Color info           = violet400;     // reuse accent for info
  static const Color infoLight      = violet50;
  static const Color infoDark       = violet600;

  // ───────────────────────────────────────────────
  // 3. SURFACE & BACKGROUND
  // ───────────────────────────────────────────────

  // Light mode surfaces
  static const Color backgroundLight        = Color(0xFFF5F3FF); // lavender-tinted page
  static const Color surfaceLight           = Color(0xFFFFFFFF);
  static const Color surfaceVariantLight    = Color(0xFFEDE7F6);
  static const Color cardLight              = Color(0xFFFFFFFF);
  static const Color dividerLight           = Color(0xFFD1C4E9);

  // Dark mode surfaces
  static const Color backgroundDark         = Color(0xFF0B0920);
  static const Color surfaceDark            = Color(0xFF12103A);
  static const Color surfaceVariantDark     = Color(0xFF1C1850);
  static const Color cardDark               = Color(0xFF1C1850);
  static const Color dividerDark            = Color(0xFF2D2870);

  // ───────────────────────────────────────────────
  // 4. TEXT
  // ───────────────────────────────────────────────

  // Light mode text
  static const Color textPrimaryLight    = Color(0xFF1A237E); // navy headings
  static const Color textSecondaryLight  = Color(0xFF4A5568);
  static const Color textTertiaryLight   = Color(0xFF9575CD); // lavender muted
  static const Color textDisabledLight   = Color(0xFFB0BEC5);
  static const Color textOnPrimary       = Color(0xFFFFFFFF);
  static const Color textOnAccent        = Color(0xFFFFFFFF);

  // Dark mode text
  static const Color textPrimaryDark     = Color(0xFFEDE7F6);
  static const Color textSecondaryDark   = Color(0xFF9E9CC0);
  static const Color textTertiaryDark    = Color(0xFF7068A8);
  static const Color textDisabledDark    = Color(0xFF4A4870);
  static const Color textOnPrimaryDark   = Color(0xFFEDE7F6);

  // ───────────────────────────────────────────────
  // 5. ICON COLORS
  // ───────────────────────────────────────────────

  static const Color iconPrimaryLight    = navy600;
  static const Color iconSecondaryLight  = lavender400;
  static const Color iconDisabledLight   = Color(0xFFB0BEC5);

  static const Color iconPrimaryDark     = lavender200;
  static const Color iconSecondaryDark   = lavender400;
  static const Color iconDisabledDark    = Color(0xFF4A4870);

  // ───────────────────────────────────────────────
  // 6. BORDER & SHADOW
  // ───────────────────────────────────────────────

  static const Color borderLight         = Color(0xFFC5CAE9);
  static const Color borderFocusLight    = violet400;
  static const Color borderDark          = Color(0xFF2D2870);
  static const Color borderFocusDark     = violet400;

  static const Color shadowLight         = Color(0x1A1A237E); // navy @ 10%
  static const Color shadowDark          = Color(0x407C4DFF); // accent @ 25%

  // ───────────────────────────────────────────────
  // 7. SPLASH / OVERLAY
  // ───────────────────────────────────────────────

  static const Color splashBackground    = Color(0xFF0B0920);
  static const Color splashOrb1          = Color(0x663D1FA8); // navy orb
  static const Color splashOrb2          = Color(0x666A0DAD); // violet orb
  static const Color splashArcStart      = Color(0x007C4DFF); // transparent
  static const Color splashArcEnd        = Color(0xFF9575CD);
  static const Color splashProgressBar   = violet400;
  static const Color splashProgressGlow  = Color(0x807C4DFF);

  // ───────────────────────────────────────────────
  // 8. GRADIENT HELPERS
  // ───────────────────────────────────────────────

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [navy600, violet600],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [navy600, violet400, lavender400],
  );

  static const LinearGradient logoGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [navy600, violet600],
  );

  static const LinearGradient darkPageGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0B0920), Color(0xFF12103A)],
  );

  static const LinearGradient textGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [lavender200, lavender400, violet400],
  );

  // ───────────────────────────────────────────────
  // 9. MATERIAL COLOR SWATCH  (for ThemeData.primarySwatch)
  // ───────────────────────────────────────────────

  static const MaterialColor primarySwatch = MaterialColor(
    0xFF1A237E,
    <int, Color>{
      50:  navy50,
      100: navy100,
      200: navy200,
      300: navy300,
      400: navy400,
      500: navy500,
      600: navy600,
      700: navy700,
      800: navy800,
      900: navy900,
    },
  );

  static const MaterialColor accentSwatch = MaterialColor(
    0xFF7C4DFF,
    <int, Color>{
      50:  violet50,
      100: violet100,
      200: violet200,
      300: violet300,
      400: violet400,
      500: violet500,
      600: violet600,
      700: violet700,
      800: violet800,
      900: violet900,
    },
  );

  // ───────────────────────────────────────────────
  // 10. COLOR SCHEMES  (Material 3)
  // ───────────────────────────────────────────────

  /// Light ColorScheme — use with ThemeData(colorScheme: AppColors.light)
  static const ColorScheme light = ColorScheme(
    brightness: Brightness.light,

    // Primary
    primary:            navy600,
    onPrimary:          Color(0xFFFFFFFF),
    primaryContainer:   navy50,
    onPrimaryContainer: navy800,

    // Secondary
    secondary:            violet600,
    onSecondary:          Color(0xFFFFFFFF),
    secondaryContainer:   violet50,
    onSecondaryContainer: violet800,

    // Tertiary (accent)
    tertiary:            violet400,
    onTertiary:          Color(0xFFFFFFFF),
    tertiaryContainer:   violet100,
    onTertiaryContainer: violet700,

    // Error
    error:            Color(0xFFF44336),
    onError:          Color(0xFFFFFFFF),
    errorContainer:   Color(0xFFFFEBEE),
    onErrorContainer: Color(0xFFB71C1C),

    // Surface
    surface:          Color(0xFFFFFFFF),
    onSurface:        navy600,
    surfaceVariant:   Color(0xFFEDE7F6),
    onSurfaceVariant: Color(0xFF4A5568),

    // Outline
    outline:          Color(0xFFC5CAE9),
    outlineVariant:   Color(0xFFD1C4E9),

    // Inverse
    inverseSurface:      navy800,
    onInverseSurface:    Color(0xFFEDE7F6),
    inversePrimary:      navy300,

    // Misc
    shadow:           Color(0x1A1A237E),
    scrim:            Color(0x801A237E),
    surfaceTint:      navy600,
  );

  /// Dark ColorScheme — use with ThemeData(colorScheme: AppColors.dark)
  static const ColorScheme dark = ColorScheme(
    brightness: Brightness.dark,

    // Primary
    primary:            navy300,
    onPrimary:          navy900,
    primaryContainer:   navy700,
    onPrimaryContainer: navy100,

    // Secondary
    secondary:            violet300,
    onSecondary:          violet900,
    secondaryContainer:   violet700,
    onSecondaryContainer: violet100,

    // Tertiary (accent)
    tertiary:            violet400,
    onTertiary:          Color(0xFFFFFFFF),
    tertiaryContainer:   violet800,
    onTertiaryContainer: violet200,

    // Error
    error:            Color(0xFFEF9A9A),
    onError:          Color(0xFF7F0000),
    errorContainer:   Color(0xFFB71C1C),
    onErrorContainer: Color(0xFFFFCDD2),

    // Surface
    surface:          Color(0xFF12103A),
    onSurface:        Color(0xFFEDE7F6),
    surfaceVariant:   Color(0xFF1C1850),
    onSurfaceVariant: Color(0xFF9E9CC0),

    // Outline
    outline:          Color(0xFF2D2870),
    outlineVariant:   Color(0xFF3D3890),

    // Inverse
    inverseSurface:      lavender100,
    onInverseSurface:    navy800,
    inversePrimary:      navy600,

    // Misc
    shadow:           Color(0x407C4DFF),
    scrim:            Color(0x990B0920),
    surfaceTint:      navy300,
  );
}