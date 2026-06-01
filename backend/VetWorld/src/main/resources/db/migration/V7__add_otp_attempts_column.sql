-- =============================================================================
-- V7 - Track failed verification attempts per OTP token
-- =============================================================================

ALTER TABLE otp_tokens
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
