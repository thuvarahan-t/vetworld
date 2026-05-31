-- =============================================================================
-- V3 - Persist signup OTP tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS otp_tokens (
    email      VARCHAR(255) PRIMARY KEY,
    code       VARCHAR(6)   NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires_at
    ON otp_tokens (expires_at);
