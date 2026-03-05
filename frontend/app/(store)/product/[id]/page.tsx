"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product, ProductType } from "@/types";

interface Props {
    params: { id: string };
}

export default function ProductDetailPage({ params }: Props) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<ProductType | null>(null);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [flyAnim, setFlyAnim] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number } | null>(null);
    const addItem = useCartStore((s) => s.addItem);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/products/${params.id}`);
                if (!res.ok) throw new Error("Not found");
                const data: Product = await res.json();
                setProduct(data);
                if (data.types?.length) setSelectedType(data.types[0]);
            } catch {
                setProduct(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [params.id]);

    if (loading) return <LoadingState />;
    if (!product) return <NotFound />;

    const handleAddToCart = (e: React.MouseEvent) => {
        if (!selectedType) return;
        addItem({
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            typeId: selectedType.id,
            typeName: selectedType.typeName,
            unitPrice: selectedType.price,
            quantity: qty,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);

        // Animation logic
        const btnRect = e.currentTarget.getBoundingClientRect();
        const cartEl = document.getElementById("nav-cart-icon");
        const cartRect = cartEl?.getBoundingClientRect();

        const endX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 60;
        const endY = cartRect ? cartRect.top + cartRect.height / 2 : 30;

        setFlyAnim({
            id: Date.now(),
            startX: btnRect.left + btnRect.width / 2,
            startY: btnRect.top + btnRect.height / 2,
            endX,
            endY,
        });

        setTimeout(() => setFlyAnim(null), 800);
    };

    return (
        <main className="container-main section">
            {/* Breadcrumb */}
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                <Link href="/" style={{ color: "var(--vet-blue)" }}>Home</Link>
                {" / "}
                <Link href={`/category/${product.category?.id ?? "all"}`} style={{ color: "var(--vet-blue)" }}>
                    {product.category?.name ?? "Products"}
                </Link>
                {" / "}
                {product.name}
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "3rem",
                    alignItems: "start",
                }}
            >
                {/* ── Image ──────────────────────────────── */}
                <div
                    style={{
                        aspectRatio: "1",
                        background: "var(--surface)",
                        borderRadius: "var(--radius-lg)",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1.5rem" }} />
                    ) : (
                        <span style={{ fontSize: "6rem" }}>🧪</span>
                    )}
                </div>

                {/* ── Details ────────────────────────────── */}
                <div>
                    {product.isTopSelling && (
                        <span
                            style={{
                                display: "inline-block", background: "var(--vet-orange)", color: "#fff",
                                fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, marginBottom: "0.75rem",
                            }}
                        >
                            🔥 Top Selling
                        </span>
                    )}

                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                        {product.name}
                    </h1>

                    <span
                        style={{
                            display: "inline-block", background: "var(--vet-blue-light)", color: "var(--vet-blue)",
                            fontSize: "0.8rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, marginBottom: "1rem",
                        }}
                    >
                        {product.category?.name}
                    </span>

                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                        {product.description}
                    </p>

                    {/* Type Selector */}
                    {product.types?.length > 0 && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                                Select Type
                            </label>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {product.types.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedType(t)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "var(--radius-sm)",
                                            border: `2px solid ${selectedType?.id === t.id ? "var(--vet-blue)" : "var(--border)"}`,
                                            background: selectedType?.id === t.id ? "var(--vet-blue-light)" : "var(--surface)",
                                            color: selectedType?.id === t.id ? "var(--vet-blue)" : "var(--text-secondary)",
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {t.typeName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Price */}
                    {selectedType && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--vet-blue)" }}>
                                Rs. {selectedType.price.toLocaleString()}
                            </span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: "0.4rem" }}>/ {selectedType.typeName}</span>
                        </div>
                    )}

                    {/* Qty + Add to Cart */}
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                            <button onClick={() => setQty(Math.max(1, qty - 1))} style={qtyBtnStyle}>−</button>
                            <span style={{ padding: "0 1rem", fontWeight: 600, minWidth: 40, textAlign: "center" }}>{qty}</span>
                            <button onClick={() => setQty(qty + 1)} style={qtyBtnStyle}>+</button>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className={added ? "btn-green" : "btn-primary"}
                            style={{ flex: 1, justifyContent: "center", fontSize: "1rem", padding: "0.75rem" }}
                            disabled={!selectedType}
                        >
                            {added ? "✓ Added to Cart!" : "Add to Cart"}
                        </button>
                    </div>

                    <Link href="/cart" className="btn-secondary" style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}>
                        View Cart →
                    </Link>
                </div>
            </div>

            {/* Flying animation dot */}
            {flyAnim && typeof document !== "undefined" && createPortal(
                <motion.div
                    key={flyAnim.id}
                    initial={{
                        position: "fixed",
                        left: flyAnim.startX,
                        top: flyAnim.startY,
                        width: 25,
                        height: 25,
                        borderRadius: "50%",
                        background: "var(--vet-orange)",
                        zIndex: 99999,
                        opacity: 1,
                        scale: 1,
                        translateX: "-50%",
                        translateY: "-50%",
                        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.4)",
                    }}
                    animate={{
                        left: flyAnim.endX,
                        top: flyAnim.endY,
                        scale: 0.2,
                        opacity: 0,
                    }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 1, 0.5, 1],
                        opacity: { duration: 0.4, delay: 0.2 }
                    }}
                    style={{ pointerEvents: "none" }}
                />,
                document.body
            )}
        </main>
    );
}

const qtyBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
    fontSize: "1.1rem",
    color: "var(--text-primary)",
    transition: "background 0.2s",
};

function LoadingState() {
    return (
        <div className="container-main section" style={{ textAlign: "center", padding: "6rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
            <p style={{ color: "var(--text-secondary)" }}>Loading product...</p>
        </div>
    );
}

function NotFound() {
    return (
        <div className="container-main section" style={{ textAlign: "center", padding: "6rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Product not found</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                This product doesn&apos;t exist or was removed.
            </p>
            <Link href="/category/all" className="btn-primary">Browse Products</Link>
        </div>
    );
}
