import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/category.dart';
import '../../providers/categories_providers.dart';
import '../../providers/products_providers.dart';
import '../../widgets/async_value_view.dart';
import '../../widgets/product_card.dart';

class CategoryScreen extends ConsumerWidget {
  const CategoryScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoryAsync = ref.watch(categoryBySlugProvider(slug));
    return Scaffold(
      appBar: AppBar(
        title: categoryAsync.maybeWhen(
          data: (c) => Text(c.name),
          orElse: () => const Text(''),
        ),
        actions: [
          IconButton(
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      body: AsyncValueView<Category>(
        value: categoryAsync,
        data: (category) => _CategoryBody(category: category),
      ),
    );
  }
}

class _CategoryBody extends ConsumerWidget {
  const _CategoryBody({required this.category});
  final Category category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(categoryProductsProvider(category.slug));
    final sort = ref.watch(categorySortProvider(category.slug));

    return Column(
      children: [
        _SortBar(category: category, selected: sort),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(categoryProductsProvider(category.slug));
            },
            child: AsyncValueView(
              value: products,
              onRetry: () =>
                  ref.invalidate(categoryProductsProvider(category.slug)),
              data: (paged) {
                if (paged.items.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('아직 등록된 제품이 없어요'),
                    ),
                  );
                }
                return ListView.separated(
                  itemCount: paged.items.length,
                  separatorBuilder: (_, __) =>
                      Divider(height: 1, color: Colors.grey.shade200),
                  itemBuilder: (context, i) {
                    final p = paged.items[i];
                    return ProductCard(
                      product: p,
                      category: category,
                      onTap: () => context.push('/product/${p.id}'),
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _SortBar extends ConsumerWidget {
  const _SortBar({required this.category, required this.selected});
  final Category category;
  final String? selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Always include the category's key metric as the default chip.
    final keyFieldQualified = 'key_metrics.${category.keyMetric.field}';
    final chips = <_SortOption>[
      _SortOption(
        label: category.keyMetric.label,
        field: keyFieldQualified,
        higherIsBetter: category.keyMetric.higherIsBetter,
      ),
      ...category.sortableFields
          .where((f) => f.field != keyFieldQualified)
          .map((f) => _SortOption(
                label: f.label,
                field: f.field,
                higherIsBetter: f.higherIsBetter,
              )),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: Colors.white,
      child: SizedBox(
        height: 36,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: chips.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            final opt = chips[i];
            final isDefault = i == 0 && selected == null;
            final isSelected = isDefault || selected?.startsWith(opt.field) == true;
            final arrow = opt.higherIsBetter ? '↓' : '↑';
            return ChoiceChip(
              label: Text('${opt.label} $arrow'),
              selected: isSelected,
              onSelected: (_) {
                final direction = opt.higherIsBetter ? 'desc' : 'asc';
                ref.read(categorySortProvider(category.slug).notifier).state =
                    '${opt.field}:$direction';
              },
            );
          },
        ),
      ),
    );
  }
}

class _SortOption {
  const _SortOption({
    required this.label,
    required this.field,
    required this.higherIsBetter,
  });
  final String label;
  final String field;
  final bool higherIsBetter;
}
