import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:inno_app/core/theme.dart';
import 'package:inno_app/domain/category.dart';
import 'package:inno_app/widgets/metric_badge.dart';

void main() {
  group('signalColor', () {
    test('higherIsBetter: above good → green', () {
      final c = signalColor(
        value: 91,
        good: 85,
        warning: 70,
        higherIsBetter: true,
      );
      expect(c, InnoTheme.signalGood);
    });

    test('higherIsBetter: below warning → red', () {
      final c = signalColor(
        value: 60,
        good: 85,
        warning: 70,
        higherIsBetter: true,
      );
      expect(c, InnoTheme.signalBad);
    });

    test('higherIsBetter: in-between → neutral', () {
      final c = signalColor(
        value: 78,
        good: 85,
        warning: 70,
        higherIsBetter: true,
      );
      expect(c, InnoTheme.signalWarning);
    });

    test('lowerIsBetter: below good → green', () {
      final c = signalColor(
        value: 600,
        good: 700,
        warning: 900,
        higherIsBetter: false,
      );
      expect(c, InnoTheme.signalGood);
    });
  });

  testWidgets('MetricBadge renders the value with its unit', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MetricBadge(
            value: 91,
            unit: '%',
            thresholds: CategoryThresholds(good: 85, warning: 70),
            higherIsBetter: true,
          ),
        ),
      ),
    );
    expect(find.textContaining('91'), findsOneWidget);
    expect(find.textContaining('%'), findsOneWidget);
  });
}
