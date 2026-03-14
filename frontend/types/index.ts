// ─── Domain Types ──────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
    imageUrl: string;
    createdAt?: string;
}

export interface ProductType {
    id: number;
    typeName: string;
    price: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    category: Category;
    topSelling: boolean;
    createdAt?: string;
    types: ProductType[];
}

export interface Banner {
    id: number;
    imageUrl: string;
    redirectLink: string;
    createdAt?: string;
}

// ─── Cart Types ────────────────────────────────────────────

export interface CartItem {
    productId: number;
    productName: string;
    productImage: string;
    typeId: number;
    typeName: string;
    unitPrice: number;
    quantity: number;
}

// ─── API Response Types ────────────────────────────────────

export interface ApiError {
    status: number;
    message: string;
}

// ─── Admin Types ───────────────────────────────────────────

export interface AdminStats {
    totalProducts: number;
    totalCategories: number;
    totalBanners: number;
    topSellingCount: number;
    totalUsers: number;
}
