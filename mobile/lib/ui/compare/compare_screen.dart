import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/theme.dart';
import '../../domain/category.dart';
import '../../domain/product.dart';
import '../../providers/categories_providers.dart';
import '../../providers/compare_providers.dart';
import '../../widgets/async_value_view.dart';

final _won = NumberFormat('#,##0', 'ko');

class CompareScreen extends ConsumerWidget {
  const CompareScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slots = ref.watch(compareSlotsProvider);
    final productsAsync = ref.watch(compareProductsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('비교'),
        actions: [
          if (slots.isNotEmpty)
            TextButton(
              onPressed: () =>
                  ref.read(compareSlotsProvider.notifier).clear(),
              child: const Text('전체 해제'),
            ),
        ],
      ),
      body: slots.length < 2
          ? _EmptyState(slotsCount: slots.length)
          : AsyncValueView<List<Product>>(
              value: productsAsync,
              data: (list) => _CompareTable(products: list),
            ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.slotsCount});
  final int slotsCount;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.compare_arrows, size: 48),
            const SizedBox(height: 12),
            Text(
              slotsCount == 0
                  ? '제품 2개 이상을 비교 슬롯에 담아보세요'
                  : '한 개 더 담으면 비교를 볼 수 있어요',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: () => context.go('/'),
              child: const Text('카테고리 보러가기'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompareTable extends ConsumerWidget {
  const _CompareTable({required this.products});
  final List<Product> products;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (products.isEmpty) {
      return const Center(child: Text('제품 정보를 불러오지 못했어요'));
    }
    final categoryAsync =
        ref.watch(categoryBySlugProvider(products.first.category.slug));

    final sameCategory =
        products.every((p) => p.category.slug == products.first.category.slug);

    return AsyncValueView<Category>(
      value: categoryAsync,
      data: (category) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!sameCategory)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '서로 다른 카테고리는 일부 항목만 비교됩니다',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            _CompareHeader(products: products),
            const SizedBox(height: 12),
            _CompareRow(
              label: category.keyMetric.label,
              values: products
                  .map((p) => _MetricValue(
                        text: _fmtPct(
                            p.metricValue(category.keyMetric.field)),
                        raw: p.metricValue(category.keyMetric.field),
                      ))
                  .toList(),
              higherIsBetter: category.keyMetric.higherIsBetter,
            ),
            _CompareRow(
              label: '나트륨',
              values: products
                  .map((p) => _MetricValue(
                        text: _fmtMg(p.nutrition.sodium),
                        raw: p.nutrition.sodium,
                      ))
                  .toList(),
              higherIsBetter: false,
            ),
            _CompareRow(
              label: '칼로리',
              values: products
                  .map((p) => _MetricValue(
                        text: _fmtKcal(p.nutrition.kcal),
                        raw: p.nutrition.kcal,
                      ))
                  .toList(),
              higherIsBetter: false,
            ),
            _CompareRow(
              label: '평균가',
              values: products.map((p) {
                final price = p.price.avgOnline ?? p.price.msrp;
                return _MetricValue(
                  text: price == null ? '-' : '${_won.format(price)}원',
                  raw: price,
                );
              }).toList(),
              higherIsBetter: false,
            ),
            _CompareRow(
              label: '첨가물 수',
              values: products
                  .map((p) => _MetricValue(
                        text: '${p.additives.length}개',
                        raw: p.additives.length,
                      ))
                  .toList(),
              higherIsBetter: false,
            ),
          ],
        ),
      ),
    );
  }

  static String _fmtPct(double? v) => v == null
      ? '-'
      : '${v % 1 == 0 ? v.toInt() : v.toStringAsFixed(1)}%';
  static String _fmtMg(double? v) =>
      v == null ? '-' : '${v.toStringAsFixed(0)}mg';
  static String _fmtKcal(double? v) =>
      v == null ? '-' : '${v.toStringAsFixed(0)}kcal';
}

class _CompareHeader extends ConsumerWidget {
  const _CompareHeader({required this.products});
  final List<Product> products;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        const SizedBox(width: 80),
        for (final p in products)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                children: [
                  Text(
                    p.name,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    p.manufacturer.name,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                  const SizedBox(height: 4),
                  IconButton(
                    icon: const Icon(Icons.close, size: 16),
                    visualDensity: VisualDensity.compact,
                    onPressed: () => ref
                        .read(compareSlotsProvider.notifier)
                        .remove(p.id),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _CompareRow extends StatelessWidget {
  const _CompareRow({
    required this.label,
    required this.values,
    required this.higherIsBetter,
  });
  final String label;
  final List<_MetricValue> values;
  final bool higherIsBetter;

  @override
  Widget build(BuildContext context) {
    final winnerIndex = _findWinner();
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade700,
                  ),
            ),
          ),
          for (var i = 0; i < values.length; i++)
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 6),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: i == winnerIndex
                      ? InnoTheme.signalGood.withOpacity(0.08)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  values[i].text,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: i == winnerIndex
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: i == winnerIndex
                            ? InnoTheme.signalGood
                            : null,
                      ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  int? _findWinner() {
    final nums = <int, num>{};
    for (var i = 0; i < values.length; i++) {
      final v = values[i].raw;
      if (v is num) nums[i] = v;
    }
    if (nums.length < 2) return null;
    final entries = nums.entries.toList();
    entries.sort((a, b) =>
        higherIsBetter ? b.value.compareTo(a.value) : a.value.compareTo(b.value));
    if (entries.length >= 2 && entries[0].value == entries[1].value) {
      return null; // tied — no winner
    }
    return entries.first.key;
  }
}

class _MetricValue {
  const _MetricValue({required this.text, required this.raw});
  final String text;
  final Object? raw;
}
