const SERVER_API_BASE_URL =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

const DEFAULT_FETCH_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS || 30000); // 30s for Render cold start

function getApiBaseUrl() {
    // Browser requests should go through Next.js rewrite (/api -> backend)
    // to avoid direct cross-origin CORS issues.
    return typeof window === "undefined" ? SERVER_API_BASE_URL : "";
}


/**
 * Generic fetcher utility for all API calls to the Spring Boot backend.
 * Uses cookie-based authentication (credentials: 'include').
 */
export async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const API_BASE_URL = getApiBaseUrl();
    const url = `${API_BASE_URL}/api${endpoint}`;

    const timeoutController = new AbortController();
    const timeoutMs = DEFAULT_FETCH_TIMEOUT_MS > 0 ? DEFAULT_FETCH_TIMEOUT_MS : 10000;

    const timeoutId = setTimeout(() => {
        timeoutController.abort();
    }, timeoutMs);

    let removeAbortListener: (() => void) | undefined;

    if (options?.signal) {
        const forwardAbort = () => timeoutController.abort();
        if (options.signal.aborted) {
            timeoutController.abort();
        } else {
            options.signal.addEventListener("abort", forwardAbort, { once: true });
            removeAbortListener = () => options.signal?.removeEventListener("abort", forwardAbort);
        }
    }

    const { signal: _ignoredSignal, ...requestOptions } = options || {};

    // CSRF protection relies on the SameSite=Strict auth cookie (vetworld_token):
    // a cross-site forged request cannot carry it, so it lands unauthenticated and
    // is rejected. No anti-CSRF header is needed for this stateless JWT-cookie setup.
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    new Headers(requestOptions.headers).forEach((value, key) => {
        headers[key] = value;
    });

    let res: Response;

    try {
        res = await fetch(url, {
            ...requestOptions,
            credentials: "include", // Send cookies with every request
            signal: timeoutController.signal,
            headers,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Request timed out after ${timeoutMs}ms for ${endpoint}`);
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
        removeAbortListener?.();
    }

    if (!res.ok) {
        const error = await res.text();

        if (typeof window !== "undefined" && (res.status === 401 || res.status === 403)) {
            // Auth failed: clear the cookie AND the client-side login signal so the
            // app doesn't get stuck in a half-logged-in loop (vetworld_user present
            // but no valid token). Always send the user home, where the login modal
            // lives — /admin has no login page of its own and would just loop.
            await clearAuthCookies();
            localStorage.removeItem("vetworld_user");
            window.location.href = "/";
            throw new Error("Session expired. Please log in again.");
        }

        throw new Error(`API error [${res.status}]: ${error}`);
    }

    return res.json() as Promise<T>;
}

/**
 * Clear authentication cookies by calling the backend logout endpoint
 */
async function clearAuthCookies(): Promise<void> {
    try {
        await fetch("/api/auth/set-token", { method: "DELETE" });
    } catch (e) {
        // Silently fail if logout route doesn't respond
        console.error("Failed to clear auth cookies:", e);
    }
}

/**
 * Authenticated fetcher – relies on HttpOnly cookie for authentication.
 * No need to attach Authorization header; credentials: 'include' handles it.
 */
export async function authFetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetcher<T>(endpoint, options);
}

// ─── Typed API helpers ──────────────────────────────────────────

import type { Category, Product, Banner, AdminStats, Order, PlaceOrderPayload, PayHereInitResponse } from "@/types";

type SpringPage<T> = {
    content: T[];
};

// Public catalog data changes rarely — cache it (ISR) so navigations are served
// instantly from Next's data/route cache instead of waiting on the backend.
// Tune with PUBLIC_REVALIDATE_SECONDS; admin mutations should call revalidate as needed.
const PUBLIC_CACHE: RequestInit = {
    next: {
        revalidate: Number(process.env.PUBLIC_REVALIDATE_SECONDS || 300),
        tags: ["catalog"],
    },
} as RequestInit;

/**
 * Purge the cached storefront catalog so admin edits appear immediately.
 * Fire-and-forget: hits a Next route handler that calls revalidateTag("catalog").
 */
function revalidateCatalog(): void {
    if (typeof window === "undefined") return;
    fetch("/api/revalidate", { method: "POST", credentials: "include" }).catch((e) => {
        console.error("Failed to revalidate catalog cache:", e);
    });
}

/** Await a mutation, then purge the catalog cache so the storefront reflects it at once. */
async function withRevalidate<T>(p: Promise<T>): Promise<T> {
    const result = await p;
    revalidateCatalog();
    return result;
}

// Public
export const api = {
    getCategories: () => fetcher<Category[]>("/categories", PUBLIC_CACHE),
    getCategory: (id: number) => fetcher<Category>(`/categories/${id}`, PUBLIC_CACHE),
    getCategoryProducts: (id: number) => fetcher<Product[]>(`/categories/${id}/products`, PUBLIC_CACHE),
    getProducts: (params?: string) => fetcher<Product[]>(`/products${params ? `?${params}` : ""}`, PUBLIC_CACHE),
    getProduct: (id: number) => fetcher<Product>(`/products/${id}`, PUBLIC_CACHE),
    getBanners: () => fetcher<Banner[]>("/banners", PUBLIC_CACHE),
};

// User — order & payment APIs (require JWT)
export const userApi = {
    placeOrder: (data: PlaceOrderPayload) =>
        authFetcher<PayHereInitResponse>("/orders", { method: "POST", body: JSON.stringify(data) }),

    getMyOrders: () => authFetcher<Order[]>("/orders/my"),

    uploadPaymentSlip: (orderId: number, paymentSlipUrl: string) =>
        authFetcher<Order>(`/orders/${orderId}/payment-slip`, {
            method: 'PUT',
            body: JSON.stringify({ paymentSlipUrl }),
        }),

    submitBankDetails: (orderId: number, bankDetails: string) =>
        authFetcher<Order>(`/orders/${orderId}/bank-details`, {
            method: 'PUT',
            body: JSON.stringify({ bankDetails }),
        }),

    getMe: () =>
        authFetcher<{ name: string; email: string; role: string; phone?: string; address?: string }>("/auth/me"),

    updateProfile: (data: { name: string; phone: string; address: string }) =>
        authFetcher<any>("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),

    downloadReceipt: async (orderId: number): Promise<void> => {
        const API_BASE_URL = getApiBaseUrl();
        const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/receipt`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to download receipt");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `VetWorld-Receipt-${orderId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    },
};

// Admin
export const adminApi = {
    login: (credentials: { username: string; password: string }) =>
        fetcher<{ token: string }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: credentials.username, password: credentials.password }),
        }),
    getStats: () => authFetcher<AdminStats>("/admin/stats"),

    // Categories
    createCategory: (data: { name: string; imageUrl?: string }) =>
        withRevalidate(authFetcher<Category>("/admin/categories", { method: "POST", body: JSON.stringify(data) })),
    deleteCategory: (id: number) =>
        withRevalidate(authFetcher<void>(`/admin/categories/${id}`, { method: "DELETE" })),

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
        withRevalidate(authFetcher<Product>("/admin/products", { method: "POST", body: JSON.stringify(data) })),
    updateProduct: (id: number, data: {
        name: string;
        description: string;
        imageUrl: string;
        categoryId: number;
        topSelling?: boolean;
        soldOut?: boolean;
        types: { typeName: string; price: number; imageUrl?: string; projectKey?: string; soldOut?: boolean }[];
    }) =>
        withRevalidate(authFetcher<Product>(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) })),
    deleteProduct: (id: number) =>
        withRevalidate(authFetcher<void>(`/admin/products/${id}`, { method: "DELETE" })),
    toggleTopSelling: (id: number) =>
        withRevalidate(authFetcher<Product>(`/admin/products/${id}/top-selling`, { method: "PUT" })),
    toggleSoldOut: (id: number) =>
        withRevalidate(authFetcher<Product>(`/admin/products/${id}/sold-out`, { method: "PUT" })),
    toggleTypeSoldOut: (productId: number, typeId: number) =>
        withRevalidate(authFetcher<Product>(`/admin/products/${productId}/types/${typeId}/sold-out`, { method: "PUT" })),

    // Banners
    createBanner: (data: { imageUrl: string; redirectLink?: string | null }) =>
        withRevalidate(authFetcher<Banner>("/admin/banners", { method: "POST", body: JSON.stringify(data) })),
    deleteBanner: (id: number) =>
        withRevalidate(authFetcher<void>(`/admin/banners/${id}`, { method: "DELETE" })),

    // Orders
    getOrders: async () => (await authFetcher<SpringPage<Order>>("/admin/orders")).content,
    getOrder: (id: number) => authFetcher<Order>(`/admin/orders/${id}`),
    updateOrder: (id: number, data: { status?: string; deliveryDate?: string; }) =>
        authFetcher<Order>(`/admin/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    cancelOrder: (id: number, reason: string) =>
        authFetcher<Order>(`/admin/orders/${id}/cancel`, { method: "PUT", body: JSON.stringify({ reason }) }),

    approvePaymentSlip: (orderId: number) =>
        authFetcher<Order>(`/admin/orders/${orderId}/approve-slip`, { method: 'PUT' }),

    rejectPaymentSlip: (orderId: number, reason: string) =>
        authFetcher<Order>(`/admin/orders/${orderId}/reject-slip`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        }),

    processRefund: (orderId: number, refundReceiptUrl: string) =>
        authFetcher<Order>(`/admin/orders/${orderId}/refund`, {
            method: 'PUT',
            body: JSON.stringify({ refundReceiptUrl }),
        }),

    downloadAdminReceipt: async (orderId: number, orderNumber: string): Promise<void> => {
        const API_BASE_URL = getApiBaseUrl();
        const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/receipt`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to download receipt");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `VetWorld-Receipt-${orderNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    },
};
