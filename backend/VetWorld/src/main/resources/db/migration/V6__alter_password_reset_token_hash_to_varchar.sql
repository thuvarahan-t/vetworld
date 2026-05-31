-- V6 — Alter password_reset_tokens.token_hash to varchar(64)
-- Use USING to cast existing values safely
ALTER TABLE password_reset_tokens
    ALTER COLUMN token_hash TYPE varchar(64)
    USING token_hash::varchar;
