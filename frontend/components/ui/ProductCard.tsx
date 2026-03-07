"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Product, ProductType } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";
import { createPortal } from "react-dom";

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);
    const [flyAnim, setFlyAnim] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number } | null>(null);

    // Manage selected type locally
    const [selectedType, setSelectedType] = useState<ProductType | undefined>(product.types?.[0]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedType) return;

        addItem({
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            typeId: selectedType.id,
            typeName: selectedType.typeName,
            unitPrice: selectedType.price,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);

        // Calculate animation coordinates
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

        setTimeout(() => setFlyAnim(null), 800); // Clear after animation completes
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                /* Soft unified shadow instead of hard border */
                boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                transition: "box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 12px 28px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)";
            }}
        >
            <Link href={`/product/${product.id}`} style={{ display: "block", position: "relative" }}>
                {/* Image */}
                <div
                    style={{
                        aspectRatio: "4/3",
                        background: "var(--background)",
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s ease" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
                            🧪
                        </div>
                    )}
                    {product.topSelling && (
                        <span
                            style={{
                                position: "absolute", top: 10, left: 10,
                                background: "var(--vet-orange)", color: "#fff",
                                fontSize: "0.68rem", fontWeight: 700,
                                padding: "3px 10px", borderRadius: 999,
                                letterSpacing: "0.04em",
                            }}
                        >
                            🔥 Top Selling
                        </span>
                    )}
                </div>

                {/* Info — Fixed height sections to ensure perfect horizontal grid alignment */}
                <div style={{ padding: "1rem 1rem 0.5rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{
                        fontWeight: 600, fontSize: "0.95rem",
                        color: "var(--text-primary)", marginBottom: "0.3rem",
                        lineHeight: 1.35,
                        /* Lock exactly to 2 lines height */
                        height: "calc(1.35em * 2)",
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                        {product.name}
                    </h3>

                    <p style={{
                        fontSize: "0.8rem", color: "var(--text-secondary)",
                        marginBottom: "1rem", lineHeight: 1.5,
                        /* Lock exactly to 2 lines height */
                        height: "calc(1.5em * 2)",
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                        {product.description}
                    </p>

                    {/* Price — bold primary, pushed to bottom of info block */}
                    {selectedType && (
                        <p style={{ marginTop: "auto", marginBottom: 0 }}>
                            <span style={{ fontWeight: 700, color: "var(--vet-blue)", fontSize: "1.05rem" }}>
                                Rs. {Number(selectedType.price).toLocaleString("en-IN")}
                            </span>
                        </p>
                    )}
                </div>
            </Link>

            {/* Selection and Add to Cart — anchored to bottom via margin-top: auto on wrapper */}
            <div style={{ padding: "0 1rem 1rem", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {product.types && product.types.length > 1 ? (
                    <select
                        className="form-control"
                        style={{ padding: "0.5rem", fontSize: "0.85rem", cursor: "pointer", background: "var(--background)", color: "var(--text-primary)" }}
                        value={selectedType?.id || ""}
                        onChange={(e) => {
                            const type = product.types?.find(t => t.id === Number(e.target.value));
                            if (type) setSelectedType(type);
                        }}
                    >
                        {product.types.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.typeName}
                            </option>
                        ))}
                    </select>
                ) : product.types && product.types.length === 1 ? (
                    <div style={{
                        padding: "0.5rem", fontSize: "0.85rem", textAlign: "center",
                        background: "var(--background)", color: "var(--text-secondary)",
                        border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                    }}>
                        {product.types[0].typeName}
                    </div>
                ) : null}

                <button
                    onClick={handleAddToCart}
                    className={added ? "btn-green" : "btn-primary"}
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={!selectedType}
                >
                    {added ? "✓ Added to Cart" : "+ Add to Cart"}
                </button>
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
                        ease: [0.25, 1, 0.5, 1], // easeOutCubic
                        opacity: { duration: 0.4, delay: 0.2 }
                    }}
                    style={{ pointerEvents: "none" }}
                />,
                document.body
            )}
        </motion.div>
    );
}
