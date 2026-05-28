import '../core/api_client.dart';

class ProductRequestsRepository {
  ProductRequestsRepository(this._api);
  final ApiClient _api;

  Future<String> create({
    String? searchQuery,
    String? note,
    String? deviceId,
  }) async {
    final res = await _api.dio.post<Map<String, dynamic>>(
      '/products/requests',
      data: <String, dynamic>{
        if (searchQuery != null) 'searchQuery': searchQuery,
        if (note != null) 'note': note,
        if (deviceId != null) 'deviceId': deviceId,
      },
    );
    return res.data!['id'] as String;
  }
}
