import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

class ConversationPage extends ConsumerStatefulWidget {
  final String userId;
  final String? eventId;

  const ConversationPage({
    super.key,
    required this.userId,
    this.eventId,
  });

  @override
  ConsumerState<ConversationPage> createState() => _ConversationPageState();
}

class _ConversationPageState extends ConsumerState<ConversationPage> {
  final _supabase = Supabase.instance.client;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  Map<String, dynamic>? _otherUser;
  bool _isLoading = true;
  bool _isSending = false;
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _loadConversation();
    _setupRealtimeSubscription();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _channel?.unsubscribe();
    super.dispose();
  }

  Future<void> _loadConversation() async {
    final user = _supabase.auth.currentUser;
    if (user == null || widget.eventId == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      setState(() => _isLoading = true);

      // Load other user's profile
      final profile = await _supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', widget.userId)
          .single();

      setState(() {
        _otherUser = {
          'id': profile['id'],
          'name': profile['full_name'] ?? 'Unknown User',
          'avatar': profile['avatar_url'],
        };
      });

      // Load messages
      final messages = await _supabase
          .from('event_messages')
          .select('''
            *,
            sender:profiles!event_messages_sender_id_fkey(id, full_name, avatar_url),
            recipient:profiles!event_messages_recipient_id_fkey(id, full_name, avatar_url)
          ''')
          .eq('event_id', widget.eventId!)
          .or(
            'and(sender_id.eq.${user.id},recipient_id.eq.${widget.userId}),and(sender_id.eq.${widget.userId},recipient_id.eq.${user.id})',
          )
          .order('created_at', ascending: true);

      final formattedMessages = messages.map((msg) {
        return {
          'id': msg['id'],
          'body': msg['body'],
          'sender_id': msg['sender_id'],
          'recipient_id': msg['recipient_id'],
          'created_at': msg['created_at'],
          'read_at': msg['read_at'],
          'sender_name': msg['sender']?['full_name'] ?? 'Unknown',
          'sender_avatar': msg['sender']?['avatar_url'],
        };
      }).toList();

      setState(() {
        _messages = formattedMessages;
        _isLoading = false;
      });

      // Mark messages as read - only update unread messages
      final unreadMessages = await _supabase
          .from('event_messages')
          .select('id')
          .eq('event_id', widget.eventId!)
          .eq('recipient_id', user.id)
          .isFilter('read_at', null);
      
      if (unreadMessages.isNotEmpty) {
        for (final msg in unreadMessages) {
          await _supabase
              .from('event_messages')
              .update({'read_at': DateTime.now().toIso8601String()})
              .eq('id', msg['id']);
        }
      }

      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading conversation: $e')),
        );
      }
    }
  }

  void _setupRealtimeSubscription() {
    if (widget.eventId == null) return;

    final channel = _supabase
        .channel('messages:${widget.eventId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'event_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: widget.eventId,
          ),
          callback: (payload) async {
            final newMessage = payload.newRecord;
            final user = _supabase.auth.currentUser;

            // Only add if it's from/to the current conversation
            if ((newMessage['sender_id'] == widget.userId &&
                    newMessage['recipient_id'] == user?.id) ||
                (newMessage['sender_id'] == user?.id &&
                    newMessage['recipient_id'] == widget.userId)) {
              // Fetch sender profile
              try {
                final senderProfile = await _supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', newMessage['sender_id'])
                    .single();

                setState(() {
                  _messages.add({
                    'id': newMessage['id'],
                    'body': newMessage['body'],
                    'sender_id': newMessage['sender_id'],
                    'recipient_id': newMessage['recipient_id'],
                    'created_at': newMessage['created_at'],
                    'read_at': newMessage['read_at'],
                    'sender_name': senderProfile['full_name'] ?? 'Unknown',
                    'sender_avatar': senderProfile['avatar_url'],
                  });
                });
              } catch (e) {
                // Handle error silently
              }

              // Mark as read if we're the recipient
              if (newMessage['recipient_id'] == user?.id) {
                await _supabase
                    .from('event_messages')
                    .update({'read_at': DateTime.now().toIso8601String()})
                    .eq('id', newMessage['id']);
              }

              // Scroll to bottom
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (_scrollController.hasClients) {
                  _scrollController.animateTo(
                    _scrollController.position.maxScrollExtent,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOut,
                  );
                }
              });
            }
          },
        )
        .subscribe();

    _channel = channel;
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty ||
        _isSending ||
        widget.eventId == null) return;

    final user = _supabase.auth.currentUser;
    if (user == null) return;

    setState(() => _isSending = true);

    try {
      await _supabase.from('event_messages').insert({
        'event_id': widget.eventId,
        'sender_id': user.id,
        'recipient_id': widget.userId,
        'body': _messageController.text.trim(),
      });

      _messageController.clear();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error sending message: $e')),
        );
      }
    } finally {
      setState(() => _isSending = false);
    }
  }

  String _formatMessageTime(String? timeStr) {
    if (timeStr == null) return '';
    try {
      final date = DateTime.parse(timeStr);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        return DateFormat('h:mm a').format(date);
      } else if (difference.inDays == 1) {
        return 'Yesterday ${DateFormat('h:mm a').format(date)}';
      } else {
        return DateFormat('MMM d, h:mm a').format(date);
      }
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _supabase.auth.currentUser;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Loading...'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_otherUser == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Error'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: Text('User not found')),
      );
    }

    final otherUserInitials = _otherUser!['name']
        .toString()
        .split(' ')
        .map((n) => n.isNotEmpty ? n[0] : '')
        .join('')
        .toUpperCase()
        .substring(0, (_otherUser!['name'].toString().length).clamp(0, 2));

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundImage: _otherUser!['avatar'] != null
                  ? CachedNetworkImageProvider(_otherUser!['avatar'])
                  : null,
              backgroundColor:
                  Theme.of(context).colorScheme.primaryContainer,
              child: _otherUser!['avatar'] == null
                  ? Text(
                      otherUserInitials,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _otherUser!['name'],
                    style: const TextStyle(fontSize: 16),
                  ),
                  if (widget.eventId != null)
                    Text(
                      'Event conversation',
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Text(
                      'No messages yet. Start the conversation!',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final isOwn = message['sender_id'] == user?.id;
                      final senderInitials = (message['sender_name'] ?? 'U')
                          .toString()
                          .split(' ')
                          .map((n) => n.isNotEmpty ? n[0] : '')
                          .join('')
                          .toUpperCase()
                          .substring(0, 1);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          mainAxisAlignment: isOwn
                              ? MainAxisAlignment.end
                              : MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (!isOwn) ...[
                              CircleAvatar(
                                radius: 16,
                                backgroundImage:
                                    message['sender_avatar'] != null
                                        ? CachedNetworkImageProvider(
                                            message['sender_avatar'])
                                        : null,
                                backgroundColor: Theme.of(context)
                                    .colorScheme
                                    .primaryContainer,
                                child: message['sender_avatar'] == null
                                    ? Text(
                                        senderInitials,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary,
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 8),
                            ],
                            Flexible(
                              child: Column(
                                crossAxisAlignment: isOwn
                                    ? CrossAxisAlignment.end
                                    : CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isOwn
                                          ? Theme.of(context).colorScheme.primary
                                          : Theme.of(context)
                                              .colorScheme
                                              .surfaceVariant,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Text(
                                      message['body'],
                                      style: TextStyle(
                                        color: isOwn
                                            ? Theme.of(context)
                                                .colorScheme
                                                .onPrimary
                                            : Theme.of(context)
                                                .colorScheme
                                                .onSurfaceVariant,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _formatMessageTime(message['created_at']),
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isOwn) const SizedBox(width: 8),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Message Input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                    ),
                    maxLines: null,
                    textCapitalization: TextCapitalization.sentences,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _isSending ? null : _sendMessage,
                  icon: _isSending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          Icons.send,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

