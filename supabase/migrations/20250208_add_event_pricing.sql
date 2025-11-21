-- Add pricing and category metadata to stand-in (proxy) requests

alter table public.events
  add column if not exists request_category text not null default 'other',
  add column if not exists price_type text not null default 'free'
    check (price_type in ('free', 'paid', 'negotiable')),
  add column if not exists price_amount_cents integer
    check (price_amount_cents is null or price_amount_cents >= 0);

comment on column public.events.request_category is
  'UI-facing category for proxy requests (e.g., baby, young_child, legal).';
comment on column public.events.price_type is
  'Pricing model selected by the client: free, paid, or negotiable.';
comment on column public.events.price_amount_cents is
  'If price_type = paid, the offered amount in cents.';

create index if not exists events_request_category_idx on public.events (request_category);

