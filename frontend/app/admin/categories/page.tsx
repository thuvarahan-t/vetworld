"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
    id: number;
    name: string;
    imageUrl: string;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/categories");
            if (!res.ok) throw new Error("Failed to fetch categories");
            const data = await res.json();
            setCategories(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/categories/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete category");
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("vetworld_token");
            const isEditing = editingId !== null;
            const url = isEditing
                ? `http://localhost:8080/api/admin/categories/${editingId}`
                : "http://localhost:8080/api/admin/categories";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, imageUrl })
            });
            if (!res.ok) throw new Error(`Failed to ${isEditing ? "update" : "create"} category`);
            const savedCat = await res.json();

            if (isEditing) {
                setCategories(prev => prev.map(c => c.id === editingId ? savedCat : c));
            } else {
                setCategories([...categories, savedCat]);
            }
            closeForm();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setImageUrl(cat.imageUrl || "");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setName("");
        setImageUrl("");
    };

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>Categories</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage product categories</p>
                </div>
                <button
                    onClick={() => { closeForm(); setShowForm(true); }}
                    className="btn-primary"
                    style={{ padding: "0.6rem 1.2rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
                >
                    <span style={{ fontSize: "1.2rem" }}>+</span> Add Category
                </button>
            </div>

            {/* Error Message */}
            {error && <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>Error: {error}</div>}

            {/* Loading State */}
            {isLoading ? (
                <div style={{ color: "var(--text-secondary)" }}>Loading categories...</div>
            ) : (
                <div style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    overflow: "hidden"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Image</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>#{cat.id}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--bg)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {cat.imageUrl ? (
                                                <img src={cat.imageUrl} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                <span style={{ fontSize: "1.2rem" }}>📁</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                style={{
                                                    background: "var(--bg)", color: "var(--vet-blue)", border: "1px solid var(--border)",
                                                    padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 600,
                                                    cursor: "pointer", transition: "all var(--transition)"
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                style={{
                                                    background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)",
                                                    border: "none", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)",
                                                    fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                                                    transition: "all var(--transition)"
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "rgb(239, 68, 68)"; e.currentTarget.style.color = "#fff"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "rgb(239, 68, 68)"; }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                                        No categories found. Click 'Add Category' to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Category Modal */}
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
                                    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "2rem",
                                    width: "min(400px, 90vw)", pointerEvents: "all", boxShadow: "var(--shadow-lg)"
                                }}
                            >
                                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>{editingId ? "Edit Category" : "Add Category"}</h2>
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Category Name</label>
                                        <input
                                            type="text" required value={name} onChange={e => setName(e.target.value)}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }}
                                            placeholder="e.g., Dog Food"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Image URL (Optional)</label>
                                        <input
                                            type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }}
                                            placeholder="https://example.com/image.png"
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                                        <button type="button" onClick={closeForm} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: "0.75rem", justifyContent: "center", opacity: isSubmitting ? 0.7 : 1 }}>
                                            {isSubmitting ? "Saving..." : editingId ? "Update Category" : "Save Category"}
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
