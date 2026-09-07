-- LEOGO PRODUCT VARIATIONS
-- Run once in Supabase SQL Editor after the product-images SQL.

create extension if not exists pgcrypto;

create table if not exists public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  price numeric(12,2) not null check (price >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  available boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, name)
);

create index if not exists product_variations_product_id_idx on public.product_variations(product_id);
create index if not exists product_variations_available_idx on public.product_variations(available);

create or replace function public.set_product_variations_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_variations_updated_at on public.product_variations;
create trigger product_variations_updated_at
before update on public.product_variations
for each row execute function public.set_product_variations_updated_at();

alter table public.product_variations enable row level security;

drop policy if exists "Public can view approved available variations" on public.product_variations;
create policy "Public can view approved available variations"
on public.product_variations for select
to anon, authenticated
using (
  available = true
  and exists (
    select 1 from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = product_variations.product_id
      and coalesce(p.approved,false) = true
      and lower(coalesce(p.approval_status,'')) = 'approved'
      and coalesce(p.available,true) = true
      and lower(coalesce(s.status,'')) = 'active'
  )
);

drop policy if exists "Sellers can view own variations" on public.product_variations;
create policy "Sellers can view own variations"
on public.product_variations for select
to authenticated
using (
  exists (
    select 1 from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = product_variations.product_id
      and s.auth_user_id = auth.uid()
  )
);

drop policy if exists "Active sellers can insert own variations" on public.product_variations;
create policy "Active sellers can insert own variations"
on public.product_variations for insert
to authenticated
with check (
  exists (
    select 1 from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = product_variations.product_id
      and s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
  )
);

drop policy if exists "Active sellers can update own variations" on public.product_variations;
create policy "Active sellers can update own variations"
on public.product_variations for update
to authenticated
using (
  exists (
    select 1 from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = product_variations.product_id
      and s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
  )
)
with check (
  exists (
    select 1 from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = product_variations.product_id
      and s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
  )
);

drop policy if exists "Active sellers can delete own variations" on public.product_variations;
create policy "Active sellers can delete own variations"
on public.product_variations for delete
to authenticated
using (
  exists (
    select 1 from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = product_variations.product_id
      and s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
  )
);
