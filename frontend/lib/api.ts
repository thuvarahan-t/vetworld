 const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080" ;


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

        if (typeof window !== "undefined" && (res.status === 401 || res.status === 403)) {
            localStorage.removeItem("vetworld_token");
            localStorage.removeItem("vetworld_user");
            window.location.href = "/";
            throw new Error("Session expired or access denied. Please login again as admin.");
        }

        throw new Error(`API error [${res.status}]: ${error}`);
    }

    return res.json() as Promise<T>;
}

/**
 * Authenticated fetcher – attaches the JWT token from localStorage.
 */
export async function authFetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("vetworld_token") : null;

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
    createCategory: (data: { name: string; imageUrl?: string }) =>
        authFetcher<Category>("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
    deleteCategory: (id: number) =>
        authFetcher<void>(`/admin/categories/${id}`, { method: "DELETE" }),

    // Products
    createProduct: (data: {
        name: string;
        description: string;
        imageUrl: string;
        categoryId: number;
        topSelling?: boolean;
        soldOut?: boolean;
        types: { typeName: string; price: number; imageUrl?: string; projectKey?: string; soldOut?: boolean }[];
    }) =>
        authFetcher<Product>("/admin/products", { method: "POST", body: JSON.stringify(data) }),
    updateProduct: (id: number, data: {
        name: string;
        description: string;
        imageUrl: string;
        categoryId: number;
        topSelling?: boolean;
        soldOut?: boolean;
        types: { typeName: string; price: number; imageUrl?: string; projectKey?: string; soldOut?: boolean }[];
    }) =>
        authFetcher<Product>(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteProduct: (id: number) =>
        authFetcher<void>(`/admin/products/${id}`, { method: "DELETE" }),
    toggleTopSelling: (id: number) =>
        authFetcher<Product>(`/admin/products/${id}/top-selling`, { method: "PUT" }),
    toggleSoldOut: (id: number) =>
        authFetcher<Product>(`/admin/products/${id}/sold-out`, { method: "PUT" }),
    toggleTypeSoldOut: (productId: number, typeId: number) =>
        authFetcher<Product>(`/admin/products/${productId}/types/${typeId}/sold-out`, { method: "PUT" }),

    // Banners
    createBanner: (data: { imageUrl: string; redirectLink?: string | null }) =>
        authFetcher<Banner>("/admin/banners", { method: "POST", body: JSON.stringify(data) }),
    deleteBanner: (id: number) =>
        authFetcher<void>(`/admin/banners/${id}`, { method: "DELETE" }),
};
