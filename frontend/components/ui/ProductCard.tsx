"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { Product, ProductType } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);
    const [flyAnim, setFlyAnim] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number } | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Manage selected type locally
    const [selectedType, setSelectedType] = useState<ProductType | undefined>(product.types?.[0]);
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = (e: React.MouseEvent, customQty?: number) => {
        e.preventDefault();
        e.stopPropagation();
        const isSoldOutNow = !!product.soldOut || !!selectedType?.soldOut;
        if (!selectedType || isSoldOutNow) return;

        const qtyToAdd = customQty ?? 1;

        addItem({
            productId: product.id,
            productName: product.name,
            productKey: selectedType.projectKey,
            productImage: selectedType.imageUrl || product.imageUrl,
            typeId: selectedType.id,
            typeName: selectedType.typeName,
            unitPrice: selectedType.price,
            quantity: qtyToAdd,
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

    const openQuickView = () => {
        setIsQuickViewOpen(true);
        setQuantity(1);
    };
    const closeQuickView = () => {
        setIsQuickViewOpen(false);
    };

    useEffect(() => {
        if (!isQuickViewOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeQuickView();
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isQuickViewOpen]);

    const quickViewSku = useMemo(() => {
        if (selectedType?.projectKey) return selectedType.projectKey.toUpperCase();
        const paddedId = String(product.id).padStart(4, "0");
        const typePart = selectedType ? String(selectedType.id).padStart(2, "0") : "00";
        return `VW-${paddedId}-${typePart}`;
    }, [product.id, selectedType]);

    const quickViewTags = useMemo(() => {
        const tags = new Set<string>();
        if (product.category?.name) tags.add(product.category.name);
        if (product.topSelling) tags.add("Top Selling");
        if (product.soldOut) tags.add("Sold Out");
        return Array.from(tags).slice(0, 3);
    }, [product.category?.name, product.topSelling, product.soldOut]);

    const descriptionText = (product.description || "No description available.").trim();
    const activeImage = selectedType?.imageUrl || product.imageUrl;
    const isSelectedTypeSoldOut = !!selectedType?.soldOut;
    const isSoldOut = !!product.soldOut || isSelectedTypeSoldOut;

    return (
        <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                transition: "box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.04)";
            }}
        >
            <button
                type="button"
                onClick={openQuickView}
                style={{
                    display: "block",
                    position: "relative",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                    padding: 0,
                    cursor: "pointer",
                    outline: "none",
                }}
                aria-label={`Open quick view for ${product.name}`}
            >
                {/* Image Area - Square Frame */}
                <div
                    style={{
                        padding: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
                    }}
                >
                    <div style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        background: "white",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                        position: "relative",
                    }}
                    className="product-frame"
                    >
                        {selectedType?.imageUrl || product.imageUrl ? (
                            <img
                                src={selectedType?.imageUrl || product.imageUrl}
                                alt={product.name}
                                style={{ 
                                    width: "100%", 
                                    height: "100%", 
                                    objectFit: "contain",
                                    padding: "0.5rem",
                                    transition: "transform 0.6s cubic-bezier(0.2, 0, 0.2, 1)" 
                                }}
                            />
                        ) : (
                            <div style={{ fontSize: "3rem", filter: "grayscale(0.2)" }}>
                                🧪
                            </div>
                        )}
                    </div>
                    
                    {product.topSelling && (
                        <div style={{ position: "absolute", top: 12, left: 12 }}>
                            <span
                                style={{
                                    background: "rgba(255, 255, 255, 0.95)",
                                    backdropFilter: "blur(4px)",
                                    color: "var(--vet-orange)",
                                    fontSize: "0.55rem",
                                    fontWeight: 800,
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                }}
                            >
                                🔥 POPULAR
                            </span>
                        </div>
                    )}

                    {isSoldOut && (
                        <div style={{ position: "absolute", top: 12, right: 12 }}>
                            <span
                                style={{
                                    background: "rgba(220, 38, 38, 0.95)",
                                    color: "#fff",
                                    fontSize: "0.55rem",
                                    fontWeight: 800,
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Sold Out
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div style={{ padding: "1.25rem 1rem 0.5rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{
                        fontWeight: 700, 
                        fontSize: "0.95rem",
                        color: "var(--text-primary)", 
                        marginBottom: "0.35rem",
                        lineHeight: 1.4,
                        letterSpacing: "-0.01em",
                        height: "calc(1.4em * 2)",
                        overflow: "hidden", 
                        display: "-webkit-box",
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: "vertical",
                    }}>
                        {product.name}
                    </h3>

                    <p style={{
                        fontSize: "0.8rem", 
                        color: "var(--text-secondary)",
                        marginBottom: "0.75rem", 
                        lineHeight: 1.5,
                        height: "1.5em",
                        overflow: "hidden", 
                        display: "-webkit-box",
                        WebkitLineClamp: 1, 
                        WebkitBoxOrient: "vertical",
                        opacity: 0.65
                    }}>
                        {product.description}
                    </p>

                    <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline" }}>
                        {selectedType && (
                            <span style={{ fontWeight: 800, color: "var(--vet-blue)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                                Rs. {Number(selectedType.price).toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                </div>
            </button>

            {/* Selection & CTA Area */}
            <div style={{ padding: "0 1rem 1rem", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {product.types && product.types.length > 1 ? (
                    <div style={{ position: "relative" }}>
                        <select
                            className="select"
                            style={{ 
                                padding: "0.6rem 2rem 0.6rem 0.85rem", 
                                fontSize: "0.825rem", 
                                fontWeight: 600,
                                background: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                width: "100%",
                            }}
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
                    </div>
                ) : product.types && product.types.length === 1 ? (
                    <div style={{
                        padding: "0.6rem", 
                        fontSize: "0.825rem", 
                        textAlign: "center",
                        fontWeight: 600,
                        background: "var(--background)", 
                        color: "var(--text-secondary)",
                        border: "1px dashed var(--border)", 
                        borderRadius: "var(--radius-md)",
                    }}>
                        {product.types[0].typeName}
                    </div>
                ) : null}

                <button
                    onClick={handleAddToCart}
                    className={added ? "btn-green" : "btn-primary"}
                    style={{ 
                        width: "100%", 
                        justifyContent: "center",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        boxShadow: added || isSoldOut ? "none" : "0 4px 12px rgba(26, 115, 232, 0.2)",
                        background: isSoldOut ? "rgb(220, 38, 38)" : undefined,
                        opacity: isSoldOut ? 0.92 : 1,
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                    }}
                    disabled={!selectedType || isSoldOut}
                >
                    {isSoldOut ? "Sold Out" : (added ? "✓ Added" : "+ Add to Cart")}
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
                        width: 32,
                        height: 32,
                        borderRadius: "12px",
                        background: "var(--vet-blue)",
                        zIndex: 99999,
                        opacity: 1,
                        scale: 1,
                        translateX: "-50%",
                        translateY: "-50%",
                        boxShadow: "0 8px 16px rgba(26, 115, 232, 0.3)",
                    }}
                    animate={{
                        left: flyAnim.endX,
                        top: flyAnim.endY,
                        scale: 0.1,
                        opacity: 0,
                    }}
                    transition={{
                        duration: 0.7,
                        ease: [0.16, 1, 0.3, 1],
                        opacity: { duration: 0.4, delay: 0.3 }
                    }}
                    style={{ pointerEvents: "none" }}
                >
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1rem" }}>
                        +
                    </div>
                </motion.div>,
                document.body
            )}

            {/* Quick View Modal */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isQuickViewOpen && (
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${product.name} quick view`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.24 }}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(15, 23, 42, 0.4)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "1.5rem",
                                zIndex: 100000,
                            }}
                            onClick={closeQuickView}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "min(1000px, 100%)",
                                    maxHeight: "min(800px, 90vh)",
                                    background: "var(--surface)",
                                    borderRadius: "32px",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    boxShadow: "0 40px 100px rgba(0, 0, 0, 0.25)",
                                    position: "relative",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {/* Close Button */}
                                <button
                                    type="button"
                                    onClick={closeQuickView}
                                    style={{
                                        position: "absolute",
                                        top: 24,
                                        right: 24,
                                        zIndex: 10,
                                        width: 44,
                                        height: 44,
                                        borderRadius: "16px",
                                        background: "rgba(255, 255, 255, 0.8)",
                                        backdropFilter: "blur(8px)",
                                        border: "1px solid var(--border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        color: "var(--text-primary)",
                                        fontSize: "1.5rem"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#fff";
                                        e.currentTarget.style.transform = "rotate(90deg)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
                                        e.currentTarget.style.transform = "rotate(0deg)";
                                    }}
                                >
                                    ×
                                </button>

                                <div style={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                                    height: "100%",
                                    minHeight: 0
                                }}>
                                    {/* Modal - Left Column: Image Area */}
                                    <div style={{ 
                                        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "1.5rem",
                                    }}>
                                        <div style={{
                                            width: "100%",
                                            aspectRatio: "1/1",
                                            borderRadius: "24px",
                                            overflow: "hidden",
                                            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.1)",
                                            background: "white"
                                        }}>
                                            <AnimatePresence mode="wait">
                                                {activeImage ? (
                                                    <motion.img
                                                        key={activeImage}
                                                        src={activeImage}
                                                        alt={product.name}
                                                        initial={{ opacity: 0, scale: 1.1 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "contain",
                                                            objectPosition: "center",
                                                            padding: "0.75rem"
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>
                                                        🧪
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        
                                        {product.topSelling && (
                                            <div style={{ position: "absolute", top: 30, left: 30 }}>
                                                <span style={{
                                                    background: "var(--vet-orange)",
                                                    color: "white",
                                                    fontWeight: 800,
                                                    fontSize: "0.75rem",
                                                    padding: "6px 14px",
                                                    borderRadius: "12px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em"
                                                }}>
                                                    🔥 Best Seller
                                                </span>
                                            </div>
                                        )}

                                        {isSoldOut && (
                                            <div style={{ position: "absolute", top: 30, right: 30 }}>
                                                <span style={{
                                                    background: "rgb(220, 38, 38)",
                                                    color: "white",
                                                    fontWeight: 800,
                                                    fontSize: "0.75rem",
                                                    padding: "6px 14px",
                                                    borderRadius: "12px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em"
                                                }}>
                                                    Sold Out
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal - Right Column: Info Area */}
                                    <div style={{ 
                                        padding: "2rem 2rem 1.5rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflowY: "auto",
                                        background: "white"
                                    }}>
                                        <div style={{ marginBottom: "1rem" }}>
                                            <div style={{ display: "flex", gap: "10px", marginBottom: "0.75rem", paddingRight: "50px" }}>
                                                {quickViewTags.map(tag => (
                                                    <span key={tag} style={{ 
                                                        background: "var(--vet-blue-light)", 
                                                        color: "var(--vet-blue)",
                                                        fontSize: "0.7rem",
                                                        fontWeight: 700,
                                                        padding: "4px 12px",
                                                        borderRadius: "8px",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em"
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                                <span style={{ 
                                                    marginLeft: "auto",
                                                    color: "var(--text-muted)",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    letterSpacing: "0.05em"
                                                }}>
                                                    ID: {quickViewSku}
                                                </span>
                                            </div>

                                            <h2 style={{ 
                                                fontSize: "clamp(1.5rem, 2.5vw, 2.15rem)", 
                                                fontWeight: 800, 
                                                color: "var(--text-primary)",
                                                lineHeight: 1.1,
                                                letterSpacing: "-0.03em",
                                                marginBottom: "0.75rem",
                                                paddingRight: "50px"
                                            }}>
                                                {product.name}
                                            </h2>

                                            <p style={{ 
                                                fontSize: "0.9rem", 
                                                lineHeight: 1.5, 
                                                color: "var(--text-secondary)",
                                                marginBottom: "1rem",
                                                opacity: 0.85
                                            }}>
                                                {descriptionText}
                                            </p>
                                        </div>

                                        {/* Variant Selection */}
                                        {product.types && product.types.length > 0 && (
                                            <div style={{ marginBottom: "1.5rem" }}>
                                                <p style={{ 
                                                    fontSize: "0.75rem", 
                                                    fontWeight: 800, 
                                                    textTransform: "uppercase", 
                                                    letterSpacing: "0.1em",
                                                    color: "var(--text-muted)",
                                                    marginBottom: "0.75rem"
                                                }}>
                                                    Select Size / Type
                                                </p>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                                                    {product.types.map((type) => {
                                                        const isActive = selectedType?.id === type.id;
                                                        return (
                                                            <button
                                                                key={type.id}
                                                                type="button"
                                                                onClick={() => setSelectedType(type)}
                                                                style={{
                                                                    border: isActive ? "2px solid var(--vet-blue)" : "1px solid var(--border)",
                                                                    background: isActive ? "var(--vet-blue-light)" : "transparent",
                                                                    color: isActive ? "var(--vet-blue)" : "var(--text-secondary)",
                                                                    borderRadius: "12px",
                                                                    padding: "0.6rem 1rem",
                                                                    fontSize: "0.825rem",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                    transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
                                                                    boxShadow: isActive ? "0 4px 12px rgba(26, 115, 232, 0.15)" : "none"
                                                                }}
                                                            >
                                                                {type.typeName}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bottom Pricing & Actions */}
                                        <div style={{ 
                                            marginTop: "auto",
                                            paddingTop: "1.5rem",
                                            borderTop: "1px solid var(--border)",
                                            display: "flex",
                                            alignItems: "flex-end",
                                            justifyContent: "space-between",
                                            gap: "1rem",
                                            flexWrap: "wrap"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem" }}>
                                                <div>
                                                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>Total Price</span>
                                                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                                                        <span style={{ 
                                                            fontSize: "2rem", 
                                                            fontWeight: 900, 
                                                            color: "var(--vet-blue)",
                                                            letterSpacing: "-0.04em"
                                                        }}>
                                                            Rs. {(Number(selectedType?.price || 0) * quantity).toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Integrated Quantity Stepper */}
                                                <div style={{ marginBottom: "4px" }}>
                                                    <div style={{ 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        background: "var(--background)", 
                                                        borderRadius: "12px",
                                                        padding: "4px",
                                                        border: "1px solid var(--border)"
                                                    }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setQuantity(Math.max(1, quantity - 1));
                                                            }}
                                                            style={{ width: "32px", height: "32px", border: "none", background: "white", borderRadius: "8px", cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                                                        >-</button>
                                                        <input 
                                                            type="number" 
                                                            value={quantity}
                                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                            style={{ width: "45px", textAlign: "center", border: "none", background: "transparent", fontWeight: 700, fontSize: "0.9rem" }}
                                                        />
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setQuantity(quantity + 1);
                                                            }}
                                                            style={{ width: "32px", height: "32px", border: "none", background: "white", borderRadius: "8px", cursor: "pointer", fontWeight: 700, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleAddToCart(e, quantity)}
                                                    disabled={!selectedType || isSoldOut}
                                                    style={{
                                                        border: "none",
                                                        background: isSoldOut ? "rgb(220, 38, 38)" : (added ? "#22c55e" : "var(--vet-blue)"),
                                                        color: "#fff",
                                                        borderRadius: "16px",
                                                        padding: "0.875rem 1.75rem",
                                                        fontWeight: 700,
                                                        fontSize: "0.95rem",
                                                        cursor: isSoldOut ? "not-allowed" : "pointer",
                                                        minWidth: "160px",
                                                        transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
                                                        boxShadow: isSoldOut
                                                            ? "none"
                                                            : (added ? "0 10px 25px rgba(34, 197, 94, 0.3)" : "0 12px 30px rgba(26, 115, 232, 0.3)"),
                                                        opacity: isSoldOut ? 0.95 : 1,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (isSoldOut) return;
                                                        e.currentTarget.style.transform = "translateY(-3px)";
                                                        e.currentTarget.style.boxShadow = added ? "0 15px 35px rgba(34, 197, 94, 0.35)" : "0 18px 40px rgba(26, 115, 232, 0.35)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (isSoldOut) return;
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                        e.currentTarget.style.boxShadow = added ? "0 10px 25px rgba(34, 197, 94, 0.3)" : "0 12px 30px rgba(26, 115, 232, 0.3)";
                                                    }}
                                                >
                                                    {isSoldOut ? "Sold Out" : (added ? "Added ✓" : "Add to Cart")}
                                                </button>
                                                <Link 
                                                    href="/cart" 
                                                    className="btn-secondary" 
                                                    onClick={closeQuickView}
                                                    style={{ 
                                                        borderRadius: "16px", 
                                                        padding: "0.875rem 1.25rem",
                                                        borderWidth: "2px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        textDecoration: "none"
                                                    }}
                                                >
                                                    🛒 View Cart
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
}
