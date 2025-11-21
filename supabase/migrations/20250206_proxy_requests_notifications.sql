-- Migration: Add proxy request notifications and feed views
-- This adds notifications when events are published (proxy requests)

--------------------------------------------------------------------------------
-- Trigger: Send notification when event is published (proxy request)
--------------------------------------------------------------------------------
create or replace function public.notify_proxy_request()
returns trigger
language plpgsql
as $$
declare
  client_name text;
  event_title text;
  event_type text;
  should_notify boolean;
begin
  -- Determine if we should notify
  -- For INSERT: notify if status is 'published'
  -- For UPDATE: notify if status changed to 'published'
  if TG_OP = 'INSERT' then
    should_notify := new.status = 'published';
  elsif TG_OP = 'UPDATE' then
    should_notify := new.status = 'published' and (old.status is null or old.status != 'published');
  else
    should_notify := false;
  end if;
  
  if should_notify then
    -- Get client's name
    select coalesce(full_name, email) into client_name
    from public.profiles
    where id = new.client_id;
    
    -- Get event details
    select title, event_type into event_title, event_type
    from public.events
    where id = new.id;
    
    -- Create notification for all active proxies
    -- Note: In a real implementation, you might want to filter by location, availability, etc.
    insert into public.notifications (user_id, type, title, body, data)
    select 
      ur.user_id,
      'proxy_request' as type,
      'New proxy request: ' || event_title as title,
      client_name || ' needs a stand-in for a ' || event_type || ' event' as body,
      jsonb_build_object(
        'event_id', new.id,
        'client_id', new.client_id,
        'event_type', event_type,
        'type', 'proxy_request'
      ) as data
    from public.user_roles ur
    where ur.role = 'proxy'
      and ur.is_active = true
      and ur.user_id != new.client_id; -- Don't notify the client themselves
    
    -- Note: Actual push notifications will be sent via Edge Function
    -- which will be triggered by the Realtime subscription in the app
  end if;
  
  return new;
end;
$$;

drop trigger if exists notify_proxy_request_trigger on public.events;
create trigger notify_proxy_request_trigger
after insert or update on public.events
for each row
execute function public.notify_proxy_request();

--------------------------------------------------------------------------------
-- View: Proxy Feed (for clients to see proxies offering services)
-- Shows active proxies with their profiles and availability
--------------------------------------------------------------------------------
create or replace view public.proxy_feed as
select distinct
  p.id as proxy_id,
  p.full_name as proxy_name,
  p.avatar_url,
  p.bio,
  p.verified,
  p.created_at as member_since,
  -- Count completed events
  (select count(*) 
   from public.event_assignments ea
   join public.events e on e.id = ea.event_id
   where ea.stand_in_id = p.id 
     and ea.status = 'completed') as completed_events,
  -- Calculate average rating (if you add ratings table later)
  0 as rating, -- Placeholder for future ratings
  -- Check if proxy is currently active (has active role)
  exists(
    select 1 from public.user_roles ur
    where ur.user_id = p.id
      and ur.role = 'proxy'
      and ur.is_active = true
  ) as is_active
from public.profiles p
inner join public.user_roles ur on ur.user_id = p.id
where ur.role = 'proxy'
  and ur.is_active = true
  and p.verified = true -- Only show verified proxies
order by p.created_at desc;

-- Grant access to authenticated users
grant select on public.proxy_feed to authenticated;

--------------------------------------------------------------------------------
-- View: Request Feed (for proxies to see client requests)
-- Shows published events (proxy requests) that proxies can respond to
--------------------------------------------------------------------------------
create or replace view public.request_feed as
select
  e.id as event_id,
  e.title,
  e.event_type,
  e.description,
  e.location_city,
  e.location_state,
  e.location_country,
  e.location_address,
  e.start_time,
  e.end_time,
  e.budget_cents,
  e.currency,
  e.status,
  e.created_at as requested_at,
  -- Client info
  c.id as client_id,
  c.full_name as client_name,
  c.avatar_url as client_avatar,
  c.verified as client_verified,
  -- Check if current proxy has already been invited/responded
  case 
    when auth.uid() is not null then
      exists(
        select 1 from public.event_assignments ea
        where ea.event_id = e.id
          and ea.stand_in_id = auth.uid()
      )
    else false
  end as has_responded,
  -- Get response status if proxy has responded
  (select ea.status
   from public.event_assignments ea
   where ea.event_id = e.id
     and ea.stand_in_id = auth.uid()
   limit 1) as response_status,
  -- Count how many proxies have been invited
  (select count(*)
   from public.event_assignments ea
   where ea.event_id = e.id) as invited_count,
  -- Count how many proxies have accepted
  (select count(*)
   from public.event_assignments ea
   where ea.event_id = e.id
     and ea.status = 'accepted') as accepted_count
