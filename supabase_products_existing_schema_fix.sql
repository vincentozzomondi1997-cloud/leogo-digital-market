-- LEOGO PRODUCT SECURITY / SCHEMA ALIGNMENT
-- IMPORTANT: This matches the existing public.products table already in the LEOGO database.
-- Existing approval model: approved BOOLEAN. Existing availability model: available BOOLEAN.
-- Run this AFTER inspecting the existing products table. It does not drop the products table or data.

-- Ensure existing products have safe defaults for the approval/availability fields.
alter table public.products
  alter column approved set default false;

alter table public.products
  alter column available set default true;

-- Existing product timestamps already exist; keep the existing trigger if present.

-- Helper: only LEOGO staff/admin roles may approve or reject products.
-- The existing project uses public.is_staff() in product RLS, so the trigger uses it too.
create or replace function public.protect_product_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approved is distinct from old.approved then
    if not public.is_staff() then
      raise exception 'Only authorized LEOGO staff may approve or reject products';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_protect_approval on public.products;
create trigger products_protect_approval
before update on public.products
for each row execute function public.protect_product_approval();

-- Replace product policies with policies that match the real seller relationship:
-- products.seller_id -> sellers.id -> sellers.auth_user_id -> auth.uid().
-- Public users see only approved AND available products.
-- Sellers see their own products.
-- Staff can review all products.
drop policy if exists "products public approved read" on public.products;
drop policy if exists "seller insert products" on public.products;
drop policy if exists "seller update own products" on public.products;
drop policy if exists "Public can view approved active products" on public.products;
drop policy if exists "Active sellers can create products" on public.products;
drop policy if exists "Sellers can view own products" on public.products;
drop policy if exists "Sellers can update own products" on public.products;
drop policy if exists "Sellers can delete own products" on public.products;

create policy "LEOGO public approved products"
on public.products
for select
to anon, authenticated
using (
  (approved = true and available = true)
  or exists (
    select 1
    from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
);

create policy "LEOGO active sellers insert products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
  )
  and coalesce(approved,false) = false
);

create policy "LEOGO sellers update own products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
)
with check (
  exists (
    select 1
    from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
);

create policy "LEOGO sellers delete own products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.sellers s
    where s.id = products.seller_id
      and s.auth_user_id = auth.uid()
  )
  or public.is_staff()
);

create index if not exists products_approval_available_idx
  on public.products(approved, available);

comment on table public.products is 'LEOGO marketplace products using the existing UUID schema; approved controls LEOGO moderation and available controls catalogue visibility.';
