/// Runtime configuration.
///
/// Override at build time:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
/// or via a `.env`-equivalent in your launch config.
class Env {
  /// Base URL for the Inno backend (no trailing slash). The default points at
  /// the Android emulator alias for the host's localhost, which is the most
  /// common dev case. iOS simulator uses real `localhost` — override with
  /// `--dart-define=API_BASE_URL=http://localhost:3000`.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Master switch for the ad slots scattered across the UI. Always off in
  /// MVP; flipped on later when an ad network is wired up.
  static const bool adsEnabled = bool.fromEnvironment(
    'ADS_ENABLED',
    defaultValue: false,
  );
}