from public.events e
inner join public.profiles c on c.id = e.client_id
where e.status = 'published' -- Only show published requests
  and e.start_time > now() -- Only show future events
order by e.created_at desc;

-- Grant access to authenticated users
grant select on public.request_feed to authenticated;

--------------------------------------------------------------------------------
-- Function: Get proxy feed with filters
--------------------------------------------------------------------------------
create or replace function public.get_proxy_feed(
  p_limit integer default 50,
  p_offset integer default 0,
  p_search text default null,
  p_min_rating numeric default null
)
returns table (
  proxy_id uuid,
  proxy_name text,
  avatar_url text,
  bio text,
  verified boolean,
  member_since timestamptz,
  completed_events bigint,
  rating numeric,
  is_active boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select
    pf.proxy_id,
    pf.proxy_name,
    pf.avatar_url,
    pf.bio,
    pf.verified,
    pf.member_since,
    pf.completed_events,
    pf.rating,
    pf.is_active
  from public.proxy_feed pf
  where (p_search is null or 
         pf.proxy_name ilike '%' || p_search || '%' or
         pf.bio ilike '%' || p_search || '%')
    and (p_min_rating is null or pf.rating >= p_min_rating)
  order by pf.completed_events desc, pf.member_since desc
  limit p_limit
  offset p_offset;
end;
$$;

--------------------------------------------------------------------------------
-- Function: Get request feed with filters
--------------------------------------------------------------------------------
create or replace function public.get_request_feed(
  p_limit integer default 50,
  p_offset integer default 0,
  p_event_type text default null,
  p_location_city text default null,
  p_location_state text default null,
  p_min_budget_cents integer default null
)
returns table (
  event_id uuid,
  title text,
  event_type text,
  description text,
  location_city text,
  location_state text,
  location_country text,
  location_address text,
  start_time timestamptz,
  end_time timestamptz,
  budget_cents integer,
  currency text,
  status text,
  requested_at timestamptz,
  client_id uuid,
  client_name text,
  client_avatar text,
  client_verified boolean,
  has_responded boolean,
  response_status text,
  invited_count bigint,
  accepted_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select
    rf.event_id,
    rf.title,
    rf.event_type,
    rf.description,
    rf.location_city,
    rf.location_state,
    rf.location_country,
    rf.location_address,
    rf.start_time,
    rf.end_time,
    rf.budget_cents,
    rf.currency,
    rf.status,
    rf.requested_at,
    rf.client_id,
    rf.client_name,
    rf.client_avatar,
    rf.client_verified,
    rf.has_responded,
    rf.response_status,
    rf.invited_count,
    rf.accepted_count
  from public.request_feed rf
  where (p_event_type is null or rf.event_type = p_event_type)
    and (p_location_city is null or rf.location_city = p_location_city)
    and (p_location_state is null or rf.location_state = p_location_state)
    and (p_min_budget_cents is null or rf.budget_cents >= p_min_budget_cents)
    and rf.has_responded = false -- Only show requests proxy hasn't responded to
  order by rf.requested_at desc
  limit p_limit
  offset p_offset;
end;
$$;

--------------------------------------------------------------------------------
-- Function: Respond to proxy request (for proxies)
--------------------------------------------------------------------------------
create or replace function public.respond_to_proxy_request(
  p_event_id uuid,
  p_response text -- 'accept' or 'decline'
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_user_role text;
begin
  v_user_id := auth.uid();
  
  -- Check if user is a proxy
  select role into v_user_role
  from public.user_roles
  where user_id = v_user_id
    and role = 'proxy'
    and is_active = true
  limit 1;
  
  if v_user_role != 'proxy' then
    raise exception 'Only proxies can respond to requests';
  end if;
  
  -- Check if event exists and is published
  if not exists (
    select 1 from public.events
    where id = p_event_id
      and status = 'published'
  ) then
    raise exception 'Event not found or not available';
  end if;
  
  -- Insert or update assignment
  if p_response = 'accept' then
    insert into public.event_assignments (event_id, stand_in_id, status, responded_at)
    values (p_event_id, v_user_id, 'accepted', now())
    on conflict (event_id, stand_in_id)
    do update set
      status = 'accepted',
      responded_at = now();
    
    -- Update event status to matched if first acceptance
    update public.events
    set status = 'matched'
    where id = p_event_id
      and status = 'published';
  elsif p_response = 'decline' then
    insert into public.event_assignments (event_id, stand_in_id, status, responded_at)
    values (p_event_id, v_user_id, 'declined', now())
    on conflict (event_id, stand_in_id)
    do update set
      status = 'declined',
      responded_at = now();
  else
    raise exception 'Invalid response. Must be "accept" or "decline"';
  end if;
  
  return true;
end;
$$;

