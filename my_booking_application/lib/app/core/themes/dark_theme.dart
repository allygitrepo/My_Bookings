import 'package:flutter/material.dart';
import '../constants/appColors.dart';

final ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: AppColors.dark,
  primaryColor: AppColors.navy300,
  scaffoldBackgroundColor: AppColors.backgroundDark,
  fontFamily: 'Syne',

  // AppBar Theme
  appBarTheme: AppBarTheme(
    backgroundColor: Colors.transparent,
    elevation: 0,
    centerTitle: true,
    titleTextStyle: TextStyle(
      color: AppColors.textPrimaryDark,
      fontSize: 20,
      fontWeight: FontWeight.bold,
      fontFamily: 'Syne',
    ),
    iconTheme: IconThemeData(color: AppColors.lavender200),
  ),

  // Card Theme
  cardTheme: CardThemeData(
    color: AppColors.cardDark,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: AppColors.dividerDark, width: 1),
    ),
    margin: const EdgeInsets.only(bottom: 16),
  ),

  // Input Decoration Theme
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.surfaceVariantDark,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.borderDark),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.borderDark),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.borderFocusDark, width: 2),
    ),
    labelStyle: const TextStyle(color: AppColors.textSecondaryDark),
    hintStyle: const TextStyle(color: AppColors.textDisabledDark),
  ),

  // Button Themes
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.accent,
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, 54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 4,
      shadowColor: AppColors.shadowDark,
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        fontFamily: 'Syne',
      ),
    ),
  ),

  // Text Theme
  textTheme: TextTheme(
    displayLarge: TextStyle(color: AppColors.textPrimaryDark, fontWeight: FontWeight.bold),
    headlineMedium: TextStyle(color: AppColors.textPrimaryDark, fontWeight: FontWeight.bold),
    bodyLarge: TextStyle(color: AppColors.textPrimaryDark),
    bodyMedium: TextStyle(color: AppColors.textSecondaryDark),
  ),
);
