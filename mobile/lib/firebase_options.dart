import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Replace by running `flutterfire configure` in `mobile/`.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('The member app is not a web app.');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('This platform is not configured for Firebase yet.');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: '1:0:android:0',
    messagingSenderId: '0',
    projectId: 'gymapp-member',
    storageBucket: 'gymapp-member.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: '1:0:ios:0',
    messagingSenderId: '0',
    projectId: 'gymapp-member',
    storageBucket: 'gymapp-member.appspot.com',
    iosBundleId: 'in.learnwise.gymapp.member',
  );
}
