-- LEOGO PRODUCT SCHEMA MIGRATION
-- Use this ONLY if the products table already existed without approval_status.
-- It is safe to run more than once.

alter table public.products
  add column if not exists approval_status text;

update public.products
set approval_status = 'pending'
where approval_status is null;

alter table public.products
  alter column approval_status set default 'pending';

alter table public.products
  alter column approval_status set not null;

drop index if exists public.products_public_idx;
create index if not exists products_public_idx
  on public.products(approval_status, status);

-- Ensure only the three supported approval values are accepted.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_approval_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_approval_status_check
      check (approval_status in ('pending','approved','rejected'));
  end if;
end $$;

-- Public catalogue: approved + active products from active sellers only.
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

-- Active sellers can create their own products.
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

-- Sellers can view their own products.
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

-- Sellers can edit/delete their own products. Approval changes are blocked
-- separately by the admin-security trigger.
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
