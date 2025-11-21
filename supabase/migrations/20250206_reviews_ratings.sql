-- Migration: Add reviews and ratings system for proxies
-- Clients can leave reviews and ratings (1-5 stars) for proxies after completed events

--------------------------------------------------------------------------------
-- Reviews Table
--------------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  proxy_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ensure one review per client per event
  unique(event_id, client_id)
);

create index if not exists idx_reviews_proxy_id on public.reviews(proxy_id, created_at desc);
create index if not exists idx_reviews_event_id on public.reviews(event_id);

-- RLS Policies for reviews
alter table public.reviews enable row level security;

-- Anyone can read reviews (public profile feature)
create policy "Reviews are publicly readable"
on public.reviews
for select
using (true);

-- Clients can create reviews for events they participated in
create policy "Clients can create reviews for their events"
on public.reviews
for insert
with check (
  auth.uid() = client_id
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.client_id = auth.uid()
      and e.status = 'completed'
  )
);

-- Clients can update their own reviews
create policy "Clients can update their own reviews"
on public.reviews
for update
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

-- Clients can delete their own reviews
create policy "Clients can delete their own reviews"
on public.reviews
for delete
using (auth.uid() = client_id);

-- Function to calculate average rating for a proxy
create or replace function public.get_proxy_rating(p_proxy_id uuid)
returns numeric
language plpgsql
stable
as $$
declare
  avg_rating numeric;
begin
  select coalesce(avg(rating), 0) into avg_rating
  from public.reviews
  where proxy_id = p_proxy_id;
  
  return round(avg_rating, 2);
end;
$$;

-- Function to get review count for a proxy
create or replace function public.get_proxy_review_count(p_proxy_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  review_count integer;
begin
  select count(*) into review_count
  from public.reviews
  where proxy_id = p_proxy_id;
  
  return review_count;
end;
$$;

-- Update trigger for reviews
create or replace function public.set_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_reviews_updated_at();

-- View: Proxy reviews with client info
create or replace view public.proxy_reviews as
select
  r.id as review_id,
  r.proxy_id,
  r.client_id,
  r.event_id,
  r.rating,
  r.comment,
  r.created_at,
  r.updated_at,
  c.full_name as client_name,
  c.avatar_url as client_avatar,
  e.title as event_title,
  e.event_type
from public.reviews r
inner join public.profiles c on c.id = r.client_id
inner join public.events e on e.id = r.event_id;

-- Grant access
grant select on public.proxy_reviews to authenticated;

