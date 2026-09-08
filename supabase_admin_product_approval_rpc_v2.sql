-- LEOGO: Clean v2 admin/staff product moderation RPC
-- This is a separate moderation function so the original RPC remains untouched.
-- Run this once in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.leogo_moderate_product_v2(
  p_product_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_is_admin boolean;
BEGIN
  -- Authorize directly from the authenticated user's profile.
  -- No nested helper is used in this v2 path.
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin','manager','supervisor','staff')
  )
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized for product moderation v2';
  END IF;

  IF p_status NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid moderation status';
  END IF;

  UPDATE public.products
  SET
    approval_status = p_status,
    approved = (p_status = 'approved'),
    updated_at = now()
  WHERE id = p_product_id
    AND approval_status = 'pending'
  RETURNING * INTO v_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product was not pending or could not be updated';
  END IF;

  RETURN jsonb_build_object(
    'id', v_product.id,
    'approval_status', v_product.approval_status,
    'approved', v_product.approved
  );
END;
$$;

REVOKE ALL ON FUNCTION public.leogo_moderate_product_v2(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leogo_moderate_product_v2(uuid,text) TO authenticated;
