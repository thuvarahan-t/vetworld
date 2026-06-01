-- Defensive migration for environments where the banners table is missing.
-- The baseline schema already defines this table; keep this migration idempotent
-- so startup can recover cleanly from a partially migrated database.

CREATE TABLE IF NOT EXISTS banners (
    id            BIGSERIAL    PRIMARY KEY,
    image_url     VARCHAR(255) NOT NULL,
    redirect_link VARCHAR(255),
    created_at    TIMESTAMP(6)
);