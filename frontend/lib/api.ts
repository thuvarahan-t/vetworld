const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Generic fetcher utility for all API calls to the Spring Boot backend.
 */
export async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`API error [${res.status}]: ${error}`);
    }

    return res.json() as Promise<T>;
}

/**
 * Authenticated fetcher – attaches the JWT token from localStorage.
 */
export async function authFetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("vetworld-admin-token") : null;

    return fetcher<T>(endpoint, {
        ...options,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
    });
}

// ─── Typed API helpers ──────────────────────────────────────

import type { Category, Product, Banner, AdminStats } from "@/types";

// Public
export const api = {
    getCategories: () => fetcher<Category[]>("/categories"),
    getCategory: (id: number) => fetcher<Category>(`/categories/${id}`),
    getCategoryProducts: (id: number) => fetcher<Product[]>(`/categories/${id}/products`),
    getProducts: (params?: string) => fetcher<Product[]>(`/products${params ? `?${params}` : ""}`),
    getProduct: (id: number) => fetcher<Product>(`/products/${id}`),
    getBanners: () => fetcher<Banner[]>("/banners"),
};

// Admin
export const adminApi = {
    login: (credentials: { username: string; password: string }) =>
        fetcher<{ token: string }>("/admin/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        }),
    getStats: () => authFetcher<AdminStats>("/admin/stats"),

    // Categories
    createCategory: (data: FormData) =>
        authFetcher<Category>("/admin/categories", { method: "POST", body: data, headers: {} }),
    deleteCategory: (id: number) =>
        authFetcher<void>(`/admin/categories/${id}`, { method: "DELETE" }),

    // Products
    createProduct: (data: FormData) =>
        authFetcher<Product>("/admin/products", { method: "POST", body: data, headers: {} }),
    updateProduct: (id: number, data: FormData) =>
        authFetcher<Product>(`/admin/products/${id}`, { method: "PUT", body: data, headers: {} }),
    deleteProduct: (id: number) =>
        authFetcher<void>(`/admin/products/${id}`, { method: "DELETE" }),
    toggleTopSelling: (id: number) =>
        authFetcher<Product>(`/admin/products/${id}/top-selling`, { method: "PUT" }),

    // Banners
    createBanner: (data: FormData) =>
        authFetcher<Banner>("/admin/banners", { method: "POST", body: data, headers: {} }),
    deleteBanner: (id: number) =>
        authFetcher<void>(`/admin/banners/${id}`, { method: "DELETE" }),
};
