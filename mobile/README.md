# TMWY Mobile App (Flutter)

Mobile application for TMWY (Take Me With You) built with Flutter and Riverpod.

## Tech Stack

- **Framework**: Flutter 3.0+
- **State Management**: Riverpod
- **Backend**: Supabase
- **Payments**: Stripe
- **Email**: Resend (via backend API)
- **Navigation**: GoRouter

## Setup

### Prerequisites

- Flutter SDK 3.0 or higher
- Dart SDK 3.0 or higher
- Android Studio / Xcode (for mobile development)
- Supabase account
- Stripe account

### Installation

1. Install Flutter dependencies:
```bash
cd mobile
flutter pub get
```

2. Generate Riverpod code:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

3. Configure environment variables:
   - Update `lib/core/config/app_config.dart` with your credentials, OR
   - Use compile-time environment variables:
   ```bash
   flutter run --dart-define=SUPABASE_URL=your_url --dart-define=SUPABASE_ANON_KEY=your_key --dart-define=STRIPE_PUBLISHABLE_KEY=your_key
   ```

### Running the App

```bash
# Development
flutter run

# iOS
flutter run -d ios

# Android
flutter run -d android
```

## Project Structure

```
lib/
├── core/
│   ├── config/          # App configuration
│   ├── providers/       # Riverpod providers
│   ├── routing/          # Navigation setup
│   ├── services/         # API services (Supabase, Stripe, Email)
│   └── theme/            # App theming
├── features/
│   ├── auth/             # Authentication
│   ├── home/             # Home screen
│   ├── profile/          # User profile
│   ├── events/           # Event management
│   └── presence/         # Presence tracking
└── main.dart             # App entry point
```

## Key Features

- **Authentication**: Supabase Auth with email/password
- **State Management**: Riverpod for reactive state
- **Navigation**: GoRouter with protected routes
- **Payments**: Stripe integration for payment processing
- **Email**: Resend integration via backend API

## Building for Production

### Android
```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Environment Variables

The app uses compile-time environment variables. Set them when running or building:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

Alternatively, update `lib/core/config/app_config.dart` directly (not recommended for production).

## Notes

- Riverpod code generation is required. Run `build_runner` after adding new providers.
- The app requires backend API endpoints for Stripe payment intents and email sending.
- Ensure Supabase Row Level Security (RLS) is properly configured.

