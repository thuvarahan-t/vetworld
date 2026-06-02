// ─── Money helpers ──────────────────────────────────────────
// Cart/checkout totals are summed in JS floating point, which can leave
// sub-cent artifacts (e.g. 1499.9999998 or 1500.0000002). These helpers
// snap every amount to 2 decimals so the UI never shows a drifted price.
//
// NOTE: the amount actually charged is computed on the backend in BigDecimal
// (it re-resolves each price from the DB), so this only cleans up display.

/** Round a rupee amount to 2 decimals, killing IEEE-754 drift. */
export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Format a rupee amount with thousands separators and exactly 2 decimals. */
export function formatMoney(value: number): string {
    return roundMoney(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
