import 'package:flutter/material.dart';

class GymTheme {
  static const brand = Color(0xFF1E3A5F);
  static const brandDark = Color(0xFF17324F);
  static const canvas = Color(0xFFF7F8FA);
  static const ink = Color(0xFF172033);
  static const muted = Color(0xFF667085);
  static const success = Color(0xFF027A48);
  static const warning = Color(0xFFB54708);

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(seedColor: brand, primary: brand);
    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: canvas,
      appBarTheme: const AppBarTheme(
        backgroundColor: brand,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
