-- =============================================================================
-- V5 — Add is_sold_out columns to products and product_types
--
-- These columns are already in the V1 baseline schema, but this migration
-- ensures compatibility with existing databases that may be missing them.
-- =============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE product_types ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT FALSE;
