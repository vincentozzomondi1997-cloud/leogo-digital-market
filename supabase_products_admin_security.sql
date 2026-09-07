-- LEOGO PRODUCT APPROVAL SECURITY PATCH
-- Run AFTER supabase_products.sql.
-- This prevents sellers from changing approval_status themselves and gives
-- authorized LEOGO admin/staff roles controlled access to review products.

-- Authorized roles already used by the LEOGO admin/staff system.
-- Expected profile key: public.profiles.id = auth.uid(), with public.profiles.role.

create or replace function public.leogo_is_product_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role,'')) in ('admin','manager','supervisor','staff')
  );
$$;

revoke all on function public.leogo_is_product_admin() from public;
grant execute on function public.leogo_is_product_admin() to authenticated;

-- Only an authorized LEOGO role may change approval_status.
create or replace function public.protect_product_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approval_status is distinct from old.approval_status then
    if not public.leogo_is_product_admin() then
      raise exception 'Only authorized LEOGO admin/staff may change product approval status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_protect_approval_status on public.products;
create trigger products_protect_approval_status
before update on public.products
for each row execute function public.protect_product_approval_status();

-- Admin/staff can review all products, including pending and rejected ones.
drop policy if exists "LEOGO admins can view all products" on public.products;
create policy "LEOGO admins can view all products"
on public.products
for select
to authenticated
using (public.leogo_is_product_admin());

-- Admin/staff can change product approval status and other moderation fields.
drop policy if exists "LEOGO admins can moderate products" on public.products;
create policy "LEOGO admins can moderate products"
on public.products
for update
to authenticated
using (public.leogo_is_product_admin())
with check (public.leogo_is_product_admin());

-- Keep seller editing, but the trigger above blocks seller approval changes.
-- Sellers retain ownership of their normal product fields.
