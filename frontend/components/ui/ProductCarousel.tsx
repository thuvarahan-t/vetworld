"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

interface Props {
    products: Product[];
}

export default function ProductCarousel({ products }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [products]);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div style={{ position: "relative", margin: "0 -1rem", padding: "0 1rem" }}>
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                style={{
                    display: "flex",
                    gap: "1.25rem",
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    scrollBehavior: "smooth",
                    padding: "0.5rem 0 1.5rem",
                    scrollbarWidth: "none", // Hide scrollbar for Firefox
                    msOverflowStyle: "none", // Hide scrollbar for IE/Edge
                }}
                className="hide-scrollbar"
            >
                <style>{`
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none; /* Hide scrollbar for Chrome/Safari */
                    }
                `}</style>
                {products.map((product) => (
                    <div
                        key={product.id}
                        style={{
                            flex: "0 0 auto",
                            width: "min(280px, 75vw)",
                            scrollSnapAlign: "start",
                        }}
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            {/* Navigation Buttons */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll("left")}
                    style={{
                        ...arrowStyle,
                        left: "-0.5rem",
                    }}
                    aria-label="Scroll left"
                >
                    <ChevronLeft />
                </button>
            )}

            {canScrollRight && (
                <button
                    onClick={() => scroll("right")}
                    style={{
                        ...arrowStyle,
                        right: "-0.5rem",
                    }}
                    aria-label="Scroll right"
                >
                    <ChevronRight />
                </button>
            )}
        </div>
    );
}

const arrowStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(50% - 22px)",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    color: "var(--text-primary)",
    transition: "all 0.2s ease",
};

function ChevronLeft() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    );
}

function ChevronRight() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    );
}
