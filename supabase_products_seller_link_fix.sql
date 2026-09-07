-- LEOGO: verify/fix seller -> products foreign-key alignment
-- Run this in Supabase SQL Editor.
-- This preserves the foreign key; it does NOT weaken security.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sellers' AND column_name='id'
  ) THEN
    RAISE EXCEPTION 'public.sellers.id does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='seller_id'
  ) THEN
    RAISE EXCEPTION 'public.products.seller_id does not exist';
  END IF;
END $$;

-- Remove any orphaned product rows before enforcing the relationship.
DELETE FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.sellers s WHERE s.id = p.seller_id
);

-- Recreate the foreign key against sellers.id explicitly.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seller_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_seller_id_fkey
  FOREIGN KEY (seller_id)
  REFERENCES public.sellers(id)
  ON DELETE CASCADE;

-- Helpful index for seller product lookups.
CREATE INDEX IF NOT EXISTS products_seller_id_idx
  ON public.products(seller_id);

-- Confirm the current seller account can be matched by its auth user.
SELECT
  s.id AS seller_id,
  s.auth_user_id,
  s.business_name,
  s.status,
  auth.uid() AS current_auth_user
FROM public.sellers s
WHERE s.auth_user_id = auth.uid();
