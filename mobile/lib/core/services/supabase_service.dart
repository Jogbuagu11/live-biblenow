import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tmwy/core/services/social_auth_service.dart';

class SupabaseService {
  static final _client = Supabase.instance.client;

  // Auth methods
  static Future<AuthResponse> signIn(String email, String password) async {
    try {
      print('[SupabaseService] Email sign-in request for $email');
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      if (response.user == null) {
        print('[SupabaseService] Email sign-in failed: no user returned');
        throw AuthException('Invalid email or password');
      }
      print('[SupabaseService] Email sign-in success for ${response.user?.email}');
      return response;
    } on AuthException catch (e) {
      print('[SupabaseService] AuthException: ${e.message}');
      rethrow;
    } catch (e) {
      print('[SupabaseService] Unknown email sign-in error: $e');
      rethrow;
    }
  }

  static Future<AuthResponse> signUp(
    String email,
    String password, {
    String? name,
  }) async {
    try {
      print('[SupabaseService] Email sign-up request for $email');
      final response = await _client.auth.signUp(
        email: email,
        password: password,
        data: name != null ? {'name': name} : null,
      );
      print('[SupabaseService] Sign-up response user: ${response.user?.email}');
      return response;
    } on AuthException catch (e) {
      print('[SupabaseService] AuthException: ${e.message}');
      rethrow;
    } catch (e) {
      print('[SupabaseService] Unknown email sign-up error: $e');
      rethrow;
    }
  }

  static Future<void> signOut() async {
    await _client.auth.signOut();
  }

  static Future<bool> signInWithGoogle() async {
    // Delegate to SocialAuthService
    return await SocialAuthService.signInWithGoogle();
  }

  static Future<bool> signInWithApple() async {
    // Delegate to SocialAuthService
    return await SocialAuthService.signInWithApple();
  }

  static User? get currentUser => _client.auth.currentUser;

  static Session? get currentSession => _client.auth.currentSession;

  // Database methods
  static Future<List<Map<String, dynamic>>> getEvents() async {
    final response = await _client
        .from('events')
        .select()
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  static Future<Map<String, dynamic>?> getEvent(String eventId) async {
    final response =
        await _client.from('events').select().eq('id', eventId).single();
    return response as Map<String, dynamic>?;
  }

  static Future<Map<String, dynamic>> createEvent(
    Map<String, dynamic> eventData,
  ) async {
    final response =
        await _client.from('events').insert(eventData).select().single();
    return response;
  }

  static Future<List<Map<String, dynamic>>> getStandIns() async {
    final response = await _client
        .from('stand_ins')
        .select()
        .eq('available', true)
        .order('rating', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  static Future<Map<String, dynamic>?> getStandIn(String standInId) async {
    final response =
        await _client.from('stand_ins').select().eq('id', standInId).single();
    return response as Map<String, dynamic>?;
  }
}
