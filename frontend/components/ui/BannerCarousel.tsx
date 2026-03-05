"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Banner } from "@/types";

interface Props {
    banners: Banner[];
}

export default function BannerCarousel({ banners }: Props) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (banners.length <= 1) return;
        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % banners.length);
        }, 4500);
        return () => clearInterval(id);
    }, [banners.length]);

    if (!banners.length) {
        // Fallback hero when no banners exist yet
        return (
            <div
                style={{
                    background: "linear-gradient(135deg, var(--vet-blue) 0%, #1557b0 60%, #0d3d8c 100%)",
                    color: "#fff",
                    padding: "5rem 2rem",
                    textAlign: "center",
                    borderRadius: "var(--radius-lg)",
                    margin: "1.5rem 0",
                }}
            >
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        🐾 Welcome to VetWorld
                    </p>
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, marginBottom: "1rem", lineHeight: 1.2 }}>
                        Your one-stop shop for<br />Veterinary &amp; Lab Equipment
                    </h1>
                    <p style={{ fontSize: "1rem", opacity: 0.85, marginBottom: "2rem", maxWidth: 500, margin: "0 auto 2rem" }}>
                        Browse thousands of professional-grade scientific supplies, delivered to your doorstep.
                    </p>
                    <Link href="/category/all" className="btn-primary" style={{ fontSize: "1rem", padding: "0.8rem 2rem" }}>
                        Shop Now →
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: "relative",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                margin: "1.5rem 0",
                height: "clamp(220px, 40vw, 440px)",
                background: "var(--surface)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.45 }}
                    style={{ position: "absolute", inset: 0 }}
                >
                    {banners[current].redirectLink ? (
                        <Link href={banners[current].redirectLink} style={{ display: "block", height: "100%" }}>
                            <img src={banners[current].imageUrl} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </Link>
                    ) : (
                        <img src={banners[current].imageUrl} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Dot / pill indicators */}
            {banners.length > 1 && (
                <div style={{
                    position: "absolute", bottom: 16, left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex", gap: 6,
                    zIndex: 3,
                }}>
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            aria-label={`Slide ${i + 1}`}
                            style={{
                                width: i === current ? 28 : 8,
                                height: 8,
                                borderRadius: 999,
                                background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.35s ease",
                                padding: 0,
                                /* larger hit area without visual change */
                                boxSizing: "content-box",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Left / Right arrows — 48×48 with backdrop-blur */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
                        aria-label="Previous slide"
                        style={arrowStyle("left")}
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => setCurrent((c) => (c + 1) % banners.length)}
                        aria-label="Next slide"
                        style={arrowStyle("right")}
                    >
                        ›
                    </button>
                </>
            )}
        </div>
    );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
    return {
        position: "absolute",
        top: "50%",
        [side]: 16,
        transform: "translateY(-50%)",
        /* Larger hit area (44px+) with backdrop-blur */
        background: "rgba(0,0,0,0.30)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "50%",
        width: 48,
        height: 48,
        minWidth: 48,
        fontSize: "1.6rem",
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        transition: "background 0.2s ease, transform 0.15s ease",
    };
}
