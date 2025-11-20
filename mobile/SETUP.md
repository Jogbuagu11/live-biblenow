# Flutter App Setup Instructions

## Initial Setup

This Flutter project structure has been created, but you need to generate the platform-specific files.

### Step 1: Generate Flutter Platform Files

Run this command in the `mobile` directory to generate Android and iOS platform files:

```bash
cd mobile
flutter create .
```

This will create the necessary Android and iOS configuration files.

### Step 2: Install Dependencies

```bash
flutter pub get
```

### Step 3: Generate Riverpod Code

The app uses Riverpod code generation. Run:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

This generates:
- `app_router.g.dart` from `app_router.dart`
- `auth_provider.g.dart` from `auth_provider.dart`

### Step 4: Configure Environment Variables

Update `lib/core/config/app_config.dart` with your actual credentials:

```dart
static const String supabaseUrl = 'your_actual_supabase_url';
static const String supabaseAnonKey = 'your_actual_supabase_key';
static const String stripePublishableKey = 'your_actual_stripe_key';
```

Alternatively, use compile-time environment variables (recommended for production).

### Step 5: Run the App

```bash
flutter run
```

## Troubleshooting

### If build_runner fails:
- Make sure all dependencies are installed: `flutter pub get`
- Delete generated files and rebuild: `flutter pub run build_runner clean && flutter pub run build_runner build --delete-conflicting-outputs`

### If platform files are missing:
- Run `flutter create .` in the mobile directory
- This will generate Android and iOS platform configurations

### If Stripe initialization fails:
- Ensure you've set the Stripe publishable key in `app_config.dart`
- Check that Stripe is properly initialized in `main.dart`

