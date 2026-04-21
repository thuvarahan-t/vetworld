"use client";

import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import type { Order } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await userApi.getMyOrders();
                setOrders(data);
            } catch (err: any) {
                setError(err.message || "Failed to load orders");
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleDownloadReceipt = async (orderId: number) => {
        try {
            await userApi.downloadReceipt(orderId);
        } catch (err) {
            alert("Failed to download receipt");
        }
    };

    if (isLoading) {
        return <div className="container-main section" style={{ textAlign: "center", padding: "4rem" }}>Loading orders...</div>;
    }

    if (error) {
        return <div className="container-main section" style={{ color: "red", textAlign: "center" }}>{error}</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="container-main section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>No Orders Yet</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>You haven't placed any orders yet.</p>
                <Link href="/category/all" className="btn-primary">Browse Products</Link>
            </div>
        );
    }

    return (
        <main className="container-main section">
            <h1 className="section-title">My Orders</h1>
            <p className="section-subtitle">Track and manage your past purchases</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {orders.map((order, idx) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="card" style={{ padding: "1.5rem" }}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                            <div>
                                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--vet-blue)", marginBottom: "0.25rem" }}>
                                    {order.orderNumber}
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>Rs. {order.totalAmount.toLocaleString()}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{order.items.length} items</div>
                            </div>
                        </div>

                        {/* Tracker / Status */}
                        {order.status === 'CANCELLED' ? (
                            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }}>
                                <div style={{ color: "rgb(220, 38, 38)", fontWeight: 700, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    ✕ Order Cancelled
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                    Your order has been closed. If a payment was made, a refund will be processed shortly.
                                </p>
                                {order.cancellationReason && (
                                    <div style={{ background: "#fff", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", borderLeft: "3px solid rgb(239, 68, 68)" }}>
                                        <strong>Reason:</strong> {order.cancellationReason}
                                    </div>
                                )}
                            </div>
                        ) : order.status === 'PENDING_PAYMENT' ? (
                            <div style={{ background: "var(--vet-orange-light)", color: "var(--vet-orange)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem", fontWeight: 600 }}>
                                ⚠️ Payment Pending — Complete your payment to confirm the order.
                            </div>
                        ) : (
                            <div style={{ marginBottom: "2rem" }}>
                                <OrderTracker status={order.status} />
                                {order.deliveryDate && order.status !== 'DELIVERED' && (
                                    <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "var(--vet-blue)", fontWeight: 500 }}>
                                        Expected Delivery: {new Date(order.deliveryDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action + Details */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                <strong>Delivery to:</strong> {order.deliveryAddress}
                            </div>
                            <button
                                onClick={() => handleDownloadReceipt(order.id)}
                                className="btn-secondary"
                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                            >
                                📄 Download Receipt
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </main>
    );
}

// ─── Status Tracker Component ─────────────────────────────────

function OrderTracker({ status }: { status: string }) {
    const steps = [
        { key: 'CONFIRMED', label: 'Confirmed' },
        { key: 'PROCESSING', label: 'Processing' },
        { key: 'PACKED', label: 'Packed' },
        { key: 'DELIVERED', label: 'Delivered' }
    ];

    const currentIdx = steps.findIndex(s => s.key === status);
    const validIdx = currentIdx >= 0 ? currentIdx : 0; // fallback if status maps weirdly

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", maxWidth: 500, margin: "0 auto" }}>
            {/* Background track line */}
            <div style={{ position: "absolute", top: 15, left: 15, right: 15, height: 3, background: "var(--border)", zIndex: 0 }} />
            
            {/* Active track line */}
            <div style={{ position: "absolute", top: 15, left: 15, height: 3, width: `${(validIdx / (steps.length - 1)) * 100}%`, background: "var(--vet-green)", zIndex: 1, transition: "width 0.5s ease" }} />

            {steps.map((step, idx) => {
                const isCompleted = idx <= validIdx;
                const isActive = idx === validIdx;

                return (
                    <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, gap: "0.5rem" }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: isCompleted ? "var(--vet-green)" : "var(--surface)",
                            border: isCompleted ? "2px solid var(--vet-green)" : "2px solid var(--border)",
                            color: isCompleted ? "white" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1rem", transition: "all 0.3s ease"
                        }}>
                            {isCompleted && "✓"}
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                            {step.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
