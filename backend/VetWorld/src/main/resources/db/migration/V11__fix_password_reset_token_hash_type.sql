-- Hibernate expects the password reset token hash column to be CHAR(64).
-- This repair migration converts any existing VARCHAR column to the expected type.

ALTER TABLE password_reset_tokens
    ALTER COLUMN token_hash TYPE char(64)
    USING token_hash::char(64);