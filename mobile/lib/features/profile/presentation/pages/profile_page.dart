import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:tmwy/core/providers/auth_provider.dart';
import 'package:tmwy/core/services/storage_service.dart';
import 'package:tmwy/components/bottom_nav_bar.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  final _supabase = Supabase.instance.client;
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  bool _isEditing = false;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _bioController = TextEditingController();
  File? _avatarFile;
  File? _coverPhotoFile;
  String? _avatarPreview;
  String? _coverPhotoPreview;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final response = await _supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .single();

      setState(() {
        _profile = response;
        _nameController.text = response['full_name'] ?? '';
        _phoneController.text = response['phone'] ?? '';
        _bioController.text = response['bio'] ?? '';
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading profile: $e')),
        );
      }
    }
  }

  Future<void> _pickImage(ImageSource source, {bool isCoverPhoto = false}) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source, imageQuality: 85);

    if (pickedFile != null) {
      final file = File(pickedFile.path);
      setState(() {
        if (isCoverPhoto) {
          _coverPhotoFile = file;
          _coverPhotoPreview = file.path;
        } else {
          _avatarFile = file;
          _avatarPreview = file.path;
        }
        _isEditing = true;
      });
    }
  }

  Future<void> _saveProfile() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      // Upload photos if selected
      String? avatarUrl = _profile?['avatar_url'];
      String? coverPhotoUrl = _profile?['cover_photo_url'];

      if (_avatarFile != null) {
        avatarUrl = await StorageService.uploadProfilePhoto(user.id, _avatarFile!);
      }

      if (_coverPhotoFile != null) {
        coverPhotoUrl = await StorageService.uploadCoverPhoto(user.id, _coverPhotoFile!);
      }

      // Update profile
      await _supabase.from('profiles').update({
        'full_name': _nameController.text,
        'phone': _phoneController.text,
        'bio': _bioController.text,
        if (avatarUrl != null) 'avatar_url': avatarUrl,
        if (coverPhotoUrl != null) 'cover_photo_url': coverPhotoUrl,
      }).eq('id', user.id);

      setState(() {
        _isEditing = false;
        _avatarFile = null;
        _coverPhotoFile = null;
        _avatarPreview = null;
        _coverPhotoPreview = null;
        _isLoading = false;
      });

      await _loadProfile();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving profile: $e')),
        );
      }
    }
  }

  void _cancelEdit() {
    setState(() {
      _isEditing = false;
      _avatarFile = null;
      _coverPhotoFile = null;
      _avatarPreview = null;
      _coverPhotoPreview = null;
      _loadProfile(); // Reload to reset form
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.value?.user;

    if (_isLoading || user == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Profile'),
          automaticallyImplyLeading: false,
        ),
        body: const Center(child: CircularProgressIndicator()),
        bottomNavigationBar: const BottomNavBar(currentIndex: 3),
      );
    }

    String _computeInitials() {
      final source =
          (_profile?['full_name'] ?? user.email ?? 'U').toString().trim();
      if (source.isEmpty) return 'U';
      final parts =
          source.split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
      final raw = parts.map((part) => part[0]).join();
      if (raw.isEmpty) {
        final email = user.email ?? 'U';
        return email.isNotEmpty ? email[0].toUpperCase() : 'U';
      }
      final length = raw.length >= 2 ? 2 : 1;
      return raw.substring(0, length).toUpperCase();
    }

    final initials = _computeInitials();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        automaticallyImplyLeading: false,
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _isEditing = true),
            )
          else
            TextButton(
              onPressed: _cancelEdit,
              child: const Text('Cancel'),
            ),
          if (_isEditing)
            TextButton(
              onPressed: _saveProfile,
              child: const Text('Save'),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Cover Photo Section
            Stack(
              children: [
                Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Theme.of(context).colorScheme.primary.withOpacity(0.2),
                        Theme.of(context).colorScheme.secondary.withOpacity(0.2),
                      ],
                    ),
                  ),
                  child: _coverPhotoPreview != null
                      ? Image.file(
                          File(_coverPhotoPreview!),
                          fit: BoxFit.cover,
                        )
                      : _profile?['cover_photo_url'] != null
                          ? CachedNetworkImage(
                              imageUrl: _profile!['cover_photo_url'],
                              fit: BoxFit.cover,
                            )
                          : null,
                ),
                Positioned(
                  top: 16,
                  right: 16,
                  child: Material(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(8),
                    child: InkWell(
                      onTap: () => _showImageSourceDialog(isCoverPhoto: true),
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Icon(
                          Icons.camera_alt,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Profile Card
            Transform.translate(
              offset: const Offset(0, -60),
              child: Card(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      // Avatar
                      Stack(
                        children: [
                          ClipOval(
                            child: Container(
                              width: 120,
                              height: 120,
                              color: Theme.of(context).colorScheme.primaryContainer,
                              child: _avatarPreview != null
                                  ? Image.file(
                                      File(_avatarPreview!),
                                      fit: BoxFit.cover,
                                    )
                                  : _profile?['avatar_url'] != null
                                      ? CachedNetworkImage(
                                          imageUrl: _profile!['avatar_url'],
                                          fit: BoxFit.cover,
                                          placeholder: (context, url) => Center(
                                            child: Text(
                                              initials,
                                              style: TextStyle(
                                                fontSize: 32,
                                                color: Theme.of(context)
                                                    .colorScheme
                                                    .primary,
                                              ),
                                            ),
                                          ),
                                          errorWidget: (context, url, error) =>
                                              Center(
                                            child: Text(
                                              initials,
                                              style: TextStyle(
                                                fontSize: 32,
                                                color: Theme.of(context)
                                                    .colorScheme
                                                    .primary,
                                              ),
                                            ),
                                          ),
                                        )
                                      : Center(
                                          child: Text(
                                            initials,
                                            style: TextStyle(
                                              fontSize: 32,
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .primary,
                                            ),
                                          ),
                                        ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Material(
                              color: Theme.of(context).colorScheme.primary,
                              borderRadius: BorderRadius.circular(20),
                              child: InkWell(
                                onTap: () => _showImageSourceDialog(),
                                borderRadius: BorderRadius.circular(20),
                                child: const Padding(
                                  padding: EdgeInsets.all(8),
                                  child: Icon(
                                    Icons.camera_alt,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _profile?['full_name'] ?? user.email ?? 'User',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (_profile?['bio'] != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _profile!['bio'],
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Profile Information
            Card(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Profile Information',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _nameController,
                      enabled: _isEditing,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: Icon(Icons.person),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _phoneController,
                      enabled: _isEditing,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        prefixIcon: Icon(Icons.phone),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Email',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email ?? '',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _bioController,
                      enabled: _isEditing,
                      decoration: const InputDecoration(
                        labelText: 'Bio',
                        prefixIcon: Icon(Icons.description),
                        hintText: 'Tell us about yourself...',
                      ),
                      maxLines: 4,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () async {
                await ref.read(authStateProvider.notifier).signOut();
                if (mounted) {
                  context.go('/auth');
                }
              },
              icon: const Icon(Icons.logout),
              label: const Text('Sign Out'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 3),
    );
  }

  void _showImageSourceDialog({bool isCoverPhoto = false}) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery, isCoverPhoto: isCoverPhoto);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera, isCoverPhoto: isCoverPhoto);
              },
            ),
          ],
        ),
      ),
    );
  }
}
