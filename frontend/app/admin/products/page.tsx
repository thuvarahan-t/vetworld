"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ui/ImageUpload";

interface Category { id: number; name: string; }
interface Product {
    id: number;
    name: string;
    description: string;
    types: { id?: number; typeName: string; price: number; imageUrl?: string; projectKey?: string; soldOut?: boolean }[];
    imageUrl: string;
    topSelling: boolean;
    soldOut?: boolean;
    category?: Category;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [types, setTypes] = useState<{ id?: number; typeName: string; price: string; imageUrl: string; projectKey: string; soldOut?: boolean }[]>([{ typeName: "", price: "", imageUrl: "", projectKey: "", soldOut: false }]);
    const [imageUrl, setImageUrl] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isProductSoldOut, setIsProductSoldOut] = useState(false);
    const [activeTypeIndex, setActiveTypeIndex] = useState<number | null>(null);

    const addTypeRow = () => {
        setTypes((prev) => [...prev, { typeName: "", price: "", imageUrl: "", projectKey: "", soldOut: false }]);
    };

    const removeTypeRow = (index: number) => {
        setTypes((prev) => prev.filter((_, i) => i !== index));
    };

    const updateTypeField = (index: number, field: "typeName" | "price" | "imageUrl" | "projectKey", value: string) => {
        setTypes((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const toggleTypeSoldOutInForm = (index: number) => {
        setTypes((prev) => prev.map((item, i) => (i === index ? { ...item, soldOut: !item.soldOut } : item)));
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch("http://localhost:8080/api/products"),
                fetch("http://localhost:8080/api/categories")
            ]);
            if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch data");

            setProducts(await prodRes.json());
            setCategories(await catRes.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/products/${id}`, {
                method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete product");
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err: any) { alert(err.message); }
    };

    const toggleTopSelling = async (id: number) => {
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/products/${id}/top-selling`, {
                method: "PUT", headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to toggle top-selling status");
            const updated = await res.json();
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
        } catch (err: any) { alert(err.message); }
    };

    const toggleProductSoldOut = async (id: number) => {
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/products/${id}/sold-out`, {
                method: "PUT", headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to toggle sold-out status");
            const updated = await res.json();
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
        } catch (err: any) { alert(err.message); }
    };

    const toggleTypeSoldOut = async (productId: number, typeId: number) => {
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/products/${productId}/types/${typeId}/sold-out`, {
                method: "PUT", headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to toggle type sold-out status");
            const updated: Product = await res.json();
            setProducts(prev => prev.map(p => p.id === productId ? updated : p));

            if (editingId === productId) {
                setTypes(updated.types.map((t) => ({
                    id: t.id,
                    typeName: t.typeName,
                    price: t.price.toString(),
                    imageUrl: t.imageUrl || "",
                    projectKey: t.projectKey || "",
                    soldOut: !!t.soldOut,
                })));
            }
        } catch (err: any) { alert(err.message); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("vetworld_token");
            const payload = {
                name, description,
                imageUrl: types[0]?.imageUrl || imageUrl,
                categoryId: categoryId ? parseInt(categoryId) : null,
                soldOut: isProductSoldOut,
                types: types.map(t => ({
                    typeName: t.typeName,
                    price: parseFloat(t.price),
                    imageUrl: t.imageUrl || undefined,
                    projectKey: t.projectKey || undefined,
                    soldOut: !!t.soldOut,
                }))
            };
            const isEditing = editingId !== null;
            const url = isEditing
                ? `http://localhost:8080/api/admin/products/${editingId}`
                : "http://localhost:8080/api/admin/products";

            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Failed to ${isEditing ? "update" : "create"} product`);

            const savedProd = await res.json();

            if (isEditing) {
                setProducts(prev => prev.map(p => p.id === editingId ? savedProd : p));
            } else {
                setProducts([savedProd, ...products]);
            }

            closeForm();
        } catch (err: any) { alert(err.message); }
        finally { setIsSubmitting(false); }
    };

    const handleEdit = (prod: Product) => {
        setEditingId(prod.id);
        setName(prod.name);
        setDescription(prod.description);
        setImageUrl(prod.imageUrl);
        setCategoryId(prod.category ? prod.category.id.toString() : "");
        setIsProductSoldOut(!!prod.soldOut);

        if (prod.types && prod.types.length > 0) {
            setTypes(prod.types.map(t => ({ id: t.id, typeName: t.typeName, price: t.price.toString(), imageUrl: t.imageUrl || "", projectKey: t.projectKey || "", soldOut: !!t.soldOut })));
        } else {
            setTypes([{ typeName: "", price: "", imageUrl: "", projectKey: "", soldOut: false }]);
        }

        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setName("");
        setDescription("");
        setTypes([{ typeName: "", price: "", imageUrl: "", projectKey: "", soldOut: false }]);
        setImageUrl("");
        setCategoryId("");
        setIsProductSoldOut(false);
        setActiveTypeIndex(null);
    };

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>Products</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage inventory and pricing</p>
                </div>
                <button
                    onClick={() => {
                        closeForm(); // resets any existing editing state
                        setShowForm(true);
                    }}
                    className="btn-primary" style={{ padding: "0.6rem 1.2rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
                >
                    <span style={{ fontSize: "1.2rem" }}>+</span> Add Product
                </button>
            </div>

            {error && <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>Error: {error}</div>}

            {isLoading ? (
                <div style={{ color: "var(--text-secondary)" }}>Loading products...</div>
            ) : (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
                        <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Product</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Category</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Types</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Price</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "center" }}>Top Selling</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "center" }}>Sold Out</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((prod) => (
                                <tr key={prod.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "var(--bg)", overflow: "hidden" }}>
                                                {prod.imageUrl && <img src={prod.imageUrl} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{prod.name}</div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>#{prod.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{prod.category?.name || "Uncategorized"}</td>
                                    <td style={{ padding: "1rem", color: "var(--text-primary)" }}>
                                        {prod.types && prod.types.length > 0 ? prod.types.map(t => t.typeName).join(", ") : "-"}
                                    </td>
                                    <td style={{ padding: "1rem", color: "var(--text-primary)" }}>
                                        {prod.types && prod.types.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                {prod.types.map((t, idx) => (
                                                    <div key={t.id || idx} style={{ fontSize: "0.85rem" }}>
                                                        <span style={{ fontWeight: 600 }}>LKR {t.price.toFixed(2)}</span> <span style={{ color: "var(--text-secondary)" }}>({t.typeName})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No types</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "center" }}>
                                        <button
                                            onClick={() => toggleTopSelling(prod.id)}
                                            style={{
                                                background: prod.topSelling ? "rgba(16, 185, 129, 0.15)" : "var(--bg)",
                                                color: prod.topSelling ? "rgb(16, 185, 129)" : "var(--text-secondary)",
                                                border: `1px solid ${prod.topSelling ? "rgba(16, 185, 129, 0.3)" : "var(--border)"}`,
                                                padding: "0.4rem 0.8rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600,
                                                cursor: "pointer", transition: "all var(--transition)"
                                            }}
                                        >
                                            {prod.topSelling ? "★ Yes" : "☆ No"}
                                        </button>
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "center" }}>
                                        <button
                                            onClick={() => toggleProductSoldOut(prod.id)}
                                            style={{
                                                background: prod.soldOut ? "rgba(239, 68, 68, 0.14)" : "var(--bg)",
                                                color: prod.soldOut ? "rgb(220, 38, 38)" : "var(--text-secondary)",
                                                border: `1px solid ${prod.soldOut ? "rgba(239, 68, 68, 0.35)" : "var(--border)"}`,
                                                padding: "0.4rem 0.8rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700,
                                                cursor: "pointer", transition: "all var(--transition)"
                                            }}
                                        >
                                            {prod.soldOut ? "● Sold Out" : "○ Available"}
                                        </button>
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => handleEdit(prod)}
                                                style={{
                                                    background: "var(--bg)", color: "var(--vet-blue)", border: "1px solid var(--border)",
                                                    padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 600,
                                                    cursor: "pointer", transition: "all var(--transition)"
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prod.id)}
                                                style={{
                                                    background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)", border: "none",
                                                    padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 600,
                                                    cursor: "pointer", transition: "all var(--transition)"
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Product Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeForm}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 300 }}
                        />
                        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 301, pointerEvents: "none" }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                style={{
                                    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "1.5rem",
                                    width: "min(760px, 94vw)", maxHeight: "90vh", overflowY: "auto",
                                    pointerEvents: "all", boxShadow: "var(--shadow-lg)"
                                }}
                            >
                                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>{editingId ? "Edit Product" : "Add Product"}</h2>
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Product Name</label>
                                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Category</label>
                                        <select required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }}>
                                            <option value="" disabled>Select a category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Product Types</label>
                                            <button type="button" onClick={addTypeRow} style={{ background: "transparent", color: "rgb(16, 185, 129)", border: "none", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>+ Add Type</button>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {types.map((type, index) => {
                                                const isActive = activeTypeIndex === index;
                                                return (
                                                <div
                                                    key={index}
                                                    onClick={() => setActiveTypeIndex(index)}
                                                    style={{
                                                        border: `2px solid ${isActive ? "var(--vet-blue)" : "var(--border)"}`,
                                                        borderRadius: "var(--radius-md)",
                                                        padding: "0.75rem",
                                                        background: isActive ? "rgba(43, 89, 212, 0.04)" : "var(--bg)",
                                                        cursor: "pointer",
                                                        transition: "border-color 0.15s, background 0.15s"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: isActive ? "var(--vet-blue)" : "var(--text-secondary)" }}>Type {index + 1}</p>
                                                            {isActive && (
                                                                <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "var(--vet-blue)", color: "#fff", padding: "0.15rem 0.5rem", borderRadius: "20px", letterSpacing: "0.02em" }}>
                                                                    📋 PASTE HERE
                                                                </span>
                                                            )}
                                                        </div>
                                                        {types.length > 1 && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeTypeRow(index); }} style={{ color: "rgb(239, 68, 68)", background: "rgba(239, 68, 68, 0.1)", border: "none", width: "30px", height: "30px", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                        )}
                                                    </div>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "start" }}>
                                                        {/* Left: inputs */}
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                                            <input type="text" placeholder="Type name (ex: 20ml)" required value={type.typeName} onChange={e => updateTypeField(index, "typeName", e.target.value)} style={{ padding: "0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "0.85rem" }} />
                                                            <input type="number" required min="0" step="0.01" placeholder="Price (LKR)" value={type.price} onChange={e => updateTypeField(index, "price", e.target.value)} style={{ padding: "0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "0.85rem" }} />
                                                            <input type="text" placeholder="Product Key (e.g. vet001)" value={type.projectKey} onChange={e => updateTypeField(index, "projectKey", e.target.value)} style={{ padding: "0.6rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "0.85rem" }} />
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                                                                <label
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: type.soldOut ? "rgb(220, 38, 38)" : "var(--text-secondary)" }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!type.soldOut}
                                                                        onChange={() => toggleTypeSoldOutInForm(index)}
                                                                    />
                                                                    Type Sold Out
                                                                </label>
                                                                {editingId && type.id && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleTypeSoldOut(editingId, type.id!);
                                                                        }}
                                                                        style={{
                                                                            border: `1px solid ${type.soldOut ? "rgba(239, 68, 68, 0.35)" : "var(--border)"}`,
                                                                            background: type.soldOut ? "rgba(239, 68, 68, 0.12)" : "var(--surface)",
                                                                            color: type.soldOut ? "rgb(220, 38, 38)" : "var(--text-secondary)",
                                                                            borderRadius: "999px",
                                                                            padding: "0.2rem 0.6rem",
                                                                            fontSize: "0.72rem",
                                                                            fontWeight: 700,
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        {type.soldOut ? "Saved: Sold Out" : "Saved: Available"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Right: image */}
                                                        <ImageUpload
                                                            label="Image (Optional)"
                                                            value={type.imageUrl}
                                                            compact
                                                            enableGlobalPaste={isActive}
                                                            onUpload={(url: string) => updateTypeField(index, "imageUrl", url)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Description</label>
                                        <textarea required value={description} onChange={e => setDescription(e.target.value)}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", minHeight: "80px", resize: "vertical" }} />
                                    </div>
                                    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0.75rem", background: "var(--bg)" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={isProductSoldOut}
                                                onChange={(e) => setIsProductSoldOut(e.target.checked)}
                                            />
                                            <span style={{ fontWeight: 700, color: isProductSoldOut ? "rgb(220, 38, 38)" : "var(--text-primary)" }}>
                                                Mark entire product as Sold Out
                                            </span>
                                        </label>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                                        <button type="button" onClick={closeForm} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: "0.75rem", justifyContent: "center", opacity: isSubmitting ? 0.7 : 1 }}>
                                            {isSubmitting ? "Saving..." : (editingId ? "Update Product" : "Save Product")}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
