import 'package:dio/dio.dart';

import 'env.dart';

/// Thin wrapper around Dio with a sensible baseUrl, JSON content type, and
/// short-ish timeouts. Errors are surfaced as [DioException], which the
/// repositories translate into user-readable messages.
class ApiClient {
  ApiClient([Dio? dio])
      : dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: '${Env.apiBaseUrl}/api',
                connectTimeout: const Duration(seconds: 5),
                receiveTimeout: const Duration(seconds: 10),
                sendTimeout: const Duration(seconds: 10),
                responseType: ResponseType.json,
                headers: const {'Accept': 'application/json'},
              ),
            );

  final Dio dio;
}
