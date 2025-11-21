import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:tmwy/features/auth/presentation/pages/auth_page.dart';
import 'package:tmwy/features/auth/presentation/pages/splash_page.dart';
import 'package:tmwy/features/home/presentation/pages/home_page.dart';
import 'package:tmwy/features/profile/presentation/pages/profile_page.dart';
import 'package:tmwy/features/events/presentation/pages/event_details_page.dart';
import 'package:tmwy/features/events/presentation/pages/request_standin_page.dart';
import 'package:tmwy/features/events/presentation/pages/select_standin_page.dart';
import 'package:tmwy/features/presence/presentation/pages/presence_mode_page.dart';
import 'package:tmwy/features/feed/presentation/pages/feed_page.dart';
import 'package:tmwy/features/messages/presentation/pages/messages_page.dart';
import 'package:tmwy/features/messages/presentation/pages/conversation_page.dart';
import 'package:tmwy/core/providers/auth_provider.dart';

part 'app_router.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated = authState.value?.user != null;
      final isAuthRoute = state.matchedLocation == '/auth' ||
          state.matchedLocation == '/splash';

      if (!isAuthenticated && !isAuthRoute) {
        return '/auth';
      }

      if (isAuthenticated && isAuthRoute) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/auth',
        name: 'auth',
        builder: (context, state) => const AuthPage(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/feed',
        name: 'feed',
        builder: (context, state) => const FeedPage(),
      ),
      GoRoute(
        path: '/messages',
        name: 'messages',
        builder: (context, state) => const MessagesPage(),
      ),
      GoRoute(
        path: '/conversation/:userId',
        name: 'conversation',
        builder: (context, state) {
          final userId = state.pathParameters['userId'] ?? '';
          final eventId = state.uri.queryParameters['event'];
          return ConversationPage(userId: userId, eventId: eventId);
        },
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: '/request',
        name: 'request',
        builder: (context, state) => const RequestStandInPage(),
      ),
      GoRoute(
        path: '/event-details/:eventType',
        name: 'event-details',
        builder: (context, state) {
          final eventType = state.pathParameters['eventType'] ?? '';
          return EventDetailsPage(eventType: eventType);
        },
      ),
      GoRoute(
        path: '/select-standin',
        name: 'select-standin',
        builder: (context, state) => const SelectStandInPage(),
      ),
      GoRoute(
        path: '/presence/:standInId',
        name: 'presence',
        builder: (context, state) {
          final standInId = state.pathParameters['standInId'] ?? '';
          return PresenceModePage(standInId: standInId);
        },
      ),
    ],
  );
}

