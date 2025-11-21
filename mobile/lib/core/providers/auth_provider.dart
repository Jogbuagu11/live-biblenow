import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tmwy/core/services/supabase_service.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthState extends _$AuthState {
  @override
  Future<AuthResponse?> build() async {
    // Initialize auth state
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      return AuthResponse(
        user: session.user,
        session: session,
      );
    }

    // Listen for auth changes
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final event = data.event;
      if (event == AuthChangeEvent.signedIn || event == AuthChangeEvent.tokenRefreshed) {
        state = AsyncValue.data(
          AuthResponse(
            user: data.session?.user,
            session: data.session,
          ),
        );
      } else if (event == AuthChangeEvent.signedOut) {
        state = const AsyncValue.data(null);
      }
    });

    return null;
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await SupabaseService.signIn(email, password);
      state = AsyncValue.data(
        AuthResponse(
          user: response.user,
          session: response.session,
        ),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      rethrow;
    }
  }

  Future<void> signUp(String email, String password, {String? name}) async {
    state = const AsyncValue.loading();
    try {
      final response = await SupabaseService.signUp(email, password, name: name);
      state = AsyncValue.data(
        AuthResponse(
          user: response.user,
          session: response.session,
        ),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      rethrow;
    }
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    try {
      await SupabaseService.signOut();
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    print('[AuthProvider] signInWithGoogle called');
    state = const AsyncValue.loading();
    try {
      print('[AuthProvider] Calling SupabaseService.signInWithGoogle()...');
      final result = await SupabaseService.signInWithGoogle();
      print('[AuthProvider] SupabaseService.signInWithGoogle() returned: $result');
      // OAuth will redirect, so we don't update state here
      print('[AuthProvider] Google OAuth flow initiated, waiting for redirect...');
    } catch (e, stackTrace) {
      print('[AuthProvider] ERROR in signInWithGoogle: $e');
      print('[AuthProvider] Stack trace: $stackTrace');
      state = AsyncValue.error(e, stackTrace);
      rethrow;
    }
  }

  Future<void> signInWithApple() async {
    state = const AsyncValue.loading();
    try {
      await SupabaseService.signInWithApple();
      // OAuth will redirect, so we don't update state here
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      rethrow;
    }
  }
}

class AuthResponse {
  final User? user;
  final Session? session;

  AuthResponse({this.user, this.session});
}

