import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/insight.dart';
import 'api_providers.dart';

final insightsListProvider = FutureProvider<List<Insight>>((ref) async {
  return ref.watch(insightsRepositoryProvider).list();
});

final insightBySlugProvider =
    FutureProvider.family<Insight, String>((ref, slug) async {
  return ref.watch(insightsRepositoryProvider).findBySlug(slug);
});
