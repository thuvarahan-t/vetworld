"use client";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
    const { items, updateQty, removeItem, totalItems, totalPrice, clearCart } = useCartStore();
    const total = totalItems();
    const grandTotal = totalPrice();



    if (items.length === 0) {
        return (
            <main className="container-main" style={{ textAlign: "center", padding: "6rem 2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Your cart is empty</h1>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                    Browse our catalogue and add products to your cart.
                </p>
                <Link href="/category/all" className="btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
                    Browse Products →
                </Link>
            </main>
        );
    }

    return (
        <main className="container-main section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="section-title">🛒 Your Cart</h1>
                    <p className="section-subtitle" style={{ marginBottom: 0 }}>
                        {total} item{total !== 1 ? "s" : ""} in your cart
                    </p>
                </div>
                <button onClick={clearCart} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "0.4rem 0.9rem", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.85rem" }}>
                    Clear All
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "start" }}>
                {/* ── Items List ─────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={`${item.productId}-${item.typeId}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "1.25rem",
                                    display: "flex",
                                    gap: "1.25rem",
                                    alignItems: "center",
                                }}
                            >
                                {/* Image */}
                                <div
                                    style={{ width: 80, height: 80, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--background)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    {item.productImage ? (
                                        <img src={item.productImage} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: "2rem" }}>🧪</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{item.productName}</p>
                                    {item.productKey && (
                                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                                            Product Key: {item.productKey}
                                        </p>
                                    )}
                                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Type: {item.typeName}</p>
                                    <p style={{ fontWeight: 700, color: "var(--vet-blue)" }}>Rs. {item.unitPrice.toLocaleString()} each</p>
                                </div>

                                {/* Qty Controls */}
                                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                                    <button onClick={() => updateQty(item.productId, item.typeId, item.quantity - 1)} style={qtyBtn}>−</button>
                                    <span style={{ padding: "0.4rem 0.75rem", fontWeight: 600, minWidth: 36, textAlign: "center" }}>{item.quantity}</span>
                                    <button onClick={() => updateQty(item.productId, item.typeId, item.quantity + 1)} style={qtyBtn}>+</button>
                                </div>

                                {/* Line Total */}
                                <div style={{ textAlign: "right", minWidth: 100 }}>
                                    <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                                        Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                                    </p>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => removeItem(item.productId, item.typeId)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", padding: "0.25rem" }}
                                    aria-label="Remove"
                                >
                                    ✕
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* ── Order Summary ──────────────── */}
                <div
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "1.5rem",
                        width: 280,
                        position: "sticky",
                        top: 80,
                    }}
                >
                    <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>Order Summary</h2>

                    {items.map((item) => (
                        <div key={`${item.productId}-${item.typeId}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>{item.productName} × {item.quantity}</span>
                            <span style={{ fontWeight: 500 }}>Rs. {(item.unitPrice * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}

                    <div style={{ borderTop: "1px solid var(--border)", margin: "1rem 0", paddingTop: "1rem", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>Total</span>
                        <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--vet-blue)" }}>
                            Rs. {grandTotal.toLocaleString()}
                        </span>
                    </div>

                    <Link href="/checkout" className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "0.95rem", padding: "0.8rem" }}>
                        Proceed to Checkout →
                    </Link>

                    <Link href="/category/all" className="btn-secondary" style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", fontSize: "0.875rem" }}>
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        </main>
    );
}

const qtyBtn: React.CSSProperties = {
    background: "none", border: "none",
    padding: "0.4rem 0.6rem",
    cursor: "pointer", fontSize: "1rem",
    color: "var(--text-primary)",
};
