import 'package:flutter/material.dart';

/// Inno theme — neutral surface, the content-percentage number does the
/// shouting. Color is only used to signal content quality (good / warning /
/// bad), never as decoration.
class InnoTheme {
  static const Color signalGood = Color(0xFF16A34A); // green-600
  static const Color signalWarning = Color(0xFF6B7280); // gray-500
  static const Color signalBad = Color(0xFFDC2626); // red-600

  static const Color seed = Color(0xFF111827); // near-black accent

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: seed,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: Colors.white,
      fontFamily: 'Roboto',
    );

    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF111827),
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        side: BorderSide(color: Colors.grey.shade300),
        backgroundColor: Colors.white,
        showCheckmark: false,
      ),
      textTheme: base.textTheme.copyWith(
        displayLarge: base.textTheme.displayLarge?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
        headlineSmall: base.textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w600,
        ),
        titleMedium: base.textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Returns the signal color for [value] given a category's thresholds.
/// Above [good] → green, below [warning] → red, otherwise neutral.
Color signalColor({
  required num value,
  required num good,
  required num warning,
  required bool higherIsBetter,
}) {
  if (higherIsBetter) {
    if (value >= good) return InnoTheme.signalGood;
    if (value < warning) return InnoTheme.signalBad;
    return InnoTheme.signalWarning;
  } else {
    if (value <= good) return InnoTheme.signalGood;
    if (value > warning) return InnoTheme.signalBad;
    return InnoTheme.signalWarning;
  }
}
