-- 003_fulfill_order_transaction.sql
-- ACID Transaction RPC function for auto-fulfillment
-- Called by webhook handler after payment confirmed

CREATE OR REPLACE FUNCTION public.fulfill_order_transaction(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order       RECORD;
    v_variant_id  UUID;
    v_inventory   RECORD;
    v_result      JSON;
BEGIN
    -- 1. Get the order and its variant_id
    SELECT o.id, o.status, oi.variant_id
    INTO v_order
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = p_order_id
    LIMIT 1;

    -- Safety check: only fulfill PAID orders
    IF v_order.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_order.status != 'PAID' THEN
        RETURN json_build_object('success', false, 'error', 'Order is not in PAID status');
    END IF;

    -- 2. SELECT FOR UPDATE — lock one AVAILABLE inventory row to prevent race conditions
    SELECT id, email, pass, link
    INTO v_inventory
    FROM public.inventory
    WHERE variant_id = v_order.variant_id
      AND status = 'AVAILABLE'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- 3. Check stock
    IF v_inventory.id IS NULL THEN
        -- Out of stock: keep order as PAID, caller will notify via Telegram
        RETURN json_build_object('success', false, 'error', 'OUT_OF_STOCK');
    END IF;

    -- 4. Mark inventory as SOLD
    UPDATE public.inventory
    SET status = 'SOLD'
    WHERE id = v_inventory.id;

    -- 5. Insert into purchased_items (deliver account to user)
    INSERT INTO public.purchased_items (order_id, user_id, email, pass, link)
    SELECT p_order_id, o.user_id, v_inventory.email, v_inventory.pass, v_inventory.link
    FROM public.orders o WHERE o.id = p_order_id;

    -- 6. Update order status to FULFILLED
    UPDATE public.orders
    SET status = 'FULFILLED', updated_at = NOW()
    WHERE id = p_order_id;

    RETURN json_build_object(
        'success', true,
        'inventory_id', v_inventory.id,
        'email', v_inventory.email
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Automatic ROLLBACK on exception
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
