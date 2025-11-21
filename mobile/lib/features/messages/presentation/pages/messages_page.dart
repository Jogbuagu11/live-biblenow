import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:tmwy/components/bottom_nav_bar.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

class MessagesPage extends ConsumerStatefulWidget {
  const MessagesPage({super.key});

  @override
  ConsumerState<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends ConsumerState<MessagesPage> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _conversations = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadConversations();
    _setupRealtimeSubscription();
  }

  Future<void> _loadConversations() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      setState(() => _isLoading = true);

      // Get all messages where user is sender or recipient
      final messages = await _supabase
          .from('event_messages')
          .select('''
            id,
            event_id,
            sender_id,
            recipient_id,
            body,
            created_at,
            read_at,
            events!inner(id, title)
          ''')
          .or('sender_id.eq.${user.id},recipient_id.eq.${user.id}')
          .order('created_at', ascending: false);

      // Group messages by conversation (other user + event)
      final conversationMap = <String, Map<String, dynamic>>{};

      for (final msg in messages) {
        final otherUserId = msg['sender_id'] == user.id
            ? msg['recipient_id']
            : msg['sender_id'];
        final eventId = msg['event_id'] ?? 'general';
        final conversationKey = '$otherUserId\_$eventId';

        if (!conversationMap.containsKey(conversationKey)) {
          conversationMap[conversationKey] = {
            'id': conversationKey,
            'other_user_id': otherUserId,
            'event_id': eventId,
            'event_title': msg['events']?['title'],
            'last_message': msg['body'],
            'last_message_time': msg['created_at'],
            'unread_count': msg['recipient_id'] == user.id ? 1 : 0,
            'other_user_name': '',
            'other_user_avatar': null,
          };
        } else {
          final conv = conversationMap[conversationKey]!;
          final msgTime = DateTime.parse(msg['created_at']);
          final lastTime = DateTime.parse(conv['last_message_time']);

          if (msgTime.isAfter(lastTime)) {
            conv['last_message'] = msg['body'];
            conv['last_message_time'] = msg['created_at'];
          }

          if (msg['recipient_id'] == user.id) {
            conv['unread_count'] = (conv['unread_count'] as int) + 1;
          }
        }
      }

      // Fetch user profiles
      final userIds = conversationMap.values
          .map((c) => c['other_user_id'] as String)
          .toSet()
          .toList();

      if (userIds.isNotEmpty) {
        // Fetch profiles one by one or use a workaround for multiple IDs
        final profileMap = <String, Map<String, dynamic>>{};
        for (final userId in userIds) {
          try {
            final profile = await _supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', userId)
                .single();
            profileMap[userId] = profile;
          } catch (e) {
            // Skip if profile not found
          }
        }

        conversationMap.forEach((key, conv) {
          final profile = profileMap[conv['other_user_id']];
          if (profile != null) {
            conv['other_user_name'] = profile['full_name'] ?? 'Unknown User';
            conv['other_user_avatar'] = profile['avatar_url'];
          }
        });
      }

      setState(() {
        _conversations = conversationMap.values.toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading conversations: $e')),
        );
      }
    }
  }

  void _setupRealtimeSubscription() {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    // Setup realtime subscription for new messages
    _supabase
        .channel('messages')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'event_messages',
          callback: (payload) {
            final message = payload.newRecord;
            if (message['sender_id'] == user.id ||
                message['recipient_id'] == user.id) {
              _loadConversations();
            }
          },
        )
        .subscribe();
  }

  List<Map<String, dynamic>> get _filteredConversations {
    if (_searchQuery.isEmpty) return _conversations;

    return _conversations.where((conv) {
      final name = (conv['other_user_name'] ?? '').toString().toLowerCase();
      final eventTitle = (conv['event_title'] ?? '').toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return name.contains(query) || eventTitle.contains(query);
    }).toList();
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null) return '';
    try {
      final date = DateTime.parse(timeStr);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        return DateFormat('h:mm a').format(date);
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return DateFormat('EEEE').format(date);
      } else {
        return DateFormat('MMM d').format(date);
      }
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search conversations...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onChanged: (value) {
                      setState(() => _searchQuery = value);
                    },
                  ),
                ),

                // Conversations List
                Expanded(
                  child: _filteredConversations.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.message_outlined,
                                size: 64,
                                color: Theme.of(context)
                                    .colorScheme
                                    .primary
                                    .withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _searchQuery.isEmpty
                                    ? 'No messages yet'
                                    : 'No conversations found',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _searchQuery.isEmpty
                                    ? 'Your conversations will appear here'
                                    : 'Try a different search term',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filteredConversations.length,
                          itemBuilder: (context, index) {
                            final conv = _filteredConversations[index];
                            final otherUserName = conv['other_user_name'] ?? 'Unknown';
                            final otherUserAvatar = conv['other_user_avatar'];
                            final initials = otherUserName
                                .split(' ')
                                .map((n) => n.isNotEmpty ? n[0] : '')
                                .join('')
                                .toUpperCase()
                                .substring(0, (otherUserName.length).clamp(0, 2));

                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundImage: otherUserAvatar != null
                                      ? CachedNetworkImageProvider(
                                          otherUserAvatar)
                                      : null,
                                  backgroundColor: Theme.of(context)
                                      .colorScheme
                                      .primaryContainer,
                                  child: otherUserAvatar == null
                                      ? Text(
                                          initials,
                                          style: TextStyle(
                                            color: Theme.of(context)
                                                .colorScheme
                                                .primary,
                                          ),
                                        )
                                      : null,
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        otherUserName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    if ((conv['unread_count'] as int) > 0)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '${conv['unread_count']}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (conv['event_title'] != null)
                                      Text(
                                        conv['event_title'],
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurfaceVariant,
                                        ),
                                      ),
                                    Text(
                                      conv['last_message'] ?? 'No messages yet',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                                trailing: Text(
                                  _formatTime(conv['last_message_time']),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                                ),
                                onTap: () {
                                  context.push(
                                    '/conversation/${conv['other_user_id']}?event=${conv['event_id']}',
                                  );
                                },
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 2),
    );
  }
}
