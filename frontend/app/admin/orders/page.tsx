"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import type { Order } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Details modal
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Filter
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await adminApi.getOrders();
            setOrders(data);
        } catch (err: any) {
            setError(err.message || "Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            const updated = await adminApi.updateOrder(orderId, { status });
            setOrders(orders.map(o => o.id === orderId ? updated : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(updated);
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        }
    };

    const handleUpdateDeliveryDate = async (orderId: number, date: string) => {
        try {
            const updated = await adminApi.updateOrder(orderId, { deliveryDate: date });
            setOrders(orders.map(o => o.id === orderId ? updated : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(updated);
        } catch (err: any) {
            alert(err.message || "Failed to update date");
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        const reason = prompt("Enter cancellation reason (will be sent to user):");
        if (reason === null) return;
        
        try {
            const updated = await adminApi.cancelOrder(orderId, reason);
            setOrders(orders.map(o => o.id === orderId ? updated : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(updated);
        } catch (err: any) {
            alert(err.message || "Failed to cancel order");
        }
    };

    const handleDownloadReceipt = async (orderId: number, orderNumber: string) => {
        try {
            await adminApi.downloadAdminReceipt(orderId, orderNumber);
        } catch (err) {
            alert("Failed to download receipt");
        }
    };

    const filteredOrders = orders.filter(o => filter === "ALL" || o.status === filter);

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                        Orders Management
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage customer orders, statuses, and deliveries</p>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {['ALL', 'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'PACKED', 'DELIVERED', 'CANCELLED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "var(--radius-sm)",
                                background: filter === f ? "var(--vet-blue)" : "var(--surface)",
                                color: filter === f ? "white" : "var(--text-secondary)",
                                border: filter === f ? "none" : "1px solid var(--border)",
                                fontWeight: 500, fontSize: "0.85rem", cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div>Loading orders...</div>
            ) : error ? (
                <div style={{ color: "red" }}>{error}</div>
            ) : (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                                <th style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Order #</th>
                                <th style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Date</th>
                                <th style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Customer</th>
                                <th style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Amount</th>
                                <th style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Status</th>
                                <th style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "1rem", fontWeight: 600 }}>{order.orderNumber}</td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{order.userEmail}</div>
                                    </td>
                                    <td style={{ padding: "1rem", fontWeight: 600 }}>Rs. {order.totalAmount.toLocaleString()}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{
                                            padding: "0.25rem 0.5rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                                            background: order.status === 'DELIVERED' ? "#dcfce7" : order.status === 'CANCELLED' ? "#fee2e2" : order.status === 'PENDING_PAYMENT' ? "#ffedd5" : "#e0e7ff",
                                            color: order.status === 'DELIVERED' ? "#166534" : order.status === 'CANCELLED' ? "#991b1b" : order.status === 'PENDING_PAYMENT' ? "#9a3412" : "#3730a3"
                                        }}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            style={{ padding: "0.4rem 0.8rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--vet-blue)" }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
                            style={{
                                position: "fixed", top: 0, right: 0, bottom: 0, width: "min(500px, 100vw)",
                                background: "var(--surface)", zIndex: 1001, boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
                                display: "flex", flexDirection: "column"
                            }}
                        >
                            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Order Details: {selectedOrder.orderNumber}</h2>
                                <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                
                                {/* Status Management */}
                                <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "1rem", textTransform: "uppercase" }}>Update Status</h3>
                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                        {['CONFIRMED', 'PROCESSING', 'PACKED', 'DELIVERED'].map(s => (
                                            <button
                                                key={s}
                                                disabled={selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'PENDING_PAYMENT'}
                                                onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                style={{
                                                    padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer",
                                                    background: selectedOrder.status === s ? "var(--vet-green)" : "var(--surface)",
                                                    color: selectedOrder.status === s ? "white" : "var(--text-primary)",
                                                    border: selectedOrder.status === s ? "none" : "1px solid var(--border)",
                                                    opacity: (selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'PENDING_PAYMENT') ? 0.5 : 1
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                                            <button 
                                                onClick={() => handleCancelOrder(selectedOrder.id)}
                                                style={{ padding: "0.5rem 1rem", background: "transparent", color: "rgb(239, 68, 68)", border: "1px solid rgb(239, 68, 68)", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                                            >
                                                Cancel Order...
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Delivery Date */}
                                <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Delivery Date</h3>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Inform user when to expect delivery.</p>
                                    <input 
                                        type="date" 
                                        value={selectedOrder.deliveryDate || ''}
                                        onChange={(e) => handleUpdateDeliveryDate(selectedOrder.id, e.target.value)}
                                        style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", width: "100%", fontFamily: "inherit" }}
                                    />
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Customer</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                                        <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                                        <div><strong>Email:</strong> {selectedOrder.userEmail}</div>
                                        <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                                        <div><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Items</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                                        {selectedOrder.items.map(item => (
                                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{item.typeName} × {item.quantity}</div>
                                                </div>
                                                <div style={{ fontWeight: 600 }}>Rs. {item.lineTotal.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)" }}>
                                <div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Amount</div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--vet-blue)" }}>Rs. {selectedOrder.totalAmount.toLocaleString()}</div>
                                </div>
                                <button 
                                    onClick={() => handleDownloadReceipt(selectedOrder.id, selectedOrder.orderNumber)}
                                    style={{ padding: "0.75rem 1.5rem", background: "var(--vet-blue)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: "pointer" }}
                                >
                                    Download Receipt
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
