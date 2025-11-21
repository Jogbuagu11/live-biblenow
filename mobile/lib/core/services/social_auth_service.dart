import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tmwy/core/config/app_config.dart';

/// Standalone service for handling native social authentication (Google, Apple)
/// NOTE: For mobile builds we are disabling these flows temporarily.
class SocialAuthService {
  static final _client = Supabase.instance.client;

  static GoogleSignIn get _googleSignIn => GoogleSignIn(
        scopes: ['email', 'profile'],
        serverClientId: AppConfig.googleServerClientId,
      );

  static String _generateNonce([int length = 32]) {
    const charset =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  static Future<bool> signInWithGoogle() async {
    print('[SocialAuth] Google sign-in disabled on mobile build');
    return false;
  }

  static Future<bool> signInWithApple() async {
    print('[SocialAuth] Apple sign-in disabled on mobile build');
    return false;
  }

  static Future<void> signOut() async {
    if (await _googleSignIn.isSignedIn()) {
      await _googleSignIn.signOut();
    }
    await _client.auth.signOut();
  }

  static bool get isAuthenticated => _client.auth.currentUser != null;
  static User? get currentUser => _client.auth.currentUser;
  static Session? get currentSession => _client.auth.currentSession;
}
