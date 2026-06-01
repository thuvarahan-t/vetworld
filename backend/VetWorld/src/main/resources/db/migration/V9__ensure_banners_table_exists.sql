-- Idempotent repair migration for databases that already recorded version 8
-- but still ended up without the banners table.

CREATE TABLE IF NOT EXISTS banners (
    id            BIGSERIAL    PRIMARY KEY,
    image_url     VARCHAR(255) NOT NULL,
    redirect_link VARCHAR(255),
    created_at    TIMESTAMP(6)
);