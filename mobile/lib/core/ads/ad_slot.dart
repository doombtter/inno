import 'package:flutter/material.dart';

import '../env.dart';

/// Placeholder ad slot reserved in the layout from day one so swapping in a
/// real ad network later doesn't require shuffling screens. While
/// [Env.adsEnabled] is false (MVP), the widget collapses to zero size.
class AdSlot extends StatelessWidget {
  const AdSlot({
    super.key,
    required this.placement,
    this.height = 56,
  });

  /// Symbolic id (e.g. 'home_top', 'category_inline'). Will be passed to the
  /// ad SDK once integrated.
  final String placement;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (!Env.adsEnabled) return const SizedBox.shrink();

    return Container(
      height: height,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'AD · $placement',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.grey.shade500,
            ),
      ),
    );
  }
}
