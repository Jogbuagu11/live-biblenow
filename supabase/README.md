## Supabase Backend Setup

The SQL migration in `migrations/20250206_init_tmwy.sql` creates all required tables, triggers, and Row Level Security policies for TMWY. Run it in your Supabase project with either:

```bash
supabase db push
# or
psql "$SUPABASE_DB_URL" -f supabase/migrations/20250206_init_tmwy.sql
```

### Tables

| Table | Purpose |
| --- | --- |
| `public.profiles` | Mirrors `auth.users`, stores role (`client`, `proxy`, `admin`), profile info |
| `public.events` | Requests from clients for a stand-in |
| `public.event_assignments` | Relationship between events and stand-ins |
| `public.event_messages` | In-app messaging between client and stand-in |
| `public.event_payments` | Stores Stripe payment intent references |

### Row-Level Security Highlights

- Profiles: everyone can read; users can update their own profile.
- Events: clients manage their events; assigned stand-ins can read them.
- Assignments: clients manage; stand-ins can read their assignments.
- Messages: only participants can create/read.
- Payments: only the client who owns the event/payment can view.

### Auth configuration

1. In Supabase dashboard go to **Authentication → Providers** and enable **Email** (magic links or password).  
2. In **Authentication → Policies**, ensure email confirmations are required if you need verified accounts.  
3. Map Supabase env vars to the apps:
   - Web: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Flutter: update `AppConfig.supabaseUrl` and `AppConfig.supabaseAnonKey`, or provide them via `--dart-define`.
4. Optional: add custom email templates for onboarding stand-ins.

### Trigger summary

- `handle_new_user`: automatically inserts into `public.profiles` when a new auth user is created.
- `set_profiles_updated_at` reused on profiles/events/payments to keep `updated_at` fresh.

### Next steps

- Configure Stripe webhooks to update `event_payments.status`.
- Use Edge Functions or Supabase Functions for push notifications or background tasks (e.g., auto-assigning stand-ins).

