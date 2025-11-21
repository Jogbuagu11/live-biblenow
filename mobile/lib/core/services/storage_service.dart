import 'dart:io';
import 'package:mime/mime.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class StorageService {
  static final _client = Supabase.instance.client;

  /// Upload a profile photo
  static Future<String> uploadProfilePhoto(String userId, File imageFile) async {
    final fileExt = imageFile.path.split('.').last;
    final fileName = 'avatar.$fileExt';
    final filePath = '$userId/$fileName';

    final bytes = await imageFile.readAsBytes();
    final contentType = lookupMimeType(imageFile.path) ?? 'image/jpeg';

    // Upload file
    await _client.storage.from('profile-photos').uploadBinary(
          filePath,
          bytes,
          fileOptions: FileOptions(
            upsert: true,
            cacheControl: '3600',
            contentType: contentType,
          ),
        );

    // Get public URL
    final publicUrl = _client.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

    // Update profile with new photo URL
    await _client
        .from('profiles')
        .update({'avatar_url': publicUrl})
        .eq('id', userId);

    return publicUrl;
  }

  /// Upload a cover photo
  static Future<String> uploadCoverPhoto(String userId, File imageFile) async {
    final fileExt = imageFile.path.split('.').last;
    final fileName = 'cover.$fileExt';
    final filePath = '$userId/$fileName';

    final bytes = await imageFile.readAsBytes();
    final contentType = lookupMimeType(imageFile.path) ?? 'image/jpeg';

    // Upload file
    await _client.storage.from('cover-photos').uploadBinary(
          filePath,
          bytes,
          fileOptions: FileOptions(
            upsert: true,
            cacheControl: '3600',
            contentType: contentType,
          ),
        );

    // Get public URL
    final publicUrl = _client.storage
        .from('cover-photos')
        .getPublicUrl(filePath);

    // Update profile with new cover photo URL
    await _client
        .from('profiles')
        .update({'cover_photo_url': publicUrl})
        .eq('id', userId);

    return publicUrl;
  }
}

