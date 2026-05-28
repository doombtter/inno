import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api_client.dart';
import '../data/categories_repository.dart';
import '../data/insights_repository.dart';
import '../data/product_requests_repository.dart';
import '../data/products_repository.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final categoriesRepositoryProvider = Provider<CategoriesRepository>(
  (ref) => CategoriesRepository(ref.watch(apiClientProvider)),
);

final productsRepositoryProvider = Provider<ProductsRepository>(
  (ref) => ProductsRepository(ref.watch(apiClientProvider)),
);

final insightsRepositoryProvider = Provider<InsightsRepository>(
  (ref) => InsightsRepository(ref.watch(apiClientProvider)),
);

final productRequestsRepositoryProvider = Provider<ProductRequestsRepository>(
  (ref) => ProductRequestsRepository(ref.watch(apiClientProvider)),
);
