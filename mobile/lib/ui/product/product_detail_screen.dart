import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme.dart';
import '../../domain/category.dart';
import '../../domain/product.dart';
import '../../providers/categories_providers.dart';
import '../../providers/compare_providers.dart';
import '../../providers/products_providers.dart';
import '../../widgets/async_value_view.dart';
import '../../widgets/metric_badge.dart';

final _won = NumberFormat('#,##0', 'ko');

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productAsync = ref.watch(productDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('')),
      body: AsyncValueView<Product>(
        value: productAsync,
        onRetry: () => ref.invalidate(productDetailProvider(id)),
        data: (p) => _Body(product: p),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoryAsync =
        ref.watch(categoryBySlugProvider(product.category.slug));
    final slots = ref.watch(compareSlotsProvider);
    final inSlots = slots.contains(product.id);

    return AsyncValueView<Category>(
      value: categoryAsync,
      data: (category) => ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          _Header(product: product),
          const SizedBox(height: 16),
          _MetricCard(product: product, category: category),
          const SizedBox(height: 16),
          _IngredientsSection(product: product),
          const SizedBox(height: 16),
          _NutritionSection(product: product),
          const SizedBox(height: 16),
          if (product.additives.isNotEmpty || product.allergens.isNotEmpty)
            _CautionSection(product: product),
          const SizedBox(height: 24),
          _CompareButton(
            product: product,
            inSlots: inSlots,
            full: ref.read(compareSlotsProvider.notifier).isFull,
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final imgs = product.images.product;
    final price = product.price.avgOnline ?? product.price.msrp;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (imgs.isNotEmpty)
          AspectRatio(
            aspectRatio: 1,
            child: PageView.builder(
              itemCount: imgs.length,
              itemBuilder: (_, i) => CachedNetworkImage(
                imageUrl: imgs[i],
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) =>
                    Container(color: Colors.grey.shade100),
              ),
            ),
          ),
        const SizedBox(height: 12),
        Text(product.name,
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          '${product.manufacturer.name} · ${_volume(product.volume)}',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
        ),
        if (price != null) ...[
          const SizedBox(height: 4),
          Text(
            '평균 ${_won.format(price)}원',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ],
    );
  }

  static String _volume(Volume v) {
    final n = v.value % 1 == 0 ? v.value.toInt().toString() : v.value.toString();
    return '$n${v.unit}';
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.product, required this.category});
  final Product product;
  final Category category;

  @override
  Widget build(BuildContext context) {
    final value = product.metricValue(category.keyMetric.field);
    final stats = product.categoryStats;
    if (value == null) return const SizedBox.shrink();

    final diff = stats == null ? null : value - stats.avgKeyMetric;
    final diffText = diff == null
        ? null
        : (diff > 0
            ? '카테고리 평균보다 +${diff.toStringAsFixed(1)}${category.keyMetric.unit}'
            : '카테고리 평균보다 ${diff.toStringAsFixed(1)}${category.keyMetric.unit}');

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            category.keyMetric.label,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.grey.shade700,
                ),
          ),
          const SizedBox(height: 8),
          MetricBadge(
            value: value,
            unit: category.keyMetric.unit,
            thresholds: category.insightThresholds,
            higherIsBetter: category.keyMetric.higherIsBetter,
            large: true,
          ),
          if (diffText != null) ...[
            const SizedBox(height: 4),
            Text(
              diffText,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if (stats != null) ...[
            const SizedBox(height: 4),
            Text(
              '${stats.total}개 중 ${stats.rank}위',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _IngredientsSection extends StatelessWidget {
  const _IngredientsSection({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final parts = product.ingredients.parsed;
    return _Section(
      title: '원재료',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final p in parts)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: _IngredientBar(part: p),
            ),
          if (product.ingredients.rawText.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              product.ingredients.rawText,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                    height: 1.4,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _IngredientBar extends StatelessWidget {
  const _IngredientBar({required this.part});
  final IngredientPart part;

  @override
  Widget build(BuildContext context) {
    final pct = part.pct;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            part.name,
            style: Theme.of(context).textTheme.bodyMedium,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: pct == null
              ? Text(
                  '함량 미표시',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade500,
                      ),
                )
              : Stack(
                  children: [
                    Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: (pct / 100).clamp(0, 1),
                      child: Container(
                        height: 8,
                        decoration: BoxDecoration(
                          color: InnoTheme.seed,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ],
                ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 48,
          child: Text(
            pct == null ? '' : '${pct.toStringAsFixed(pct % 1 == 0 ? 0 : 1)}%',
            textAlign: TextAlign.right,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

class _NutritionSection extends StatelessWidget {
  const _NutritionSection({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final n = product.nutrition;
    final unitLabel = switch (n.baseUnit) {
      '100g' => '100g 기준',
      '100ml' => '100ml 기준',
      _ => '1회 제공량 기준',
    };

    final rows = <(String, String)>[
      if (n.kcal != null) ('칼로리', '${n.kcal!.toStringAsFixed(0)} kcal'),
      if (n.protein != null) ('단백질', '${n.protein!.toStringAsFixed(1)} g'),
      if (n.fat != null) ('지방', '${n.fat!.toStringAsFixed(1)} g'),
      if (n.saturatedFat != null)
        ('포화지방', '${n.saturatedFat!.toStringAsFixed(1)} g'),
      if (n.carb != null) ('탄수화물', '${n.carb!.toStringAsFixed(1)} g'),
      if (n.sugar != null) ('당류', '${n.sugar!.toStringAsFixed(1)} g'),
      if (n.sodium != null) ('나트륨', '${n.sodium!.toStringAsFixed(0)} mg'),
      if (n.cholesterol != null)
        ('콜레스테롤', '${n.cholesterol!.toStringAsFixed(0)} mg'),
    ];

    return _Section(
      title: '영양성분',
      trailing: Text(
        unitLabel,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey.shade600,
            ),
      ),
      child: Column(
        children: [
          for (final (label, value) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(label,
                        style: Theme.of(context).textTheme.bodyMedium),
                  ),
                  Text(value, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _CautionSection extends StatelessWidget {
  const _CautionSection({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    return _Section(
      title: '주의 성분',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.additives.isNotEmpty) ...[
            Text('첨가물', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: product.additives
                  .map((a) => Chip(label: Text(a)))
                  .toList(),
            ),
          ],
          if (product.allergens.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('알레르기 유발 성분',
                style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: product.allergens
                  .map((a) => Chip(
                        label: Text(a),
                        backgroundColor: const Color(0xFFFFF1F2),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.trailing});
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(title,
                  style: Theme.of(context).textTheme.titleMedium),
            ),
            if (trailing != null) trailing!,
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }
}

class _CompareButton extends ConsumerWidget {
  const _CompareButton({
    required this.product,
    required this.inSlots,
    required this.full,
  });
  final Product product;
  final bool inSlots;
  final bool full;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: inSlots
            ? () {
                ref.read(compareSlotsProvider.notifier).remove(product.id);
              }
            : full
                ? null
                : () {
                    final added = ref
                        .read(compareSlotsProvider.notifier)
                        .add(product.id);
                    if (added) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('비교 슬롯에 추가했어요'),
                          action: SnackBarAction(
                            label: '비교 보기',
                            onPressed: () =>
                                GoRouter.of(context).push('/compare'),
                          ),
                        ),
                      );
                    }
                  },
        icon: Icon(inSlots ? Icons.check : Icons.compare_arrows),
        label: Text(
          inSlots
              ? '비교 슬롯에서 빼기'
              : full
                  ? '비교 슬롯이 가득 찼어요'
                  : '비교에 추가',
        ),
      ),
    );
  }
}
