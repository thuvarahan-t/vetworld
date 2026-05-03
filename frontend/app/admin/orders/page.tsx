"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminOrders, revalidateOrders, revalidateStats } from "@/lib/adminHooks";
import { adminApi } from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";
import type { Order } from "@/types";

const STATUS_FILTERS = ["ALL", "PAYMENT_REVIEW", "PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "PACKED", "DELIVERED", "CANCELLED", "REFUNDED"];

function statusBadgeStyle(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
        PENDING_PAYMENT:  { bg: "#fff3e0", color: "#c2410c" },
        PAYMENT_REVIEW:   { bg: "#eff6ff", color: "#1d4ed8" },
        CONFIRMED:        { bg: "#ecfdf5", color: "#065f46" },
        PROCESSING:       { bg: "#f0fdf4", color: "#15803d" },
        PACKED:           { bg: "#ede9fe", color: "#6d28d9" },
        DELIVERED:        { bg: "#dcfce7", color: "#166534" },
        CANCELLED:        { bg: "#fee2e2", color: "#991b1b" },
        REFUNDED:         { bg: "#e0f2fe", color: "#0369a1" },
    };
    return map[status] || { bg: "#f1f5f9", color: "#475569" };
}

function OrderRowSkeleton() {
    return (
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {[120, 80, 140, 80, 90, 100].map((w, i) => (
                <td key={i} style={{ padding: "1rem" }}>
                    <div style={{ height: "16px", width: `${w}px`, borderRadius: "6px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                </td>
            ))}
        </tr>
    );
}

export default function AdminOrdersPage() {
    const { data: orders = [], error, isLoading, mutate } = useAdminOrders();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filter, setFilter] = useState("ALL");
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [cancelReason, setCancelReason] = useState("");
    const [showCancelInput, setShowCancelInput] = useState(false);

    // Optimistic local update
    const updateLocal = useCallback((updated: Order) => {
        mutate(
            (prev = []) => prev.map(o => o.id === updated.id ? updated : o),
            { revalidate: false }
        );
        setSelectedOrder(updated);
    }, [mutate]);

    const handleUpdateStatus = async (orderId: number, status: string) => {
        if (!selectedOrder) return;
        const originalOrder = { ...selectedOrder };
        const optimisticOrder = { ...selectedOrder, status: status as any };
        
        // Optimistic update immediately
        updateLocal(optimisticOrder);
        
        try {
            setActionLoading(true); setActionError("");
            const updated = await adminApi.updateOrder(orderId, { status });
            updateLocal(updated as Order); // Update with true backend state
            revalidateStats();
        } catch (err: any) { 
            setActionError(err.message || "Failed to update status"); 
            updateLocal(originalOrder); // Revert on failure
        }
        finally { setActionLoading(false); }
    };

    const handleUpdateDeliveryDate = async (orderId: number, date: string) => {
        try {
            const updated = await adminApi.updateOrder(orderId, { deliveryDate: date });
            updateLocal(updated as Order);
        } catch (err: any) { setActionError(err.message || "Failed to update date"); }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason.trim()) return;
        try {
            setActionLoading(true); setActionError("");
            const updated = await adminApi.cancelOrder(selectedOrder.id, cancelReason);
            updateLocal(updated as Order);
            setShowCancelInput(false); setCancelReason("");
            revalidateStats();
        } catch (err: any) { setActionError(err.message || "Failed to cancel"); }
        finally { setActionLoading(false); }
    };

    const handleApproveSlip = async (orderId: number) => {
        try {
            setActionLoading(true); setActionError("");
            const updated = await adminApi.approvePaymentSlip(orderId);
            updateLocal(updated as Order);
            revalidateStats();
        } catch (err: any) { setActionError(err.message || "Failed to approve"); }
        finally { setActionLoading(false); }
    };

    const handleRejectSlip = async (orderId: number) => {
        if (!rejectReason.trim()) { setActionError("Please enter a rejection reason."); return; }
        try {
            setActionLoading(true); setActionError("");
            const updated = await adminApi.rejectPaymentSlip(orderId, rejectReason);
            updateLocal(updated as Order);
            setShowRejectInput(false); setRejectReason("");
        } catch (err: any) { setActionError(err.message || "Failed to reject"); }
        finally { setActionLoading(false); }
    };

    const [refundReceiptUrl, setRefundReceiptUrl] = useState("");
    const [showRefundInput, setShowRefundInput] = useState(false);

    const handleProcessRefund = async () => {
        if (!selectedOrder) return;
        try {
            setActionLoading(true); setActionError("");
            const updated = await adminApi.processRefund(selectedOrder.id, refundReceiptUrl);
            updateLocal(updated as Order);
            setShowRefundInput(false); setRefundReceiptUrl("");
            revalidateStats();
        } catch (err: any) { setActionError(err.message || "Failed to process refund"); }
        finally { setActionLoading(false); }
    };

    const handleDownloadReceipt = async (orderId: number, orderNumber: string) => {
        try { await adminApi.downloadAdminReceipt(orderId, orderNumber); }
        catch { setActionError("Failed to download receipt."); }
    };

    const filteredOrders = orders.filter(o => filter === "ALL" || o.status === filter);
    const reviewCount = orders.filter(o => o.status === "PAYMENT_REVIEW").length;

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
            `}</style>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                        Orders Management
                        {reviewCount > 0 && (
                            <span style={{ marginLeft: "0.75rem", background: "#1d4ed8", color: "white", fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: 999, fontWeight: 700, verticalAlign: "middle" }}>
                                {reviewCount} Needs Review
                            </span>
                        )}
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage customer orders, statuses, and deliveries</p>
                </div>
                <button
                    onClick={() => revalidateOrders()}
                    style={{ padding: "0.5rem 1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {STATUS_FILTERS.map(f => {
                    const active = filter === f;
                    const isReview = f === "PAYMENT_REVIEW";
                    return (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: "0.45rem 0.9rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                            background: active ? (isReview ? "#1d4ed8" : "var(--vet-blue)") : "var(--surface)",
                            color: active ? "white" : (isReview && reviewCount > 0 ? "#1d4ed8" : "var(--text-secondary)"),
                            border: active ? "none" : `1px solid ${isReview && reviewCount > 0 ? "#bfdbfe" : "var(--border)"}`,
                            transition: "all 0.15s",
                        }}>
                            {isReview && reviewCount > 0 ? `🔍 ${f.replace(/_/g, " ")} (${reviewCount})` : f.replace(/_/g, " ")}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div style={{ color: "red", padding: "1rem", background: "#fee2e2", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                    ⚠ {error.message}
                </div>
            )}

            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                            {["Order #", "Date", "Customer", "Amount", "Status", "Actions"].map((h, i) => (
                                <th key={h} style={{ padding: "1rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: i === 5 ? "right" : "left" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, i) => <OrderRowSkeleton key={i} />)
                            : filteredOrders.map(order => {
                                const bs = statusBadgeStyle(order.status);
                                return (
                                    <tr key={order.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "var(--background)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                        <td style={{ padding: "1rem", fontWeight: 700, color: "var(--vet-blue)" }}>{order.orderNumber}</td>
                                        <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{order.userEmail}</div>
                                        </td>
                                        <td style={{ padding: "1rem", fontWeight: 700 }}>Rs. {order.totalAmount.toLocaleString()}</td>
                                        <td style={{ padding: "1rem" }}>
                                            <span style={{ padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, background: bs.bg, color: bs.color }}>
                                                {order.status === "PAYMENT_REVIEW" ? "🔍 " : ""}{order.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right" }}>
                                            <button
                                                onClick={() => { setSelectedOrder(order); setActionError(""); setShowRejectInput(false); setShowCancelInput(false); }}
                                                style={{ padding: "0.4rem 0.9rem", background: "var(--vet-blue-light)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, color: "var(--vet-blue)" }}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                        {!isLoading && filteredOrders.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>No orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Details Drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 }} />

                        <motion.div initial={{ opacity: 0, x: 320 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 320 }}
                            transition={{ type: "spring", damping: 28, stiffness: 280 }}
                            style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)", background: "var(--surface)", zIndex: 1001, display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.15)" }}>

                            {/* Drawer header */}
                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--vet-blue)" }}>{selectedOrder.orderNumber}</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                        {new Date(selectedOrder.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedOrder(null); setShowRefundInput(false); setRefundReceiptUrl(""); }} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1 }}>×</button>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {actionError && (
                                    <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.88rem", fontWeight: 600 }}>
                                        ⚠ {actionError}
                                    </div>
                                )}

                                {/* Payment Slip Review */}
                                {selectedOrder.status === "PAYMENT_REVIEW" && (
                                    <div style={{ border: "2px solid #3b82f6", borderRadius: "var(--radius-md)", padding: "1.25rem", background: "#eff6ff" }}>
                                        <h3 style={{ fontWeight: 800, color: "#1d4ed8", marginBottom: "0.75rem", fontSize: "1rem" }}>🔍 Payment Slip Review</h3>
                                        {selectedOrder.paymentSlipUrl ? (
                                            <div style={{ marginBottom: "1rem" }}>
                                                {selectedOrder.paymentSlipUrl.toLowerCase().endsWith('.pdf') ? (
                                                    <div style={{ padding: "2rem", background: "white", borderRadius: "var(--radius-sm)", border: "1px solid #bfdbfe", textAlign: "center" }}>
                                                        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📄</div>
                                                        <a href={selectedOrder.paymentSlipUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "underline" }}>
                                                            View PDF Payment Slip
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <a href={selectedOrder.paymentSlipUrl} target="_blank" rel="noopener noreferrer">
                                                            <img src={selectedOrder.paymentSlipUrl} alt="Payment slip" style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: "var(--radius-sm)", border: "1px solid #bfdbfe", cursor: "zoom-in" }} />
                                                        </a>
                                                        <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.4rem", textAlign: "center" }}>Click to open full size</p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1rem" }}>No slip image attached.</p>
                                        )}
                                        {!showRejectInput ? (
                                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                                <button onClick={() => handleApproveSlip(selectedOrder.id)} disabled={actionLoading}
                                                    style={{ flex: 1, padding: "0.75rem", background: "var(--vet-green)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", opacity: actionLoading ? 0.7 : 1 }}>
                                                    ✅ Approve & Confirm Order
                                                </button>
                                                <button onClick={() => { setShowRejectInput(true); setActionError(""); }}
                                                    style={{ flex: 1, padding: "0.75rem", background: "white", color: "rgb(220,38,38)", border: "2px solid rgb(220,38,38)", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
                                                    ❌ Reject Slip
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Rejection reason (sent to user):</label>
                                                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                                    placeholder="e.g. Blurry image, wrong account number..."
                                                    rows={3} className="input" style={{ resize: "vertical", marginBottom: "0.75rem" }} />
                                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                                    <button onClick={() => handleRejectSlip(selectedOrder.id)} disabled={actionLoading || !rejectReason.trim()}
                                                        style={{ flex: 1, padding: "0.65rem", background: "rgb(220,38,38)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", opacity: !rejectReason.trim() ? 0.6 : 1 }}>
                                                        {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                                                    </button>
                                                    <button onClick={() => { setShowRejectInput(false); setRejectReason(""); setActionError(""); }}
                                                        style={{ padding: "0.65rem 1rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600 }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status Update */}
                                {!["CANCELLED", "PENDING_PAYMENT", "PAYMENT_REVIEW", "REFUNDED"].includes(selectedOrder.status) && (
                                    <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                                        <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Update Status</h3>
                                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                            {["CONFIRMED", "PROCESSING", "PACKED", "DELIVERED"].map(s => (
                                                <button key={s} onClick={() => handleUpdateStatus(selectedOrder.id, s)} disabled={actionLoading}
                                                    style={{ padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                                        background: selectedOrder.status === s ? "var(--vet-green)" : "var(--surface)",
                                                        color: selectedOrder.status === s ? "white" : "var(--text-primary)",
                                                        border: selectedOrder.status === s ? "none" : "1px solid var(--border)" }}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Date */}
                                {!["CANCELLED", "DELIVERED", "REFUNDED"].includes(selectedOrder.status) && (
                                    <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                                        <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expected Delivery Date</h3>
                                        <input type="date" value={selectedOrder.deliveryDate || ""} onChange={e => handleUpdateDeliveryDate(selectedOrder.id, e.target.value)}
                                            className="input" style={{ fontFamily: "inherit" }} />
                                    </div>
                                )}

                                {/* Customer Info */}
                                <div>
                                    <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "0.75rem" }}>Customer</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.88rem" }}>
                                        <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                                        <div><strong>Email:</strong> {selectedOrder.userEmail}</div>
                                        <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                                        <div><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "0.75rem" }}>Items</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                        {selectedOrder.items.map(item => (
                                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{item.typeName} × {item.quantity} · Rs. {item.unitPrice.toLocaleString()} each</div>
                                                </div>
                                                <div style={{ fontWeight: 700 }}>Rs. {item.lineTotal.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Cancel */}
                                {!["CANCELLED", "REFUNDED"].includes(selectedOrder.status) && (
                                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                                        {!showCancelInput ? (
                                            <button onClick={() => setShowCancelInput(true)}
                                                style={{ padding: "0.6rem 1.2rem", background: "transparent", color: "rgb(220,38,38)", border: "1px solid rgb(220,38,38)", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                                                Cancel Order
                                            </button>
                                        ) : (
                                            <div>
                                                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Cancellation reason:</label>
                                                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2} className="input" style={{ resize: "vertical", marginBottom: "0.5rem" }} />
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button onClick={handleCancelOrder} disabled={actionLoading || !cancelReason.trim()}
                                                        style={{ padding: "0.55rem 1rem", background: "rgb(220,38,38)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", opacity: !cancelReason.trim() ? 0.6 : 1 }}>
                                                        Confirm Cancel
                                                    </button>
                                                    <button onClick={() => { setShowCancelInput(false); setCancelReason(""); }}
                                                        style={{ padding: "0.55rem 1rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600 }}>
                                                        Back
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Process Refund (Only for CANCELLED orders) */}
                                {selectedOrder.status === "CANCELLED" && (
                                    <div style={{ border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                                        <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1d4ed8", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <span>💸</span> Process Refund
                                        </h3>
                                        <p style={{ fontSize: "0.82rem", color: "#3b82f6", marginBottom: "1rem" }}>
                                            Order is cancelled. Process the refund to the user's bank account.
                                        </p>
                                        
                                        {selectedOrder.bankDetails ? (
                                            <div style={{ background: "white", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid #bfdbfe", marginBottom: "1rem" }}>
                                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>User Bank Details Provided</div>
                                                <div style={{ fontSize: "0.88rem", whiteSpace: "pre-wrap", color: "#0f172a" }}>{selectedOrder.bankDetails}</div>
                                            </div>
                                        ) : (
                                            <div style={{ background: "white", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px dashed #94a3b8", marginBottom: "1rem", color: "#64748b", fontSize: "0.85rem" }}>
                                                User has not provided bank details yet.
                                            </div>
                                        )}

                                        {!showRefundInput ? (
                                            <button onClick={() => setShowRefundInput(true)}
                                                style={{ padding: "0.6rem 1.2rem", background: "#2563eb", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                                                Initiate Refund
                                            </button>
                                        ) : (
                                            <div style={{ background: "white", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid #bfdbfe" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: "0.75rem", color: "#1e293b" }}>
                                                    Upload Refund Receipt (Optional but recommended)
                                                </label>
                                                <div style={{ marginBottom: "1rem" }}>
                                                    <ImageUpload value={refundReceiptUrl} onUpload={setRefundReceiptUrl} label="Upload Receipt Image" compact />
                                                </div>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button onClick={handleProcessRefund} disabled={actionLoading}
                                                        style={{ padding: "0.6rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer" }}>
                                                        {actionLoading ? "Processing..." : "Mark as Refunded"}
                                                    </button>
                                                    <button onClick={() => { setShowRefundInput(false); setRefundReceiptUrl(""); }}
                                                        style={{ padding: "0.6rem 1rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600 }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Refunded Info */}
                                {selectedOrder.status === "REFUNDED" && (
                                    <div style={{ border: "1px solid #86efac", background: "#f0fdf4", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                                        <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#166534", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <span>✅</span> Refund Processed
                                        </h3>
                                        <p style={{ fontSize: "0.85rem", color: "#15803d", marginBottom: "1rem" }}>This order has been cancelled and refunded successfully.</p>
                                        {selectedOrder.refundReceiptUrl && (
                                            <div>
                                                <a href={selectedOrder.refundReceiptUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: "0.85rem", color: "#16a34a", fontWeight: 700, textDecoration: "underline" }}>
                                                    View Refund Receipt
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Drawer footer */}
                            <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--background)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Amount</div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--vet-blue)" }}>Rs. {selectedOrder.totalAmount.toLocaleString()}</div>
                                </div>
                                <button onClick={() => handleDownloadReceipt(selectedOrder.id, selectedOrder.orderNumber)}
                                    className="btn-primary" style={{ padding: "0.65rem 1.25rem" }}>
                                    📄 Download Receipt
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
