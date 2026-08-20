-- Migration 006: Expiration index and status constraint update
-- Adds 'expired' to purchased_items.status constraint
-- Adds index on (status, expiry_date) for efficient cron job scanning

-- 1. Drop the existing constraint (if any) and recreate with 'expired' included
ALTER TABLE public.purchased_items
  DROP CONSTRAINT IF EXISTS purchased_items_status_check;

ALTER TABLE public.purchased_items
  ADD CONSTRAINT purchased_items_status_check
  CHECK (status IN ('active', 'expired'));

-- 2. Create a partial index to speed up the expiration cron job query
--    (only active items with a non-null expiry_date are relevant)
CREATE INDEX IF NOT EXISTS idx_purchased_items_expiry
  ON public.purchased_items (expiry_date)
  WHERE status = 'active' AND expiry_date IS NOT NULL;
