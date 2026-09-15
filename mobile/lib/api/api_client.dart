import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBase,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: _accessKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          if (status == 401 && error.requestOptions.extra['retried'] != true) {
            final refreshed = await refreshTokens();
            if (refreshed) {
              final req = error.requestOptions;
              req.extra['retried'] = true;
              final token = await _storage.read(key: _accessKey);
              req.headers['Authorization'] = 'Bearer $token';
              try {
                final response = await _dio.fetch(req);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  static const _accessKey = 'member_access';
  static const _refreshKey = 'member_refresh';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  late final Dio _dio;

  Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }

  Future<bool> hasAccessToken() async {
    final token = await _storage.read(key: _accessKey);
    return token != null && token.isNotEmpty;
  }

  Future<bool> refreshTokens() async {
    final refresh = await _storage.read(key: _refreshKey);
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final response = await _dio.post(
        '/member-app/auth/refresh',
        data: {'refreshToken': refresh},
        options: Options(extra: {'retried': true}),
      );
      final data = response.data as Map<String, dynamic>;
      await saveTokens(data['accessToken'] as String, data['refreshToken'] as String);
      return true;
    } catch (_) {
      await clearTokens();
      return false;
    }
  }

  Future<Map<String, dynamic>> loginWithFirebase(String idToken) async {
    try {
      final response = await _dio.post(
        '/member-app/auth/firebase',
        data: {'idToken': idToken},
        options: Options(extra: {'retried': true}),
      );
      final data = response.data as Map<String, dynamic>;
      await saveTokens(data['accessToken'] as String, data['refreshToken'] as String);
      return data;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<dynamic> get(String path) async {
    try {
      final response = await _dio.get(path);
      return response.data;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? data]) async {
    try {
      final response = await _dio.post(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<dynamic> patch(String path, [Map<String, dynamic>? data]) async {
    try {
      final response = await _dio.patch(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  ApiException _mapError(DioException e) {
    final data = e.response?.data;
    String message = 'Something went wrong. Try again.';
    String? code;
    if (data is Map) {
      final raw = data['message'];
      if (raw is Map) {
        code = raw['code'] as String? ?? data['code'] as String?;
        final nested = raw['message'];
        if (nested is String && nested.isNotEmpty) message = nested;
      } else if (raw is String && raw.isNotEmpty) {
        message = raw;
        code = data['code'] as String?;
      } else if (raw is List && raw.isNotEmpty) {
        message = raw.first.toString();
      } else {
        code = data['code'] as String?;
      }
    } else if (e.type == DioExceptionType.connectionError) {
      message = 'Cannot reach ${AppConfig.origin}. Check your internet connection.';
    }
    return ApiException(e.response?.statusCode ?? 0, message, code: code);
  }
}
