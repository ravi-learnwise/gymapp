import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../firebase_options.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._api);

  final ApiClient _api;

  bool booting = true;
  bool busy = false;
  String? error;
  Map<String, dynamic>? member;
  String? pendingVerificationId;

  Future<void> bootstrap() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      }
      await GoogleSignIn.instance.initialize();
    } catch (e) {
      error =
          'Firebase is not configured yet. Add your Firebase Android app and replace lib/firebase_options.dart.';
      booting = false;
      notifyListeners();
      return;
    }

    try {
      if (await _api.hasAccessToken()) {
        member = Map<String, dynamic>.from(await _api.get('/member-app/me') as Map);
      }
    } on ApiException {
      await _api.clearTokens();
      member = null;
    } catch (_) {
      member = null;
    }
    booting = false;
    notifyListeners();
  }

  Future<bool> signInWithGoogle() async {
    error = null;
    busy = true;
    notifyListeners();
    try {
      final google = GoogleSignIn.instance;
      final account = await google.authenticate(scopeHint: const ['email']);
      final idToken = account.authentication.idToken;
      if (idToken == null) {
        throw ApiException(401, 'Google sign-in did not return an ID token.');
      }
      final cred = GoogleAuthProvider.credential(idToken: idToken);
      final userCred = await FirebaseAuth.instance.signInWithCredential(cred);
      final firebaseToken = await userCred.user?.getIdToken();
      if (firebaseToken == null) {
        throw ApiException(401, 'Could not get a Firebase token.');
      }
      await _api.loginWithFirebase(firebaseToken);
      member = Map<String, dynamic>.from(await _api.get('/member-app/me') as Map);
      return true;
    } on ApiException catch (e) {
      error = e.message;
      return false;
    } on GoogleSignInException catch (e) {
      error = e.toString();
      return false;
    } catch (e) {
      error = e.toString();
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<bool> sendOtp(String tenDigitMobile) async {
    error = null;
    busy = true;
    notifyListeners();
    final done = Completer<bool>();
    try {
      final phone = tenDigitMobile.startsWith('+') ? tenDigitMobile : '+91$tenDigitMobile';
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (credential) async {
          final ok = await _completePhoneCredential(credential);
          if (!done.isCompleted) done.complete(ok);
        },
        verificationFailed: (e) {
          error = e.message ?? 'OTP could not be sent.';
          busy = false;
          notifyListeners();
          if (!done.isCompleted) done.complete(false);
        },
        codeSent: (verificationId, _) {
          pendingVerificationId = verificationId;
          busy = false;
          notifyListeners();
          if (!done.isCompleted) done.complete(true);
        },
        codeAutoRetrievalTimeout: (verificationId) {
          pendingVerificationId = verificationId;
        },
      );
      return done.future;
    } catch (e) {
      error = e.toString();
      busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtp(String smsCode) async {
    final id = pendingVerificationId;
    if (id == null) {
      error = 'Request a new OTP first.';
      notifyListeners();
      return false;
    }
    return _completePhoneCredential(PhoneAuthProvider.credential(verificationId: id, smsCode: smsCode));
  }

  Future<bool> _completePhoneCredential(PhoneAuthCredential credential) async {
    error = null;
    busy = true;
    notifyListeners();
    try {
      final userCred = await FirebaseAuth.instance.signInWithCredential(credential);
      final firebaseToken = await userCred.user?.getIdToken();
      if (firebaseToken == null) {
        throw ApiException(401, 'Could not get a Firebase token.');
      }
      await _api.loginWithFirebase(firebaseToken);
      member = Map<String, dynamic>.from(await _api.get('/member-app/me') as Map);
      pendingVerificationId = null;
      return true;
    } on ApiException catch (e) {
      error = e.message;
      return false;
    } catch (e) {
      error = e.toString();
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _api.clearTokens();
    await FirebaseAuth.instance.signOut();
    try {
      await GoogleSignIn.instance.signOut();
    } catch (_) {}
    member = null;
    notifyListeners();
  }
}
