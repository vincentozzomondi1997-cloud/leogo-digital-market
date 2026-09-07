-- LEOGO PRODUCT CATALOG
-- Production-safe UUID product records for approved sellers.
-- Run this script in Supabase SQL Editor before enabling seller product onboarding.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 160),
  category text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_public_idx on public.products(approval_status, status);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

alter table public.products enable row level security;

-- Customers/visitors can see only products that LEOGO has approved and that the seller has made active.
drop policy if exists "Public can view approved active products" on public.products;
create policy "Public can view approved active products"
on public.products
for select
to anon, authenticated
using (
  status = 'active'
  and approval_status = 'approved'
  and exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and lower(coalesce(s.status,'')) = 'active'
  )
);

-- An approved seller may create products belonging only to their own seller record.
drop policy if exists "Active sellers can create products" on public.products;
create policy "Active sellers can create products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
  )
);

-- Sellers may view their own products, including pending/rejected records.
drop policy if exists "Sellers can view own products" on public.products;
create policy "Sellers can view own products"
on public.products
for select
to authenticated
using (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
);

-- Sellers may update only products belonging to their own account.
-- approval_status should later be restricted to LEOGO staff/admin when the admin product-review module is added.
drop policy if exists "Sellers can update own products" on public.products;
create policy "Sellers can update own products"
on public.products
for update
to authenticated
using (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
);

-- Sellers may delete only their own products.
drop policy if exists "Sellers can delete own products" on public.products;
create policy "Sellers can delete own products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
);

comment on table public.products is 'LEOGO marketplace products. Each record uses a genuine UUID and belongs to an approved seller.';
