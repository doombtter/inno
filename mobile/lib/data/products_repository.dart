import '../core/api_client.dart';
import '../domain/paged.dart';
import '../domain/product.dart';

class ProductsRepository {
  ProductsRepository(this._api);
  final ApiClient _api;

  Future<Paged<Product>> listByCategory(
    String slug, {
    String? sort,
    String? manufacturer,
    int? maxPrice,
    int page = 1,
    int size = 20,
  }) async {
    final res = await _api.dio.get<Map<String, dynamic>>(
      '/categories/$slug/products',
      queryParameters: <String, dynamic>{
        if (sort != null) 'sort': sort,
        if (manufacturer != null) 'manufacturer': manufacturer,
        if (maxPrice != null) 'maxPrice': maxPrice,
        'page': page,
        'size': size,
      },
    );
    return Paged.fromJson(res.data!, Product.fromJson);
  }

  Future<Product> findById(String id) async {
    final res = await _api.dio.get<Map<String, dynamic>>('/products/$id');
    return Product.fromJson(res.data!);
  }

  Future<List<Product>> compare(List<String> ids) async {
    final res = await _api.dio.get<List<dynamic>>(
      '/products/compare',
      queryParameters: <String, dynamic>{'ids': ids.join(',')},
    );
    return (res.data ?? const [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Product>> search(String query, {int limit = 20}) async {
    final q = query.trim();
    if (q.isEmpty) return const [];
    final res = await _api.dio.get<List<dynamic>>(
      '/products/search',
      queryParameters: <String, dynamic>{'q': q, 'limit': limit},
    );
    return (res.data ?? const [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
