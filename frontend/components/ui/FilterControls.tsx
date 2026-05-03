"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    title: string;
    productsCount: number;
}

const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low-High" },
    { value: "price-high", label: "Price: High-Low" },
    { value: "popular", label: "Popularity" },
];

export default function FilterBar({ title, productsCount }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [sort, setSort] = useState(searchParams.get("sort") || "newest");
    const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeSortLabel = SORT_OPTIONS.find(opt => opt.value === sort)?.label || "Sort";

    // Auto-apply filters
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (q) params.set("q", q); else params.delete("q");
        if (sort) params.set("sort", sort); else params.delete("sort");
        if (inStock) params.set("inStock", "true"); else params.delete("inStock");

        const newQuery = params.toString();
        if (newQuery !== searchParams.toString()) {
            const timeout = setTimeout(() => {
                router.push(`?${newQuery}`, { scroll: false });
            }, 300); // Debounce search
            return () => clearTimeout(timeout);
        }
    }, [q, sort, inStock]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div 
            style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                gap: "2rem", 
                marginBottom: "1rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--border)",
                flexWrap: "wrap",
                position: "relative",
                zIndex: 50,
            }}
        >
            {/* Title & Count */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                    {title}
                </h1>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                    {productsCount} item{productsCount !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Controls Group */}
            <div style={{ display: "flex", alignItems: "center", gap: "2rem", flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
                
                {/* Highly Modern Glassmorphic Search */}
                <div style={{ position: "relative", flex: "0 1 280px", display: "flex", alignItems: "center" }}>
                    <motion.div
                        initial={false}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        animate={{
                            background: isSearchFocused 
                                ? "rgba(255, 255, 255, 0.65)" 
                                : (q || isSortOpen ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)"),
                            backdropFilter: isSearchFocused ? "blur(12px)" : "blur(0px)",
                            borderColor: isSearchFocused ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.1)",
                            boxShadow: isSearchFocused ? "0 8px 32px rgba(0,0,0,0.06)" : "none",
                            width: "100%",
                            borderRadius: "12px",
                        }}
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid transparent",
                        }}
                    >
                        <div style={{ paddingLeft: "0.75rem", display: "flex", alignItems: "center", opacity: 0.5 }}>
                            <SearchIcon />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.6rem 0.75rem 0.6rem 0.5rem",
                                background: "transparent",
                                border: "none",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                outline: "none",
                                color: "var(--text-primary)",
                            }}
                        />
                        <AnimatePresence>
                            {q && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setQ("")}
                                    style={{
                                        background: "rgba(0,0,0,0.1)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "18px",
                                        height: "18px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: "0.5rem",
                                        cursor: "pointer",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    <span style={{ fontSize: "12px", fontWeight: 900 }}>×</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Custom Glassmorphic Sort Dropdown */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.4rem 0",
                            transition: "all 0.2s"
                        }}
                    >
                        <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sort:</span>
                        {activeSortLabel}
                        <motion.span animate={{ rotate: isSortOpen ? 180 : 0 }}>
                            <ChevronDown />
                        </motion.span>
                    </button>

                    <AnimatePresence>
                        {isSortOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    marginTop: "0.5rem",
                                    minWidth: "180px",
                                    background: "rgba(255, 255, 255, 0.75)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255, 255, 255, 0.4)",
                                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                                    padding: "0.5rem",
                                    zIndex: 100,
                                    overflow: "hidden"
                                }}
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSort(opt.value); setIsSortOpen(false); }}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "0.6rem 0.8rem",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: sort === opt.value ? "rgba(26,115,232,0.1)" : "transparent",
                                            color: sort === opt.value ? "var(--vet-blue)" : "var(--text-primary)",
                                            fontSize: "0.85rem",
                                            fontWeight: sort === opt.value ? 700 : 500,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => { if (sort !== opt.value) e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)"; }}
                                        onMouseLeave={(e) => { if (sort !== opt.value) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Stock Toggle */}
                <button 
                    onClick={() => setInStock(!inStock)}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: inStock ? "var(--vet-blue)" : "var(--text-secondary)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.4rem 0",
                        transition: "all 0.2s"
                    }}
                >
                    <div style={{ 
                        width: 32, height: 16, borderRadius: 20, 
                        background: inStock ? "var(--vet-blue)" : "rgba(0,0,0,0.1)", 
                        position: "relative",
                        transition: "all 0.2s"
                    }}>
                        <div style={{ 
                            width: 10, height: 10, borderRadius: "50%", background: "#fff",
                            position: "absolute", top: 3, left: inStock ? 19 : 3,
                            transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1.2)"
                        }} />
                    </div>
                    In Stock
                </button>
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    );
}

function ChevronDown() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

const minimalInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.5rem 0.5rem 1.75rem",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid transparent",
    fontSize: "0.9rem",
    outline: "none",
    transition: "all 0.2s",
};

const headingStyle: React.CSSProperties = {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
};

const smallInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid var(--border)",
    fontSize: "0.85rem",
    outline: "none",
    background: "var(--surface)",
};
