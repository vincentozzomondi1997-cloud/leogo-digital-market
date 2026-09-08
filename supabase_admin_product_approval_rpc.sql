-- LEOGO: Secure admin/staff product approval RPC
-- Uses the already-verified LEOGO admin helper for authorization.
-- Run this once in Supabase SQL Editor.
-- This does NOT modify existing seller/customer pages.

CREATE OR REPLACE FUNCTION public.leogo_moderate_product(
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
BEGIN
  -- The helper has already been verified from the authenticated browser
  -- session to recognize the current LEOGO administrator.
  IF NOT public.leogo_is_product_admin() THEN
    RAISE EXCEPTION 'Not authorized for product moderation';
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

REVOKE ALL ON FUNCTION public.leogo_moderate_product(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leogo_moderate_product(uuid,text) TO authenticated;
