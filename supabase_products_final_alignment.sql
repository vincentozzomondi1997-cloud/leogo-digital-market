-- LEOGO FINAL PRODUCT APPROVAL ALIGNMENT
-- Matches the EXISTING public.products table discovered in the LEOGO database.
-- Does NOT drop the table or existing product data.
-- Existing fields retained: id, seller_id, name, description, category, price,
-- image_url, available, stock_qty, approved, created_at, updated_at.
-- Adds approval_status so Pending / Approved / Rejected can be distinguished.

-- 1. Add the moderation status safely.
alter table public.products
  add column if not exists approval_status text;

-- 2. Convert existing records safely.
update public.products
set approval_status = case
  when approved = true then 'approved'
  else 'pending'
end
where approval_status is null;

alter table public.products
  alter column approval_status set default 'pending';

alter table public.products
  alter column approval_status set not null;

-- 3. Only the three moderation states are allowed.
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

-- 4. Keep the older approved boolean synchronized for compatibility with existing LEOGO code.
create or replace function public.sync_product_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approval_status is distinct from old.approval_status then
    if not public.is_staff() then
      raise exception 'Only authorized LEOGO staff may change product approval status';
    end if;
    new.approved := (new.approval_status = 'approved');
  elsif new.approved is distinct from old.approved then
    if not public.is_staff() then
      raise exception 'Only authorized LEOGO staff may change product approval status';
    end if;
    new.approval_status := case when new.approved then 'approved' else 'rejected' end;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_approval on public.products;
create trigger products_sync_approval
before update on public.products
for each row execute function public.sync_product_approval();

-- 5. Replace the existing product RLS policies with policies matching
-- products.seller_id -> sellers.id -> sellers.auth_user_id -> auth.uid().
drop policy if exists "products public approved read" on public.products;
drop policy if exists "seller insert products" on public.products;
drop policy if exists "seller update own products" on public.products;
drop policy if exists "Public can view approved active products" on public.products;
drop policy if exists "Active sellers can create products" on public.products;
drop policy if exists "Sellers can view own products" on public.products;
drop policy if exists "Sellers can update own products" on public.products;
drop policy if exists "Sellers can delete own products" on public.products;
drop policy if exists "LEOGO public approved products" on public.products;
drop policy if exists "LEOGO active sellers insert products" on public.products;
drop policy if exists "LEOGO sellers update own products" on public.products;
drop policy if exists "LEOGO sellers delete own products" on public.products;

-- Customers/visitors: only approved + available products.
-- Sellers: their own products, including pending/rejected.
-- Staff: all products for moderation.
create policy "LEOGO products controlled read"
on public.products
for select
to anon, authenticated
using (
  (approved = true and available = true)
  or exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
);

-- Active sellers may create only their own products and every new product starts pending.
create policy "LEOGO active sellers create products"
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
  and coalesce(approved,false) = false
  and coalesce(approval_status,'pending') = 'pending'
);

-- Sellers may edit their own products; approval changes are blocked by the trigger.
-- Staff may edit products for moderation.
create policy "LEOGO product owners update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
)
with check (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
);

create policy "LEOGO product owners delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1 from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
);

create index if not exists products_approval_status_available_idx
  on public.products(approval_status, approved, available);

comment on table public.products is 'LEOGO marketplace products. approval_status is the authoritative moderation state; approved is retained in sync for legacy compatibility; available controls catalogue availability.';
