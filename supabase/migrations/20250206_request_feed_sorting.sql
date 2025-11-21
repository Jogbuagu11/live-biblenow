-- Migration: Add location-based sorting and rate display to request feed
-- This adds user location fields and improves request feed sorting

--------------------------------------------------------------------------------
-- Add columns to events table FIRST (before creating view that uses them)
--------------------------------------------------------------------------------
-- Add rate_type to events table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'events' 
    and column_name = 'rate_type'
  ) then
    alter table public.events add column rate_type text check (rate_type in ('free', 'listed', 'negotiable')) default 'listed';
  end if;
end $$;

-- Add latitude/longitude and zip_code to events table for distance calculation
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'events' 
    and column_name = 'latitude'
  ) then
    alter table public.events add column latitude numeric;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'events' 
    and column_name = 'longitude'
  ) then
    alter table public.events add column longitude numeric;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'events' 
    and column_name = 'zip_code'
  ) then
    alter table public.events add column zip_code text;
  end if;
end $$;

--------------------------------------------------------------------------------
-- Add location fields to profiles table
--------------------------------------------------------------------------------
do $$
begin
  -- Add zip_code if it doesn't exist
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'zip_code'
  ) then
    alter table public.profiles add column zip_code text;
  end if;
  
  -- Add city if it doesn't exist (might already exist as location_city in events)
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'city'
  ) then
    alter table public.profiles add column city text;
  end if;
  
  -- Add state if it doesn't exist
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'state'
  ) then
    alter table public.profiles add column state text;
  end if;
  
  -- Add latitude and longitude for distance calculations
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'latitude'
  ) then
    alter table public.profiles add column latitude numeric;
  end if;
  
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'longitude'
  ) then
    alter table public.profiles add column longitude numeric;
  end if;
end $$;

--------------------------------------------------------------------------------
-- Function: Calculate distance between two coordinates (Haversine formula)
--------------------------------------------------------------------------------
create or replace function public.calculate_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
returns numeric
language plpgsql
immutable
as $$
declare
  earth_radius_km numeric := 6371;
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
begin
  if lat1 is null or lon1 is null or lat2 is null or lon2 is null then
    return null;
  end if;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  return earth_radius_km * c;
end;
$$;

--------------------------------------------------------------------------------
-- Updated Request Feed View with distance calculation
--------------------------------------------------------------------------------
drop view if exists public.request_feed;
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
  e.zip_code as event_zip_code,
  e.start_time,
  e.end_time,
  e.budget_cents,
  e.currency,
  e.rate_type,
  e.status,
  e.created_at as requested_at,
  -- Client info
  c.id as client_id,
  c.full_name as client_name,
  c.avatar_url as client_avatar,
  c.verified as client_verified,
  -- Calculate distance from current user (if location available)
  -- This will be calculated in the function for better performance
  null::numeric as distance_km, -- Will be calculated in get_request_feed function
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
  and e.start_time > now();

--------------------------------------------------------------------------------
-- Updated Function: Get request feed with sorting options
--------------------------------------------------------------------------------
create or replace function public.get_request_feed(
  p_limit integer default 50,
  p_offset integer default 0,
  p_event_type text default null,
  p_location_city text default null,
  p_location_state text default null,
  p_min_budget_cents integer default null,
  p_sort_by text default 'city_date' -- 'city_date', 'distance', 'date', 'event_type', 'city'
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
  event_zip_code text,
  start_time timestamptz,
  end_time timestamptz,
  budget_cents integer,
  currency text,
  rate_type text,
  status text,
  requested_at timestamptz,
  client_id uuid,
  client_name text,
  client_avatar text,
  client_verified boolean,
  has_responded boolean,
  response_status text,
  invited_count bigint,
  accepted_count bigint,
  distance_km numeric
)
language plpgsql
security definer
as $$
declare
  v_user_lat numeric;
  v_user_lon numeric;
  v_distance numeric;
begin
  -- Get user's location if available
  if auth.uid() is not null then
    select latitude, longitude into v_user_lat, v_user_lon
    from public.profiles
    where id = auth.uid();
  end if;
  
  return query
  with requests_with_distance as (
    select
      rf.*,
      e.latitude as event_latitude,
      e.longitude as event_longitude,
      -- Calculate distance if both user and event have coordinates
      case 
        when v_user_lat is not null and v_user_lon is not null 
             and e.latitude is not null
             and e.longitude is not null then
          public.calculate_distance(
            v_user_lat,
            v_user_lon,
            e.latitude,
            e.longitude
          )
        else null
      end as calculated_distance,
      -- Store calculated distance for sorting
      null::numeric as sort_distance
    from public.request_feed rf
    left join public.events e on e.id = rf.event_id
    where (p_event_type is null or rf.event_type = p_event_type)
      and (p_location_city is null or rf.location_city = p_location_city)
      and (p_location_state is null or rf.location_state = p_location_state)
      and (p_min_budget_cents is null or rf.budget_cents >= p_min_budget_cents)
      and rf.has_responded = false -- Only show requests proxy hasn't responded to
  )
  select
    rwd.event_id,
    rwd.title,
    rwd.event_type,
    rwd.description,
    rwd.location_city,
    rwd.location_state,
    rwd.location_country,
    rwd.location_address,
    rwd.event_zip_code,
    rwd.start_time,
    rwd.end_time,
    rwd.budget_cents,
    rwd.currency,
    rwd.rate_type,
    rwd.status,
    rwd.requested_at,
    rwd.client_id,
    rwd.client_name,
    rwd.client_avatar,
    rwd.client_verified,
    rwd.has_responded,
    rwd.response_status,
    rwd.invited_count,
    rwd.accepted_count,
    rwd.calculated_distance as distance_km
  from requests_with_distance rwd
  order by
    -- Sort by distance (if selected and available)
    case 
      when p_sort_by = 'distance' and rwd.calculated_distance is not null 
      then rwd.calculated_distance 
      else null 
    end asc nulls last,
    -- Sort by city (for city_date and city options)
    case 
      when p_sort_by in ('city_date', 'city') 
      then rwd.location_city 
      else null 
    end asc nulls last,
    -- Sort by event type (if selected)
    case 
      when p_sort_by = 'event_type' 
      then rwd.event_type 
      else null 
    end asc,
    -- Always sort by date as secondary/tertiary sort
    rwd.start_time asc
  limit p_limit
  offset p_offset;
end;
$$;

