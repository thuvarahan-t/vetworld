/**
 * Centralized SWR hooks for all Admin data — zero duplicated fetch logic.
 * Uses stale-while-revalidate so tabs feel instant on revisit.
 */
import useSWR, { mutate as globalMutate } from "swr";
import { authFetcher } from "./api";
import type { AdminStats, Order, Product, Category, Banner } from "@/types";

// ── Keys (single source of truth) ────────────────────────────────
export const KEYS = {
    stats:      "/admin/stats",
    orders:     "/admin/orders",
    products:   "/products",           // public — no auth needed
    categories: "/categories",         // public
    users:      "/admin/users",
    banners:    "/banners",            // public
} as const;

// ── Public fetcher (no auth) ─────────────────────────────────────
import { fetcher } from "./api";

// ── Hooks ─────────────────────────────────────────────────────────

/** Dashboard stats — refreshes every 60s */
export function useAdminStats() {
    return useSWR<AdminStats>(KEYS.stats, authFetcher, {
        revalidateOnFocus: false,
        refreshInterval: 60_000,
        dedupingInterval: 30_000,
    });
}

/** All orders — refreshes every 30s (important for PAYMENT_REVIEW) */
export function useAdminOrders() {
    return useSWR<Order[]>(KEYS.orders, authFetcher, {
        revalidateOnFocus: true,
        refreshInterval: 30_000,
        dedupingInterval: 10_000,
    });
}

/** All products with categories — auth needed for admin view (includes sold-out etc) */
export function useAdminProducts() {
    return useSWR<Product[]>(KEYS.products, authFetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30_000,
        errorRetryCount: 2,
        errorRetryInterval: 3_000,
        shouldRetryOnError: true,
    });
}

/** All categories */
export function useAdminCategories() {
    return useSWR<Category[]>(KEYS.categories, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
    });
}

/** All banners */
export function useAdminBanners() {
    return useSWR<Banner[]>(KEYS.banners, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
    });
}

/** All users */
export function useAdminUsers() {
    return useSWR<{ id: number; name: string; email: string; phone: string; role: "USER" | "ADMIN" }[]>(
        KEYS.users,
        authFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30_000,
        }
    );
}

// ── Global mutators (call after mutations for instant UI refresh) ─
export const revalidateOrders    = () => globalMutate(KEYS.orders);
export const revalidateProducts  = () => globalMutate(KEYS.products);
export const revalidateCategories = () => globalMutate(KEYS.categories);
export const revalidateBanners   = () => globalMutate(KEYS.banners);
export const revalidateStats     = () => globalMutate(KEYS.stats);
export const revalidateUsers     = () => globalMutate(KEYS.users);
