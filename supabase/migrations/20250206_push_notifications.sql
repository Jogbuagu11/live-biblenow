-- Migration: Push Notifications Infrastructure
-- Sets up device tokens storage and notification triggers for messages and waves (event assignments)

--------------------------------------------------------------------------------
-- Device Tokens Table
--------------------------------------------------------------------------------
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null, -- FCM device token
  platform text not null check (platform in ('web', 'ios', 'android')),
  device_info jsonb, -- Store device name, OS version, etc.
  is_active boolean not null default true,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, token) -- One token per user, but user can have multiple devices
);

create index if not exists idx_device_tokens_user_id on public.device_tokens(user_id) where is_active = true;
create index if not exists idx_device_tokens_token on public.device_tokens(token);

-- RLS Policies for device_tokens
alter table public.device_tokens enable row level security;

-- Users can view their own tokens
create policy "Users can view their own device tokens"
on public.device_tokens
for select
using (auth.uid() = user_id);

-- Users can insert their own tokens
create policy "Users can insert their own device tokens"
on public.device_tokens
for insert
with check (auth.uid() = user_id);

-- Users can update their own tokens
create policy "Users can update their own device tokens"
on public.device_tokens
for update
using (auth.uid() = user_id);

-- Users can delete their own tokens
create policy "Users can delete their own device tokens"
on public.device_tokens
for delete
using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Notifications Table (for tracking sent notifications)
--------------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('message', 'wave', 'proxy_request', 'event_update', 'payment', 'system')),
  title text not null,
  body text not null,
  data jsonb, -- Additional notification data (event_id, message_id, etc.)
  read_at timestamptz,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, read_at) where read_at is null;

-- RLS Policies for notifications
alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

-- System can insert notifications (via triggers/functions)
create policy "System can insert notifications"
on public.notifications
for insert
with check (true); -- Allow inserts from triggers

-- Users can update their own notifications (mark as read)
create policy "Users can update their own notifications"
on public.notifications
for update
using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Function: Register Device Token
--------------------------------------------------------------------------------
create or replace function public.register_device_token(
  p_token text,
  p_platform text,
  p_device_info jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  token_id uuid;
begin
  -- Insert or update device token
  insert into public.device_tokens (user_id, token, platform, device_info, last_used_at)
  values (auth.uid(), p_token, p_platform, p_device_info, now())
  on conflict (user_id, token) 
  do update set
    is_active = true,
    last_used_at = now(),
    device_info = coalesce(excluded.device_info, device_tokens.device_info);
  
  select id into token_id
  from public.device_tokens
  where user_id = auth.uid() and token = p_token;
  
  return token_id;
end;
$$;

--------------------------------------------------------------------------------
-- Function: Unregister Device Token
--------------------------------------------------------------------------------
create or replace function public.unregister_device_token(p_token text)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.device_tokens
  set is_active = false
  where user_id = auth.uid() and token = p_token;
  
  return true;
end;
$$;

--------------------------------------------------------------------------------
-- Function: Get User's Active Device Tokens
--------------------------------------------------------------------------------
create or replace function public.get_user_device_tokens(p_user_id uuid)
returns table (
  token text,
  platform text
)
language plpgsql
security definer
as $$
begin
  return query
  select dt.token, dt.platform
  from public.device_tokens dt
  where dt.user_id = p_user_id
    and dt.is_active = true
  order by dt.last_used_at desc;
end;
$$;

--------------------------------------------------------------------------------
-- Function: Create Notification Record
-- This will be called by triggers to log notifications
--------------------------------------------------------------------------------
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, p_data)
  returning id into notification_id;
  
  return notification_id;
end;
$$;

--------------------------------------------------------------------------------
-- Trigger: Send notification when new message is created
--------------------------------------------------------------------------------
create or replace function public.notify_new_message()
returns trigger
language plpgsql
as $$
declare
  sender_name text;
  event_title text;
begin
  -- Get sender's name
  select coalesce(full_name, email) into sender_name
  from public.profiles
  where id = new.sender_id;
  
  -- Get event title
  select title into event_title
  from public.events
  where id = new.event_id;
  
  -- Create notification record
  perform public.create_notification(
    new.recipient_id,
    'message',
    'New message from ' || sender_name,
    new.body,
    jsonb_build_object(
      'event_id', new.event_id,
      'message_id', new.id,
      'sender_id', new.sender_id,
      'type', 'message'
    )
  );
  
  -- Note: Actual push notification will be sent via Supabase Edge Function
  -- or Firebase Admin SDK based on device tokens
  
  return new;
end;
$$;

drop trigger if exists notify_new_message_trigger on public.event_messages;
create trigger notify_new_message_trigger
after insert on public.event_messages
for each row
execute function public.notify_new_message();

--------------------------------------------------------------------------------
-- Trigger: Send notification when wave (event assignment) is created
--------------------------------------------------------------------------------
create or replace function public.notify_new_wave()
returns trigger
language plpgsql
as $$
declare
  client_name text;
  event_title text;
  event_type text;
begin
  -- Get client's name
  select coalesce(full_name, email) into client_name
  from public.profiles
  where id = (select client_id from public.events where id = new.event_id);
  
  -- Get event details
  select title, event_type into event_title, event_type
  from public.events
  where id = new.event_id;
  
  -- Create notification record
  perform public.create_notification(
    new.stand_in_id,
    'wave',
    'New wave: ' || event_title,
    client_name || ' needs a stand-in for a ' || event_type || ' event',
    jsonb_build_object(
      'event_id', new.event_id,
      'assignment_id', new.event_id || '_' || new.stand_in_id,
      'client_id', (select client_id from public.events where id = new.event_id),
      'type', 'wave'
    )
  );
  
  return new;
end;
$$;

drop trigger if exists notify_new_wave_trigger on public.event_assignments;
create trigger notify_new_wave_trigger
after insert on public.event_assignments
for each row
when (new.status = 'invited')
execute function public.notify_new_wave();

--------------------------------------------------------------------------------
-- Trigger: Send notification when wave is accepted
--------------------------------------------------------------------------------
create or replace function public.notify_wave_accepted()
returns trigger
language plpgsql
as $$
declare
  stand_in_name text;
  event_title text;
begin
  -- Only notify if status changed to accepted
  if new.status = 'accepted' and (old.status is null or old.status != 'accepted') then
    -- Get stand-in's name
    select coalesce(full_name, email) into stand_in_name
    from public.profiles
    where id = new.stand_in_id;
    
    -- Get event title
    select title into event_title
    from public.events
    where id = new.event_id;
    
    -- Create notification for client
    perform public.create_notification(
      (select client_id from public.events where id = new.event_id),
      'wave',
      'Wave accepted!',
      stand_in_name || ' accepted your request for: ' || event_title,
      jsonb_build_object(
        'event_id', new.event_id,
        'stand_in_id', new.stand_in_id,
        'type', 'wave_accepted'
      )
    );
  end if;
  
  return new;
end;
$$;

drop trigger if exists notify_wave_accepted_trigger on public.event_assignments;
create trigger notify_wave_accepted_trigger
after update on public.event_assignments
for each row
when (new.status = 'accepted' and (old.status is null or old.status != 'accepted'))
execute function public.notify_wave_accepted();

--------------------------------------------------------------------------------
-- Function: Mark notification as read
--------------------------------------------------------------------------------
create or replace function public.mark_notification_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.notifications
  set read_at = now()
  where id = p_notification_id
    and user_id = auth.uid();
  
  return true;
end;
$$;

--------------------------------------------------------------------------------
-- Function: Mark all notifications as read
--------------------------------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer;
begin
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;
  
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

