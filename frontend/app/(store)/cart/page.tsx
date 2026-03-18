"use client";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
    const { items, updateQty, removeItem, totalItems, totalPrice, clearCart } = useCartStore();
    const total = totalItems();
    const grandTotal = totalPrice();

    const handleWhatsAppOrder = () => {
        const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94773300802";

        let message = "Hello VetWorld,\nI would like to order the following items:\n\n";
        items.forEach((item, i) => {
            message += `${i + 1}. ${item.productName}\n`;
            if (item.productKey) {
                message += `   Product Key: ${item.productKey}\n`;
            }
            message += `   Type: ${item.typeName}\n`;
            message += `   Quantity: ${item.quantity}\n`;
            message += `   Price: Rs.${item.unitPrice.toLocaleString()}\n`;
            message += `   Total: Rs.${(item.unitPrice * item.quantity).toLocaleString()}\n\n`;
        });
        message += `Total Order Price: Rs.${grandTotal.toLocaleString()}\n`;
        message += "Please confirm availability.";

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    };

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

                    <button onClick={handleWhatsAppOrder} className="btn-green" style={{ width: "100%", justifyContent: "center", fontSize: "0.95rem", padding: "0.8rem" }}>
                        <WhatsAppIcon /> Order via WhatsApp
                    </button>

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

function WhatsAppIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.176a.5.5 0 0 0 .611.611l5.308-1.47A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.687-.525-5.21-1.44l-.374-.222-3.881 1.075 1.075-3.88-.222-.374A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
    );
}
