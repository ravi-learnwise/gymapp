class AppConfig {
  /// Origin of the hosted GymApp (no trailing slash).
  static const origin = String.fromEnvironment(
    'API_ORIGIN',
    defaultValue: 'https://gymapp.learnwise.in',
  );

  static const apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'https://gymapp.learnwise.in/api',
  );

  static String mediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return '$origin$path';
    return '$origin/$path';
  }
}
