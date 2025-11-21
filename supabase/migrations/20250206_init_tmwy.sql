-- Enable helpful extensions (already available in most Supabase projects)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- Profiles
--------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('client','proxy','admin')),
  avatar_url text,
  phone text,
  bio text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

--------------------------------------------------------------------------------
-- Events (requests created by clients)
--------------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  event_type text not null check (
    event_type in ('funeral','wedding','court','hospital','other')
  ),
  description text,
  location_city text,
  location_state text,
  location_country text,
  location_address text,
  start_time timestamptz not null,
  end_time timestamptz,
  status text not null default 'draft' check (
    status in ('draft','published','matched','in_progress','completed','cancelled')
  ),
  budget_cents integer,
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_events_updated_at
before update on public.events
for each row
execute procedure public.set_profiles_updated_at();

--------------------------------------------------------------------------------
-- Event Assignments (clients choose proxy stand-ins)
--------------------------------------------------------------------------------
create table if not exists public.event_assignments (
  event_id uuid not null references public.events (id) on delete cascade,
  stand_in_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'invited' check (
    status in ('invited','accepted','declined','in_progress','completed','cancelled')
  ),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (event_id, stand_in_id)
);

--------------------------------------------------------------------------------
-- Messaging between clients and stand-ins
--------------------------------------------------------------------------------
create table if not exists public.event_messages (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- Payments (Stripe payment intent references stored for auditing)
--------------------------------------------------------------------------------
create table if not exists public.event_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'usd',
  stripe_payment_intent_id text,
  status text not null default 'pending' check (
    status in ('pending','requires_action','succeeded','failed','refunded')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_event_payments_updated_at
before update on public.event_payments
for each row
execute procedure public.set_profiles_updated_at();

--------------------------------------------------------------------------------
-- Row Level Security
--------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_assignments enable row level security;
alter table public.event_messages enable row level security;
alter table public.event_payments enable row level security;

-- Profiles: everyone can read basic info; only owner can update/delete
drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable" on public.profiles
for select
using (true);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
for update
using (auth.uid() = id);

-- Events
drop policy if exists "Clients manage own events" on public.events;
create policy "Clients manage own events" on public.events
for all
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

drop policy if exists "Assigned stand-ins can view events" on public.events;
create policy "Assigned stand-ins can view events" on public.events
for select
using (
  exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = events.id
      and ea.stand_in_id = auth.uid()
  )
);

-- Event assignments
drop policy if exists "Clients manage assignments" on public.event_assignments;
create policy "Clients manage assignments" on public.event_assignments
for all
using (
  auth.uid() = (
    select client_id from public.events where events.id = event_assignments.event_id
  )
)
with check (
  auth.uid() = (
    select client_id from public.events where events.id = event_assignments.event_id
  )
);

drop policy if exists "Stand-ins can view their assignments" on public.event_assignments;
create policy "Stand-ins can view their assignments" on public.event_assignments
for select
using (auth.uid() = stand_in_id);

-- Messages: only participants can insert/select
drop policy if exists "Participants manage messages" on public.event_messages;
create policy "Participants manage messages" on public.event_messages
for all
using (
  auth.uid() in (sender_id, recipient_id)
  or auth.uid() = (
    select client_id from public.events where events.id = event_messages.event_id
  )
)
with check (
  auth.uid() in (sender_id, recipient_id)
);

-- Payments: only client who paid (or event owner) can view
drop policy if exists "Clients manage their payments" on public.event_payments;
create policy "Clients manage their payments" on public.event_payments
for all
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

--------------------------------------------------------------------------------
-- Helper view for stand-in availability (optional)
--------------------------------------------------------------------------------
create view if not exists public.stand_in_profiles as
select
  p.*,
  (p.role = 'proxy') as is_stand_in,
  coalesce(count(ea.event_id) filter (where ea.status = 'in_progress'), 0) as active_events
from public.profiles p
left join public.event_assignments ea
  on ea.stand_in_id = p.id
group by p.id;

