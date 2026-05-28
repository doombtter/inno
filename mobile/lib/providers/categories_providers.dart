import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/category.dart';
import 'api_providers.dart';

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  return ref.watch(categoriesRepositoryProvider).list();
});

final categoryBySlugProvider =
    FutureProvider.family<Category, String>((ref, slug) async {
  final list = await ref.watch(categoriesProvider.future);
  return list.firstWhere(
    (c) => c.slug == slug,
    orElse: () => throw StateError("Unknown category '$slug'"),
  );
});
