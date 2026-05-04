-- =============================================================================
-- V2 — Add PAYMENT_FAILED and PAYMENT_CANCELLED to orders.status
--
-- Hibernate 6 + PostgreSQL dialect generates a CHECK constraint on any
-- @Enumerated(EnumType.STRING) column listing all valid enum values.
-- The original constraint does not include the two new statuses, so
-- Hibernate would reject inserts of those values at the DB level.
--
-- Strategy:
--   1. Find and drop whatever check constraint exists on orders.status
--      (using the pg_constraint catalog so the name doesn't matter).
--   2. Add a new constraint with the full 10-value list.
-- =============================================================================

DO $$
DECLARE
    v_conname TEXT;
BEGIN
    -- Find any CHECK constraint that covers the 'status' column on 'orders'
    SELECT c.conname
    INTO   v_conname
    FROM   pg_constraint c
    JOIN   pg_class      t ON t.oid      = c.conrelid
    JOIN   pg_attribute  a ON a.attrelid = t.oid
                          AND a.attnum   = ANY(c.conkey)
    WHERE  t.relname  = 'orders'
      AND  a.attname  = 'status'
      AND  c.contype  = 'c'          -- 'c' = check constraint
    LIMIT 1;

    IF v_conname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', v_conname);
        RAISE NOTICE 'Dropped old status check constraint: %', v_conname;
    ELSE
        RAISE NOTICE 'No existing status check constraint found — skipping drop.';
    END IF;
END $$;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'PENDING_PAYMENT',
        'PAYMENT_FAILED',
        'PAYMENT_CANCELLED',
        'PAYMENT_REVIEW',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED'
    ));
