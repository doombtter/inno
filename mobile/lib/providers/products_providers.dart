import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/paged.dart';
import '../domain/product.dart';
import 'api_providers.dart';

/// Sort parameter for the category listing screen, scoped per category.
final categorySortProvider =
    StateProvider.family<String?, String>((ref, slug) => null);

/// Page-1 product list for a category, re-fetched whenever [categorySortProvider]
/// for that slug changes. (Pagination is not in MVP; the screen shows the
/// first page only.)
final categoryProductsProvider =
    FutureProvider.family<Paged<Product>, String>((ref, slug) async {
  final sort = ref.watch(categorySortProvider(slug));
  return ref.watch(productsRepositoryProvider).listByCategory(
        slug,
        sort: sort,
        size: 50,
      );
});

final productDetailProvider =
    FutureProvider.family<Product, String>((ref, id) async {
  return ref.watch(productsRepositoryProvider).findById(id);
});

final productSearchQueryProvider = StateProvider<String>((ref) => '');

final productSearchResultsProvider =
    FutureProvider<List<Product>>((ref) async {
  final q = ref.watch(productSearchQueryProvider).trim();
  if (q.isEmpty) return const [];
  return ref.watch(productsRepositoryProvider).search(q);
});
