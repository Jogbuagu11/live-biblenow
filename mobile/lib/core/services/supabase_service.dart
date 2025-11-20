import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final _client = Supabase.instance.client;

  // Auth methods
  static Future<AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  static Future<AuthResponse> signUp(
    String email,
    String password, {
    String? name,
  }) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
      data: name != null ? {'name': name} : null,
    );
    return response;
  }

  static Future<void> signOut() async {
    await _client.auth.signOut();
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
