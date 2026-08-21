-- Migration 007: RPC create_pending_order with Advisory Lock
-- Solves the TOCTOU Race Condition in the order creation flow.
--
-- Strategy: pg_advisory_xact_lock(hashtext(variant_id)) ensures only ONE
-- transaction at a time can execute the stock check + insert for a given
-- variant. The lock is released automatically when the transaction ends.
-- Other variants are NOT blocked — they run concurrently with zero contention.

CREATE OR REPLACE FUNCTION public.create_pending_order(
  p_user_id       UUID,
  p_variant_id    UUID,
  p_product_id    UUID,
  p_order_code    TEXT,
  p_family_email  TEXT DEFAULT NULL,
  p_price         NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_stock   INTEGER;
  v_pending_orders    INTEGER;
  v_effective_stock   INTEGER;
  v_order_id          UUID;
  v_cutoff            TIMESTAMPTZ;
BEGIN
  -- =========================================================================
  -- 1. ACQUIRE Advisory Lock scoped to this variant_id.
  --    pg_advisory_xact_lock is session-safe and auto-released at tx end.
  --    hashtext() converts the UUID text to a BIGINT key required by the fn.
  -- =========================================================================
  PERFORM pg_advisory_xact_lock(hashtext(p_variant_id::text));

  -- =========================================================================
  -- 2. CHECK STOCK: count AVAILABLE inventory rows for this variant.
  -- =========================================================================
  SELECT COUNT(*)
  INTO v_available_stock
  FROM public.inventory
  WHERE variant_id = p_variant_id
    AND status = 'AVAILABLE';

  -- =========================================================================
  -- 3. CHECK PENDING RESERVATIONS: count PENDING orders in the last 15 minutes
  --    that are holding a slot for this same variant.
  -- =========================================================================
  v_cutoff := NOW() - INTERVAL '15 minutes';

  SELECT COUNT(*)
  INTO v_pending_orders
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.variant_id = p_variant_id
    AND o.status = 'PENDING'
    AND o.created_at > v_cutoff;

  -- =========================================================================
  -- 4. EFFECTIVE STOCK = available - already-reserved pending slots.
  --    If <= 0, reject immediately.
  -- =========================================================================
  v_effective_stock := v_available_stock - v_pending_orders;

  IF v_effective_stock <= 0 THEN
    RAISE EXCEPTION 'OUT_OF_STOCK'
      USING HINT = 'No available inventory after accounting for pending orders';
  END IF;

  -- =========================================================================
  -- 5. SAFE ZONE: Insert the new PENDING order atomically.
  --    Both inserts are inside the same transaction — if either fails,
  --    the entire operation rolls back automatically.
  -- =========================================================================
  INSERT INTO public.orders (
    user_id,
    status,
    order_code,
    family_email_capture,
    total_price
  )
  VALUES (
    p_user_id,
    'PENDING',
    p_order_code,
    p_family_email,
    p_price
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    variant_id,
    product_id,
    price
  )
  VALUES (
    v_order_id,
    p_variant_id,
    p_product_id,
    p_price
  );

  -- =========================================================================
  -- 6. Return the newly created order_id to the Node.js caller.
  -- =========================================================================
  RETURN json_build_object(
    'success',          true,
    'order_id',         v_order_id,
    'effective_stock',  v_effective_stock
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise so Supabase JS client receives the error message/hint
    RAISE;
END;
$$;
