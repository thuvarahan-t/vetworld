package com.vetworld.VetWorld.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once at startup to ensure the orders.status check constraint
 * includes all current OrderStatus enum values.
 *
 * Hibernate's ddl-auto=update cannot modify existing CHECK constraints,
 * so we handle it here programmatically.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseConstraintMigration {

    private final JdbcTemplate jdbc;

    @PostConstruct
    public void fixOrderStatusConstraint() {
        try {
            // 1. Find the exact constraint name dynamically (handles any naming)
            String findSql = """
                SELECT conname
                FROM pg_constraint
                JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
                WHERE pg_class.relname = 'orders'
                  AND contype = 'c'
                  AND conname LIKE '%status%'
                LIMIT 1
                """;

            var constraintNames = jdbc.queryForList(findSql, String.class);

            // 2. Drop the old constraint (if it exists)
            if (!constraintNames.isEmpty()) {
                String constraintName = constraintNames.get(0);

                // Check if PAYMENT_REVIEW is already allowed — skip if so
                String checkSql = """
                    SELECT pg_get_constraintdef(oid)
                    FROM pg_constraint
                    WHERE conname = ?
                    """;
                String definition = jdbc.queryForObject(checkSql, String.class, constraintName);

                if (definition != null && definition.contains("REFUNDED")) {
                    log.info("[DB Migration] orders.status constraint already up-to-date (includes REFUNDED). Skipping.");
                    return;
                }

                log.info("[DB Migration] Dropping old constraint: {}", constraintName);
                jdbc.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS \"" + constraintName + "\"");
            }

            // 3. Add the updated constraint with all statuses
            log.info("[DB Migration] Adding updated orders.status constraint with REFUNDED...");
            jdbc.execute("""
                ALTER TABLE orders
                ADD CONSTRAINT orders_status_check
                CHECK (status IN (
                    'PENDING_PAYMENT',
                    'PAYMENT_REVIEW',
                    'CONFIRMED',
                    'PROCESSING',
                    'PACKED',
                    'DELIVERED',
                    'CANCELLED',
                    'REFUNDED'
                ))
                """);

            log.info("[DB Migration] orders.status constraint updated successfully.");

        } catch (Exception e) {
            // Non-fatal — log the error but don't crash the app
            log.error("[DB Migration] Failed to update orders.status constraint: {}", e.getMessage());
        }
    }
}
