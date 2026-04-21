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
    imageUrl?: string;
    projectKey?: string;
    soldOut?: boolean;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    category: Category;
    topSelling: boolean;
    soldOut?: boolean;
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
    productKey?: string;
    productImage: string;
    typeId: number;
    typeName: string;
    unitPrice: number;
    quantity: number;
}

// ─── Order Types ───────────────────────────────────────────

export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'PACKED'
    | 'DELIVERED'
    | 'CANCELLED';

export interface OrderItem {
    id: number;
    productId: number;
    typeId: number;
    productName: string;
    typeName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

export interface Order {
    id: number;
    orderNumber: string;
    userId: number;
    userEmail: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    status: OrderStatus;
    totalAmount: number;
    payherePaymentId?: string;
    deliveryDate?: string;
    cancellationReason?: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface PlaceOrderPayload {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    items: {
        productId: number;
        typeId: number;
        productName: string;
        typeName: string;
        unitPrice: number;
        quantity: number;
    }[];
}

export interface PayHereInitResponse {
    orderId: number;
    orderNumber: string;
    totalAmount: string;
    currency: string;
    merchantId: string;
    hash: string;
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
    totalOrders: number;
    pendingOrders: number;
}
