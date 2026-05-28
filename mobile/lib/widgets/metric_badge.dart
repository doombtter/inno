import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../domain/category.dart';

/// Compact "91%" badge in the signal color for a given category metric.
class MetricBadge extends StatelessWidget {
  const MetricBadge({
    super.key,
    required this.value,
    required this.unit,
    required this.thresholds,
    required this.higherIsBetter,
    this.large = false,
  });

  final num value;
  final String unit;
  final CategoryThresholds thresholds;
  final bool higherIsBetter;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final color = signalColor(
      value: value,
      good: thresholds.good,
      warning: thresholds.warning,
      higherIsBetter: higherIsBetter,
    );
    final style = (large
            ? Theme.of(context).textTheme.displaySmall
            : Theme.of(context).textTheme.titleLarge)
        ?.copyWith(color: color, fontWeight: FontWeight.w700);

    return Text.rich(
      TextSpan(
        children: [
          TextSpan(text: _format(value), style: style),
          TextSpan(
            text: unit,
            style: style?.copyWith(
              fontSize: (style.fontSize ?? 16) * 0.6,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  static String _format(num v) {
    // Whole numbers render without a trailing .0; one decimal otherwise.
    if (v % 1 == 0) return v.toInt().toString();
    return v.toStringAsFixed(1);
  }
}
