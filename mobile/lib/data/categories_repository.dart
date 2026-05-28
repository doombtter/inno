import '../core/api_client.dart';
import '../domain/category.dart';

class CategoriesRepository {
  CategoriesRepository(this._api);
  final ApiClient _api;

  Future<List<Category>> list() async {
    final res = await _api.dio.get<List<dynamic>>('/categories');
    return (res.data ?? const [])
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
