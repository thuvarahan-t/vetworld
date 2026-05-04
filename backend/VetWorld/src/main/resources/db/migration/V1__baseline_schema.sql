-- =============================================================================
-- V1 — Baseline schema
--
-- Captures the full schema that Hibernate created via ddl-auto=update.
-- Every statement uses IF NOT EXISTS so this is completely safe to run
-- against a database that already has the tables (e.g. production on Render).
-- Fresh databases (new environments) get the full schema from this file.
-- =============================================================================

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL    PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    phone               VARCHAR(255),
    address             TEXT,
    role                VARCHAR(255) NOT NULL DEFAULT 'USER',
    reset_token         VARCHAR(255),
    reset_token_expiry  TIMESTAMP(6)
);

-- ── categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    image_url  VARCHAR(255),
    created_at TIMESTAMP(6)
);

-- ── products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    image_url      VARCHAR(255),
    category_id    BIGINT       NOT NULL REFERENCES categories(id),
    is_top_selling BOOLEAN      NOT NULL DEFAULT FALSE,
    is_sold_out    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP(6)
);

-- ── product_types ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_types (
    id          BIGSERIAL      PRIMARY KEY,
    product_id  BIGINT         NOT NULL REFERENCES products(id),
    type_name   VARCHAR(255)   NOT NULL,
    image_url   VARCHAR(1000),
    project_key VARCHAR(120),
    is_sold_out BOOLEAN        NOT NULL DEFAULT FALSE,
    price       NUMERIC(10, 2) NOT NULL
);

-- ── orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                    BIGSERIAL      PRIMARY KEY,
    order_number          VARCHAR(255)   NOT NULL UNIQUE,
    user_id               BIGINT         NOT NULL REFERENCES users(id),
    customer_name         VARCHAR(255)   NOT NULL,
    customer_phone        VARCHAR(255)   NOT NULL,
    delivery_address      TEXT           NOT NULL,
    status                VARCHAR(255)   NOT NULL DEFAULT 'PENDING_PAYMENT',
    total_amount          NUMERIC(12, 2) NOT NULL,
    payhere_payment_id    VARCHAR(255),
    delivery_date         DATE,
    cancellation_reason   TEXT,
    payment_slip_url      TEXT,
    slip_rejection_reason TEXT,
    bank_details          TEXT,
    refund_receipt_url    TEXT,
    created_at            TIMESTAMP(6),
    updated_at            TIMESTAMP(6)
);

-- ── order_items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id           BIGSERIAL      PRIMARY KEY,
    order_id     BIGINT         NOT NULL REFERENCES orders(id),
    product_id   BIGINT,
    type_id      BIGINT,
    product_name VARCHAR(255)   NOT NULL,
    type_name    VARCHAR(255)   NOT NULL,
    unit_price   NUMERIC(12, 2) NOT NULL,
    quantity     INTEGER        NOT NULL,
    line_total   NUMERIC(12, 2) NOT NULL
);

-- ── banners ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
    id            BIGSERIAL    PRIMARY KEY,
    image_url     VARCHAR(255) NOT NULL,
    redirect_link VARCHAR(255),
    created_at    TIMESTAMP(6)
);
