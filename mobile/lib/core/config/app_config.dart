class AppConfig {
  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://uggogtzpobrpkzelbbkn.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ29ndHpwb2JycGt6ZWxiYmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTM2OTksImV4cCI6MjA3OTE4OTY5OX0.rBeY1rxl1cIAU6daiZE5tZotLB5ifYBEpB2QqZv7XKQ',
  );

  // Stripe Configuration
  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: 'your_stripe_publishable_key_here',
  );

  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com',
  );

  // App Configuration
  static const String appUrl = 'https://takemewithyou.app';
  static const String appName = 'TMWY';
}

