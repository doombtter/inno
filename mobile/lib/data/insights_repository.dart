import '../core/api_client.dart';
import '../domain/insight.dart';

class InsightsRepository {
  InsightsRepository(this._api);
  final ApiClient _api;

  Future<List<Insight>> list() async {
    final res = await _api.dio.get<List<dynamic>>('/content/insights');
    return (res.data ?? const [])
        .map((e) => Insight.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Insight> findBySlug(String slug) async {
    final res =
        await _api.dio.get<Map<String, dynamic>>('/content/insights/$slug');
    return Insight.fromJson(res.data!);
  }
}
