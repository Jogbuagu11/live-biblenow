# TMWY (Take Me With You)

A web application and mobile Flutter app that connects people with trusted stand-ins for life's important moments.

**URL**: https://takemewithyou.app

## Project Structure

```
TMWY/
├── mobile/          # Flutter mobile app
└── (root)/          # React web app
```

## Tech Stack

### Web App
- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

### Mobile App
- **Framework**: Flutter
- **State Management**: Riverpod
- **Backend**: Supabase
- **Payments**: Stripe
- **Email**: Resend (via backend API)
- **Navigation**: GoRouter

## Getting Started

### Prerequisites

**For Web App:**
- Node.js 18+ and npm
- Supabase account
- Stripe account
- Resend account

**For Mobile App:**
- Flutter SDK 3.0+
- Dart SDK 3.0+
- Android Studio / Xcode
- Same backend accounts (Supabase, Stripe, Resend)

### Web App Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Resend Configuration (for server-side email)
RESEND_API_KEY=your_resend_api_key

# App Configuration
VITE_APP_URL=https://takemewithyou.app
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install Flutter dependencies:
```bash
flutter pub get
```

3. Generate Riverpod code:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

4. Configure environment variables:
   - Update `lib/core/config/app_config.dart` with your credentials, OR
   - Use compile-time environment variables when running:
   ```bash
   flutter run --dart-define=SUPABASE_URL=your_url --dart-define=SUPABASE_ANON_KEY=your_key --dart-define=STRIPE_PUBLISHABLE_KEY=your_key
   ```

5. Run the app:
```bash
flutter run
```

See `mobile/README.md` for detailed mobile app documentation.

## Web App Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   └── ...
├── lib/             # Utilities and configurations
│   ├── supabase.ts  # Supabase client and auth helpers
│   ├── stripe.ts    # Stripe integration
│   ├── resend.ts    # Email service utilities
│   └── store.ts     # Zustand state management
├── pages/           # Page components
└── hooks/           # Custom React hooks
```

## Mobile App Structure

```
mobile/lib/
├── core/
│   ├── config/          # App configuration
│   ├── providers/       # Riverpod providers
│   ├── routing/          # Navigation setup
│   ├── services/         # API services
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
- **Protected Routes**: Route protection based on auth state
- **Payment Integration**: Stripe for processing payments
- **Email Notifications**: Resend for transactional emails
- **State Management**: Zustand for client-side state

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_APP_URL`
3. Deploy!

The `vercel.json` configuration file is already set up for automatic deployments.

## Backend API Routes

For production, you'll need to set up API routes for:
- Payment intent creation (`/api/create-payment-intent`)
- Email sending (`/api/send-email`)

These should be implemented as serverless functions (e.g., Vercel API routes) that securely handle:
- Stripe secret key operations
- Resend API key operations
- Server-side Supabase operations with service role key

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Notes

- **State Management**: 
  - Web app uses Zustand for state management
  - Mobile app uses Riverpod (Flutter-specific state management)
- **Environment Variables**: Never commit `.env` files. Use environment variable templates as reference.
- **Supabase**: Set up Row Level Security (RLS) policies in your Supabase project for data security.
- **Code Generation**: The Flutter app requires running `build_runner` to generate Riverpod provider code after adding new providers.

## License

Private project - All rights reserved
