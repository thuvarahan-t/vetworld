-- =============================================================================
-- V4 — Move password reset tokens into a dedicated table
--
--   * Store only a SHA-256 hash of the code (char(64) hex), never the plain code.
--   * Track expiry + single-use so codes cannot be replayed.
--   * Drop the old reset columns from the users table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64)     NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Lookups during validation and the per-user rate-limit count
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
    ON password_reset_tokens (expires_at);

-- Old single-token columns are no longer used
ALTER TABLE users DROP COLUMN IF EXISTS reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expiry;
