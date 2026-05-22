-- 005_add_missing_fields.sql
-- Migration to add missing fields from TDD v4.0

-- 1. Update products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slug from name for existing products
UPDATE public.products 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) 
WHERE slug IS NULL;

-- Ensure slugs are unique by appending part of UUID if duplicates exist
UPDATE public.products 
SET slug = slug || '-' || substring(id::text from 1 for 8) 
WHERE slug IN (
    SELECT slug FROM public.products GROUP BY slug HAVING count(*) > 1
);

-- Apply NOT NULL and UNIQUE constraints
ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;
ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'coming_soon'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS avg_rating NUMERIC DEFAULT 0;


-- 2. Update product_variants table
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;
ALTER TABLE public.product_variants ALTER COLUMN duration_days SET NOT NULL;

ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_type_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_type_check CHECK (type IN ('account', 'family'));


-- 3. Update orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN total_price SET NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payos_id TEXT;


-- 4. Update purchased_items table
ALTER TABLE public.purchased_items ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.purchased_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.purchased_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';


-- 5. Update fulfill_order_transaction RPC to populate purchased_items with correct expiry_date, variant_id, and status
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

    -- 5. Insert into purchased_items (deliver account to user with variant_id, expiry_date, status)
    INSERT INTO public.purchased_items (order_id, user_id, email, pass, link, variant_id, expiry_date, status)
    SELECT 
        p_order_id, 
        o.user_id, 
        v_inventory.email, 
        v_inventory.pass, 
        v_inventory.link, 
        v_order.variant_id,
        NOW() + (pv.duration_days || ' days')::INTERVAL,
        'active'
    FROM public.orders o 
    JOIN public.product_variants pv ON pv.id = v_order.variant_id
    WHERE o.id = p_order_id;

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
