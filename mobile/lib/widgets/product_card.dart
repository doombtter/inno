import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../domain/category.dart';
import '../domain/product.dart';
import 'metric_badge.dart';
import 'product_thumb.dart';

final _won = NumberFormat('#,##0', 'ko');

/// One row in the category ranking list. The metric badge on the right is
/// driven by the category's key_metric (no hardcoding).
class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.product,
    required this.category,
    this.onTap,
    this.trailing,
  });

  final Product product;
  final Category category;
  final VoidCallback? onTap;

  /// Optional trailing widget (e.g. a "remove" button on the compare screen).
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final metric = product.metricValue(category.keyMetric.field);
    final price = product.price.avgOnline ?? product.price.msrp;
    final thumb = product.images.product.isNotEmpty
        ? product.images.product.first
        : null;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ProductThumb(url: thumb),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: Theme.of(context).textTheme.titleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    product.manufacturer.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                  const SizedBox(height: 6),
                  if (price != null)
                    Text(
                      '${_won.format(price)}원',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (metric != null)
                  MetricBadge(
                    value: metric,
                    unit: category.keyMetric.unit,
                    thresholds: category.insightThresholds,
                    higherIsBetter: category.keyMetric.higherIsBetter,
                  )
                else
                  Text('-', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 2),
                Text(
                  category.keyMetric.label,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
              ],
            ),
            if (trailing != null) ...[
              const SizedBox(width: 4),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}
