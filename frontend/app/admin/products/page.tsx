"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ui/ImageUpload";
import { useAdminProducts, useAdminCategories, revalidateProducts, revalidateStats } from "@/lib/adminHooks";
import { authFetcher } from "@/lib/api";
import type { Product } from "@/types";

interface Category { id: number; name: string; }
type TypeForm = { id?: number; typeName: string; price: string; imageUrl: string; projectKey: string; soldOut?: boolean };

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
                            <div>
                                <div style={{ width: "120px", height: "16px", borderRadius: "6px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite", marginBottom: "6px" }} />
                                <div style={{ width: "40px", height: "12px", borderRadius: "6px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                            </div>
                        </div>
                    </td>
                    {[120, 80, 80, 90].map((w, j) => (
                        <td key={j} style={{ padding: "1rem" }}>
                            <div style={{ height: "16px", width: `${w}px`, borderRadius: "6px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

const BLANK_TYPE: TypeForm = { typeName: "", price: "", imageUrl: "", projectKey: "", soldOut: false };

export default function AdminProductsPage() {
    const { data: products = [], error: prodError, isLoading, mutate } = useAdminProducts();
    const { data: categories = [] } = useAdminCategories();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [types, setTypes] = useState<TypeForm[]>([{ ...BLANK_TYPE }]);
    const [imageUrl, setImageUrl] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isProductSoldOut, setIsProductSoldOut] = useState(false);
    const [activeTypeIndex, setActiveTypeIndex] = useState<number | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [editingCell, setEditingCell] = useState<{ productId: number; typeIndex: number; field: 'typeName' | 'price'; value: string } | null>(null);

    // Filters and Search
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("NEWEST");
    const [displayCount, setDisplayCount] = useState(15);

    // Reset display count when filters change
    React.useEffect(() => {
        setDisplayCount(15);
    }, [searchTerm, selectedCategory, selectedStatus]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm);
            const matchesCategory = selectedCategory === "ALL" || (p as any).category?.id?.toString() === selectedCategory;
            const matchesStatus = 
                selectedStatus === "ALL" ? true :
                selectedStatus === "SOLD_OUT" ? p.soldOut :
                selectedStatus === "AVAILABLE" ? !p.soldOut :
                selectedStatus === "TOP_SELLING" ? p.topSelling : true;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });

        if (sortOrder === "A_Z") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOrder === "Z_A") {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        } else {
            filtered.sort((a, b) => b.id - a.id);
        }

        return filtered;
    }, [products, searchTerm, selectedCategory, selectedStatus, sortOrder]);

    const displayedProducts = useMemo(() => filteredProducts.slice(0, displayCount), [filteredProducts, displayCount]);



    const addTypeRow = () => setTypes(prev => [...prev, { ...BLANK_TYPE }]);
    const removeTypeRow = (i: number) => setTypes(prev => prev.filter((_, idx) => idx !== i));
    const updateTypeField = (i: number, field: keyof TypeForm, value: string) =>
        setTypes(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
    const toggleTypeSoldOutInForm = (i: number) =>
        setTypes(prev => prev.map((t, idx) => idx === i ? { ...t, soldOut: !t.soldOut } : t));

    const closeForm = useCallback(() => {
        setShowForm(false);
        setEditingId(null);
        setName(""); setDescription(""); setImageUrl(""); setCategoryId(""); setIsProductSoldOut(false);
        setTypes([{ ...BLANK_TYPE }]);
        setActiveTypeIndex(null);
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        mutate(prev => (prev || []).filter(p => p.id !== id), { revalidate: false });
        try {
            await authFetcher(`/admin/products/${id}`, { method: "DELETE" });
            revalidateProducts();
            revalidateStats();
        } catch (err: any) {
            alert(err.message);
            revalidateProducts();
        }
    };

    const toggleTopSelling = async (id: number) => {
        mutate(prev => (prev || []).map(p => p.id === id ? { ...p, topSelling: !p.topSelling } : p), { revalidate: false });
        try {
            const updated = await authFetcher<Product>(`/admin/products/${id}/top-selling`, { method: "PUT" });
            mutate(prev => (prev || []).map(p => p.id === id ? updated : p), { revalidate: false });
        } catch (err: any) {
            mutate();
            alert(err.message);
        }
    };

    const handleInlineEditSave = async (prod: any) => {
        if (!editingCell || editingCell.productId !== prod.id) return;
        
        const currentType = prod.types[editingCell.typeIndex];
        if (!currentType) return;
        
        const isPrice = editingCell.field === 'price';
        const oldVal = isPrice ? currentType.price.toString() : currentType.typeName;
        
        if (oldVal === editingCell.value) {
            setEditingCell(null);
            return;
        }

        try {
            const updatedTypes = [...prod.types];
            if (isPrice) {
                updatedTypes[editingCell.typeIndex].price = parseFloat(editingCell.value) || 0;
            } else {
                updatedTypes[editingCell.typeIndex].typeName = editingCell.value;
            }

            const payload = {
                name: prod.name,
                description: prod.description,
                imageUrl: prod.imageUrl,
                categoryId: prod.category?.id || null,
                soldOut: prod.soldOut,
                types: updatedTypes.map(t => ({
                    id: t.id,
                    typeName: t.typeName,
                    price: t.price,
                    imageUrl: t.imageUrl,
                    projectKey: t.projectKey,
                    soldOut: t.soldOut
                }))
            };

            const saved = await authFetcher(`/admin/products/${prod.id}`, { method: "PUT", body: JSON.stringify(payload) });
            mutate(prev => (prev || []).map(p => p.id === prod.id ? saved : p), { revalidate: false });
        } catch (err: any) {
            alert("Failed to update: " + err.message);
        } finally {
            setEditingCell(null);
        }
    };

    const toggleProductSoldOut = async (id: number) => {
        mutate(prev => (prev || []).map(p => p.id === id ? { ...p, soldOut: !p.soldOut } : p), { revalidate: false });
        try {
            const updated = await authFetcher<Product>(`/admin/products/${id}/sold-out`, { method: "PUT" });
            mutate(prev => (prev || []).map(p => p.id === id ? updated : p), { revalidate: false });
        } catch (err: any) {
            mutate();
            alert(err.message);
        }
    };


    const toggleTypeSoldOut = async (productId: number, typeId: number) => {
        mutate(prev => (prev || []).map(p => {
            if (p.id === productId) {
                return { ...p, types: p.types.map(t => t.id === typeId ? { ...t, soldOut: !t.soldOut } : t) };
            }
            return p;
        }), { revalidate: false });

        try {
            const updated = await authFetcher<Product>(`/admin/products/${productId}/types/${typeId}/sold-out`, { method: "PUT" });
            mutate(prev => (prev || []).map(p => p.id === productId ? updated : p), { revalidate: false });
            if (editingId === productId) {
                setTypes(updated.types.map(t => ({
                    id: t.id, typeName: t.typeName, price: t.price.toString(),
                    imageUrl: t.imageUrl || "", projectKey: t.projectKey || "", soldOut: !!t.soldOut,
                })));
            }
        } catch (err: any) {
            mutate();
            alert(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name, description,
                imageUrl: imageUrl || types[0]?.imageUrl || null,
                categoryId: categoryId ? parseInt(categoryId) : null,
                soldOut: isProductSoldOut,
                types: types.map(t => ({
                    typeName: t.typeName,
                    price: parseFloat(t.price),
                    imageUrl: t.imageUrl || null,
                    projectKey: t.projectKey || null,
                    soldOut: !!t.soldOut,
                }))
            };
            const isEditing = editingId !== null;
            const saved = await authFetcher<Product>(
                isEditing ? `/admin/products/${editingId}` : "/admin/products",
                { method: isEditing ? "PUT" : "POST", body: JSON.stringify(payload) }
            );
            if (isEditing) {
                mutate(prev => (prev || []).map(p => p.id === editingId ? saved : p), { revalidate: false });
            } else {
                mutate(prev => [saved, ...(prev || [])], { revalidate: false });
            }
            closeForm();
            revalidateProducts();
            revalidateStats();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (prod: Product) => {
        setEditingId(prod.id);
        setName(prod.name);
        setDescription(prod.description);
        setImageUrl(prod.imageUrl);
        setCategoryId((prod as any).category ? String((prod as any).category.id) : "");
        setIsProductSoldOut(!!prod.soldOut);
        setTypes(prod.types?.length
            ? prod.types.map(t => ({ id: t.id, typeName: t.typeName, price: t.price.toString(), imageUrl: t.imageUrl || "", projectKey: t.projectKey || "", soldOut: !!t.soldOut }))
            : [{ ...BLANK_TYPE }]
        );
        setShowForm(true);
    };

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .stat-card {
                    background: var(--surface);
                    border-radius: var(--radius-md);
                    padding: 1.25rem;
                    border: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: var(--shadow-sm);
                }
                .filter-input {
                    padding: 0.45rem 1rem;
                    border-radius: 999px;
                    border: 1px solid var(--border);
                    background: var(--bg);
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .filter-input:focus, .filter-input:hover { 
                    border-color: var(--vet-blue); 
                    box-shadow: 0 0 0 3px rgba(43,89,212,0.1); 
                }
            `}</style>

            {/* Header & Stats */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>Products</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage your entire catalog, pricing, and stock status.</p>
                </div>
                <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary"
                    style={{ padding: "0.75rem 1.5rem", display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.95rem", fontWeight: 700 }}>
                    <span style={{ fontSize: "1.2rem" }}>+</span> Add New Product
                </button>
            </div>



            {/* Filters & Search Bar */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: "1 1 280px", position: "relative", maxWidth: "400px" }}>
                    <svg style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                        type="text" 
                        placeholder="Search products by name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="filter-input"
                        style={{ width: "100%", paddingLeft: "2.25rem" }}
                    />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <select 
                        className="filter-input" 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ minWidth: "160px", cursor: "pointer", paddingRight: "2rem" }}
                    >
                        <option value="ALL">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select 
                        className="filter-input" 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{ minWidth: "150px", cursor: "pointer", paddingRight: "2rem" }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="SOLD_OUT">Sold Out</option>
                        <option value="TOP_SELLING">Featured</option>
                    </select>
                    <select 
                        className="filter-input" 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={{ minWidth: "160px", cursor: "pointer", paddingRight: "2rem" }}
                    >
                        <option value="NEWEST">Newest First</option>
                        <option value="A_Z">Alphabetical (A-Z)</option>
                        <option value="Z_A">Alphabetical (Z-A)</option>
                    </select>
                </div>
            </div>

            {prodError && (
                <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                    ⚠ {prodError.message}
                </div>
            )}

            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
                    <thead>
                        <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                            {["Product", "Category", "Top Selling", "Status", "Actions"].map((h, i) => (
                                <th key={h} style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: i >= 2 ? "center" : "left" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? <TableSkeleton /> : displayedProducts.map(prod => (
                            <React.Fragment key={prod.id}>
                                <tr style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", cursor: "pointer" }}
                                    onClick={() => setExpandedRow(prev => prev === prod.id ? null : prod.id)}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--background)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ padding: "1rem 1.25rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", background: expandedRow === prod.id ? "var(--border)" : "transparent", color: "var(--text-secondary)", transition: "all 0.2s", transform: expandedRow === prod.id ? "rotate(90deg)" : "rotate(0)" }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                            </div>
                                            <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "var(--bg)", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                                                {prod.imageUrl ? (
                                                    <img src={prod.imageUrl} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "1.5rem" }}>📦</div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{prod.name}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem", fontWeight: 500 }}>ID: #{prod.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                <td style={{ padding: "1rem 1.25rem" }}>
                                    <span style={{ background: "var(--bg)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                                        {(prod as any).category?.name || "Uncategorized"}
                                    </span>
                                </td>

                                <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleTopSelling(prod.id); }} 
                                        title={prod.topSelling ? "Remove from Featured" : "Mark as Featured"}
                                        style={{
                                        background: "transparent",
                                        color: prod.topSelling ? "#eab308" : "var(--text-secondary)",
                                        border: "none",
                                        padding: "0.4rem", borderRadius: "50%", cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill={prod.topSelling ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    </button>
                                </td>
                                <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleProductSoldOut(prod.id); }} style={{
                                        background: prod.soldOut ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                        color: prod.soldOut ? "rgb(239, 68, 68)" : "rgb(16, 185, 129)",
                                        border: `1px solid ${prod.soldOut ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                                        padding: "0.3rem 0.65rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "0.35rem"
                                    }}>
                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }}></span>
                                        {prod.soldOut ? "SOLD OUT" : "IN STOCK"}
                                    </button>
                                </td>
                                <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(prod as any); }} 
                                            title="Edit Product"
                                            style={{
                                            background: "transparent", color: "var(--text-secondary)", border: "none",
                                            padding: "0.4rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--vet-blue)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(prod.id); }} 
                                            title="Delete Product"
                                            style={{
                                            background: "transparent", color: "var(--text-secondary)", border: "none",
                                            padding: "0.4rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "rgb(239, 68, 68)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <AnimatePresence>
                                {expandedRow === prod.id && (
                                    <motion.tr
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ background: "rgba(0,0,0,0.015)" }}
                                    >
                                        <td colSpan={5} style={{ padding: 0 }}>
                                            <div style={{ padding: "1.5rem 2rem 1.5rem 4rem", borderBottom: "1px solid var(--border)" }}>
                                                {prod.types?.length ? (
                                                    <table style={{ width: "100%", maxWidth: "600px", background: "var(--bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", borderCollapse: "collapse", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                                                        <thead style={{ background: "var(--surface)" }}>
                                                            <tr>
                                                                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Variant Type</th>
                                                                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "right", borderBottom: "1px solid var(--border)" }}>Price (Rs.)</th>
                                                                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {prod.types.map((t, tIdx) => (
                                                                <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                                                    <td 
                                                                        onDoubleClick={() => setEditingCell({ productId: prod.id, typeIndex: tIdx, field: 'typeName', value: t.typeName })}
                                                                        style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", cursor: "text" }}
                                                                        title="Double click to edit"
                                                                    >
                                                                        {editingCell?.productId === prod.id && editingCell.typeIndex === tIdx && editingCell.field === 'typeName' ? (
                                                                            <input 
                                                                                autoFocus
                                                                                value={editingCell.value}
                                                                                onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                                                                                onBlur={() => handleInlineEditSave(prod)}
                                                                                onKeyDown={e => { if (e.key === 'Enter') handleInlineEditSave(prod); if (e.key === 'Escape') setEditingCell(null); }}
                                                                                style={{ width: "100%", padding: "0.2rem 0.5rem", border: "1px solid var(--vet-blue)", borderRadius: "4px", outline: "none", background: "var(--bg)", color: "var(--text-primary)" }}
                                                                            />
                                                                        ) : (
                                                                            t.typeName
                                                                        )}
                                                                    </td>
                                                                    <td 
                                                                        onDoubleClick={() => setEditingCell({ productId: prod.id, typeIndex: tIdx, field: 'price', value: t.price.toString() })}
                                                                        style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#10b981", fontWeight: 800, textAlign: "right", cursor: "text" }}
                                                                        title="Double click to edit price"
                                                                    >
                                                                        {editingCell?.productId === prod.id && editingCell.typeIndex === tIdx && editingCell.field === 'price' ? (
                                                                            <input 
                                                                                autoFocus
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={editingCell.value}
                                                                                onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                                                                                onBlur={() => handleInlineEditSave(prod)}
                                                                                onKeyDown={e => { if (e.key === 'Enter') handleInlineEditSave(prod); if (e.key === 'Escape') setEditingCell(null); }}
                                                                                style={{ width: "80px", padding: "0.2rem 0.5rem", border: "1px solid var(--vet-blue)", borderRadius: "4px", outline: "none", background: "var(--bg)", color: "var(--text-primary)", textAlign: "right" }}
                                                                            />
                                                                        ) : (
                                                                            t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                                                                        <button onClick={() => toggleTypeSoldOut(prod.id, t.id!)} style={{
                                                                            background: t.soldOut ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                                                            color: t.soldOut ? "rgb(239, 68, 68)" : "rgb(16, 185, 129)",
                                                                            border: `1px solid ${t.soldOut ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                                                                            padding: "0.2rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "0.3rem"
                                                                        }}>
                                                                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor" }}></span>
                                                                            {t.soldOut ? "SOLD OUT" : "IN STOCK"}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No variants found for this product.</div>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                        ))}
                        {!isLoading && displayedProducts.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: "4rem 2rem", textAlign: "center" }}>
                                    <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>🔍</div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No products found</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Try adjusting your search or filter criteria.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {!isLoading && displayedProducts.length < filteredProducts.length && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "2rem", borderTop: "1px solid var(--border)" }}>
                        <button 
                            onClick={() => setDisplayCount(prev => prev + 15)}
                            style={{
                                background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)",
                                padding: "0.6rem 2rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                boxShadow: "var(--shadow-sm)"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--vet-blue)"; e.currentTarget.style.color = "var(--vet-blue)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                        >
                            Load More Products ↓
                        </button>
                    </div>
                )}
            </div>

            {/* Product Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeForm}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", zIndex: 1000 }} />
                        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, pointerEvents: "none" }}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "0", width: "min(850px, 94vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", pointerEvents: "all", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                                
                                {/* Modal Header */}
                                <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }}>
                                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                                        {editingId ? "✏️ Edit Product details" : "✨ Create New Product"}
                                    </h2>
                                    <button onClick={closeForm} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%" }}>×</button>
                                </div>

                                {/* Modal Body */}
                                <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
                                    <form id="product-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                            {/* Basic Info */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>PRODUCT NAME <span style={{ color: "red" }}>*</span></label>
                                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Premium Dog Food"
                                                        style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s" }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>CATEGORY <span style={{ color: "red" }}>*</span></label>
                                                    <select required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                                        style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none" }}>
                                                        <option value="" disabled>Select a category</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>DESCRIPTION <span style={{ color: "red" }}>*</span></label>
                                                    <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide detailed product information..."
                                                        style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "0.95rem", minHeight: "120px", resize: "vertical", outline: "none" }} />
                                                </div>
                                            </div>

                                            {/* Media & Status */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                                <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "1rem" }}>MAIN PRODUCT IMAGE</label>
                                                    <ImageUpload label="" value={imageUrl} onUpload={(url: string) => setImageUrl(url)} />
                                                </div>

                                                <div style={{ border: `1px solid ${isProductSoldOut ? "rgba(239,68,68,0.5)" : "var(--border)"}`, borderRadius: "var(--radius-md)", padding: "1rem", background: isProductSoldOut ? "rgba(239,68,68,0.05)" : "var(--bg)", transition: "all 0.2s" }}>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                                                        <div style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                                                            <input type="checkbox" checked={isProductSoldOut} onChange={e => setIsProductSoldOut(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                                            <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isProductSoldOut ? "#EF4444" : "#cbd5e1", transition: ".4s", borderRadius: "34px" }}>
                                                                <span style={{ position: "absolute", content: '""', height: "18px", width: "18px", left: isProductSoldOut ? "22px" : "3px", bottom: "3px", backgroundColor: "white", transition: ".4s", borderRadius: "50%" }}></span>
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: isProductSoldOut ? "#EF4444" : "var(--text-primary)", fontSize: "0.95rem" }}>Mark as Sold Out</div>
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>This will hide the Add to Cart button globally</div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "0.5rem 0" }} />

                                        {/* Product Variants (Types) */}
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                                <div>
                                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Product Variants</h3>
                                                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.2rem 0 0 0" }}>Add different sizes, weights, or colors</p>
                                                </div>
                                                <button type="button" onClick={addTypeRow} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "0.5rem 1rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}>
                                                    + Add Variant
                                                </button>
                                            </div>
                                            
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                {types.map((type, index) => {
                                                    const isActive = activeTypeIndex === index;
                                                    return (
                                                        <div key={index} onClick={() => setActiveTypeIndex(index)}
                                                            style={{ border: `2px solid ${isActive ? "var(--vet-blue)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: "1.25rem", background: isActive ? "rgba(43, 89, 212, 0.02)" : "var(--surface)", cursor: "pointer", transition: "all 0.2s", boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.05)" : "none" }}>
                                                            
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: isActive ? "var(--vet-blue)" : "var(--border)", color: isActive ? "white" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>{index + 1}</div>
                                                                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: isActive ? "var(--vet-blue)" : "var(--text-primary)" }}>Variant Details</h4>
                                                                    {isActive && <span style={{ fontSize: "0.7rem", fontWeight: 800, background: "var(--vet-blue)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>ACTIVE</span>}
                                                                </div>
                                                                {types.length > 1 && (
                                                                    <button type="button" onClick={e => { e.stopPropagation(); removeTypeRow(index); }}
                                                                        style={{ color: "rgb(239, 68, 68)", background: "rgba(239, 68, 68, 0.1)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>✕</button>
                                                                )}
                                                            </div>
                                                            
                                                            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1.5rem", alignItems: "start" }}>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                                    <div>
                                                                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>VARIANT NAME <span style={{ color: "red" }}>*</span></label>
                                                                        <input type="text" placeholder="e.g. 500g, Large, Red" required value={type.typeName} onChange={e => updateTypeField(index, "typeName", e.target.value)}
                                                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>PRICE (LKR) <span style={{ color: "red" }}>*</span></label>
                                                                        <input type="number" required min="0" step="0.01" placeholder="0.00" value={type.price} onChange={e => updateTypeField(index, "price", e.target.value)}
                                                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
                                                                    </div>
                                                                    <div style={{ gridColumn: "1 / -1" }}>
                                                                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>SKU / PROJECT KEY</label>
                                                                        <input type="text" placeholder="Optional identifier (e.g. SKU-001)" value={type.projectKey} onChange={e => updateTypeField(index, "projectKey", e.target.value)}
                                                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
                                                                    </div>
                                                                    
                                                                    <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem", padding: "0.75rem", background: type.soldOut ? "rgba(239,68,68,0.05)" : "var(--bg)", borderRadius: "var(--radius-sm)", border: `1px solid ${type.soldOut ? "rgba(239,68,68,0.3)" : "var(--border)"}` }}>
                                                                        <label onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                                                                            <input type="checkbox" checked={!!type.soldOut} onChange={() => toggleTypeSoldOutInForm(index)} style={{ width: "16px", height: "16px" }} />
                                                                            <div>
                                                                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: type.soldOut ? "#EF4444" : "var(--text-primary)" }}>Variant Sold Out</div>
                                                                                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Only this specific variant will be disabled</div>
                                                                            </div>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
                                                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textAlign: "center" }}>VARIANT IMAGE</label>
                                                                    <ImageUpload label="" value={type.imageUrl} compact enableGlobalPaste={isActive} onUpload={(url: string) => updateTypeField(index, "imageUrl", url)} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Modal Footer */}
                                <div style={{ padding: "1.25rem 2rem", borderTop: "1px solid var(--border)", background: "var(--bg)", borderRadius: "0 0 var(--radius-xl) var(--radius-xl)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                                    <button type="button" onClick={closeForm} style={{ padding: "0.75rem 1.5rem", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", transition: "all 0.2s" }}>Cancel</button>
                                    <button type="submit" form="product-form" disabled={isSubmitting} className="btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "999px", fontWeight: 800, fontSize: "0.95rem", opacity: isSubmitting ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        {isSubmitting ? <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : null}
                                        {isSubmitting ? "Saving..." : editingId ? "Update Product" : "Publish Product"}
                                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
