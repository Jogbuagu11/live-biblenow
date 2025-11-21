-- Migration: Add support for users to have multiple roles (client and proxy)
-- This allows users to switch between being a client and a proxy

-- Create user_roles junction table to support multiple roles per user
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('client','proxy')),
  is_active boolean not null default false, -- The currently active role
  created_at timestamptz not null default now(),
  unique(user_id, role) -- One role per user, but can have both client and proxy
);

-- Create index for faster lookups
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_active on public.user_roles(user_id, is_active) where is_active = true;

-- Function to ensure only one active role per user
create or replace function public.ensure_single_active_role()
returns trigger
language plpgsql
as $$
begin
  -- If setting a role to active, deactivate all other roles for this user
  if new.is_active = true then
    update public.user_roles
    set is_active = false
    where user_id = new.user_id
      and id != new.id;
  end if;
  return new;
end;
$$;

-- Trigger to enforce single active role
drop trigger if exists ensure_single_active_role_trigger on public.user_roles;
create trigger ensure_single_active_role_trigger
before insert or update on public.user_roles
for each row
execute function public.ensure_single_active_role();

-- Function to create user role when profile is created
create or replace function public.create_user_role_from_profile()
returns trigger
language plpgsql
as $$
begin
  -- Create user_roles entry when profile is created
  insert into public.user_roles (user_id, role, is_active)
  values (new.id, new.role, true)
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

-- Trigger to create user_roles when profile is created
drop trigger if exists create_user_role_from_profile_trigger on public.profiles;
create trigger create_user_role_from_profile_trigger
after insert on public.profiles
for each row
execute function public.create_user_role_from_profile();

-- Migrate existing data from profiles.role to user_roles
-- This assumes existing users have a single role in profiles.role
insert into public.user_roles (user_id, role, is_active)
select 
  id as user_id,
  role,
  true as is_active
from public.profiles
where not exists (
  select 1 from public.user_roles ur where ur.user_id = profiles.id
)
on conflict (user_id, role) do nothing;

-- Function to get user's active role
create or replace function public.get_user_active_role(user_uuid uuid)
returns text
language plpgsql
security definer
as $$
declare
  active_role text;
begin
  select role into active_role
  from public.user_roles
  where user_id = user_uuid and is_active = true
  limit 1;
  
  return coalesce(active_role, 'client'); -- Default to client if no role found
end;
$$;

-- Function to switch user's active role
create or replace function public.switch_user_role(user_uuid uuid, new_role text)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Check if user has this role
  if not exists (
    select 1 from public.user_roles 
    where user_id = user_uuid and role = new_role
  ) then
    -- Create the role if it doesn't exist
    insert into public.user_roles (user_id, role, is_active)
    values (user_uuid, new_role, true)
    on conflict (user_id, role) do update set is_active = true;
  else
    -- Activate the role (trigger will deactivate others)
    update public.user_roles
    set is_active = true
    where user_id = user_uuid and role = new_role;
  end if;
  
  return true;
end;
$$;

-- Function to add a role to a user (without activating it)
create or replace function public.add_user_role(user_uuid uuid, role_to_add text)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Add the role if it doesn't exist
  insert into public.user_roles (user_id, role, is_active)
  values (user_uuid, role_to_add, false)
  on conflict (user_id, role) do nothing;
  
  return true;
end;
$$;

-- RLS Policies for user_roles
alter table public.user_roles enable row level security;

-- Users can view their own roles
create policy "Users can view their own roles"
on public.user_roles
for select
using (auth.uid() = user_id);

-- Users can insert their own roles
create policy "Users can insert their own roles"
on public.user_roles
for insert
with check (auth.uid() = user_id);

-- Users can update their own roles
create policy "Users can update their own roles"
on public.user_roles
for update
using (auth.uid() = user_id);

-- Update profiles table to keep role for backward compatibility (but use user_roles as source of truth)
-- The role column in profiles will be updated via trigger when active role changes

-- Trigger to sync active role to profiles.role
create or replace function public.sync_active_role_to_profile()
returns trigger
language plpgsql
as $$
begin
  -- Update profiles.role when a role becomes active
  if new.is_active = true then
    update public.profiles
    set role = new.role
    where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_active_role_to_profile_trigger on public.user_roles;
create trigger sync_active_role_to_profile_trigger
after insert or update on public.user_roles
for each row
when (new.is_active = true)
execute function public.sync_active_role_to_profile();

