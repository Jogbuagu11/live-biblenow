-- Fix infinite recursion in events RLS policy by moving logic into helper function

create or replace function public.stand_in_assigned_to_event(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.event_assignments ea
    where ea.event_id = p_event_id
      and ea.stand_in_id = auth.uid()
  );
$$;

drop policy if exists "Assigned stand-ins can view events" on public.events;
create policy "Assigned stand-ins can view events" on public.events
for select
using (public.stand_in_assigned_to_event(id));

