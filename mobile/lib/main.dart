import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tmwy/core/config/app_config.dart';
import 'package:tmwy/core/routing/app_router.dart';
import 'package:tmwy/core/services/stripe_service.dart';
import 'package:tmwy/core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  // Initialize Stripe
  await StripeService.initialize();

  // Handle OAuth deep links
  Supabase.instance.client.auth.onAuthStateChange.listen((data) {
    final event = data.event;
    print('[Main] Auth state change event: $event');
    print('[Main] Session: ${data.session?.user?.email ?? "No session"}');
    print('[Main] User ID: ${data.session?.user?.id ?? "No user"}');
    
    if (event == AuthChangeEvent.signedIn) {
      // User successfully signed in via OAuth
      print('[Main] ✅ OAuth sign in successful');
      print('[Main] User email: ${data.session?.user?.email}');
      print('[Main] Provider: ${data.session?.user?.appMetadata?["provider"]}');
    } else if (event == AuthChangeEvent.tokenRefreshed) {
      print('[Main] Token refreshed');
    } else if (event == AuthChangeEvent.signedOut) {
      print('[Main] User signed out');
    } else if (event == AuthChangeEvent.userUpdated) {
      print('[Main] User updated');
    }
  });

  runApp(
    const ProviderScope(
      child: TMWYApp(),
    ),
  );
}

class TMWYApp extends ConsumerWidget {
  const TMWYApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'TMWY',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}

