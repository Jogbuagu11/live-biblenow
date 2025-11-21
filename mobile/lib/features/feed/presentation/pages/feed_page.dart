import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tmwy/core/providers/auth_provider.dart';
import 'package:tmwy/components/bottom_nav_bar.dart';

class FeedPage extends ConsumerWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Feed'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Icon(
                      Icons.explore,
                      size: 64,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Browse Available Services',
                      style: Theme.of(context).textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Find proxies or requests based on your role',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                // Navigate to web proxy feed (mobile will need its own implementation)
                // For now, show a placeholder
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Proxy feed coming soon')),
                );
              },
              icon: const Icon(Icons.person_search),
              label: const Text('Browse Proxy Feed'),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                // Navigate to web request feed (mobile will need its own implementation)
                // For now, show a placeholder
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Request feed coming soon')),
                );
              },
              icon: const Icon(Icons.list_alt),
              label: const Text('Browse Request Feed'),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const BottomNavBar(currentIndex: 1),
    );
  }
}

