"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ui/ImageUpload";
import { useAdminBanners, revalidateBanners } from "@/lib/adminHooks";
import { authFetcher } from "@/lib/api";

interface Banner { id: number; imageUrl: string; redirectLink?: string; }

function BannerSkeleton() {
    return (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "200px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: "100px", height: "16px", borderRadius: "6px", background: "var(--border)" }} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ width: "60px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--border)" }} />
                    <div style={{ width: "60px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--border)" }} />
                </div>
            </div>
        </div>
    );
}

export default function AdminBannersPage() {
    const { data: banners = [], error, isLoading, mutate } = useAdminBanners();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [redirectLink, setRedirectLink] = useState("");

    const closeForm = useCallback(() => {
        setShowForm(false);
        setEditingId(null);
        setImageUrl("");
        setRedirectLink("");
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to remove this banner?")) return;
        mutate(prev => (prev || []).filter(b => b.id !== id), { revalidate: false });
        try {
            await authFetcher(`/admin/banners/${id}`, { method: "DELETE" });
            revalidateBanners();
        } catch (err: any) {
            alert(err.message);
            revalidateBanners();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const isEditing = editingId !== null;
            const saved = await authFetcher<Banner>(
                isEditing ? `/admin/banners/${editingId}` : "/admin/banners",
                {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify({ imageUrl, redirectLink: redirectLink || null }),
                }
            );
            if (isEditing) {
                mutate(prev => (prev || []).map(b => b.id === editingId ? saved : b), { revalidate: false });
            } else {
                mutate(prev => [...(prev || []), saved], { revalidate: false });
            }
            closeForm();
            revalidateBanners();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (banner: Banner) => {
        setEditingId(banner.id);
        setImageUrl(banner.imageUrl);
        setRedirectLink(banner.redirectLink || "");
        setShowForm(true);
    };

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>Banners</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage promotional homepage banners</p>
                </div>
                <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary"
                    style={{ padding: "0.6rem 1.2rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem" }}>+</span> Add Banner
                </button>
            </div>

            {error && (
                <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                    ⚠ {error.message}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => <BannerSkeleton key={i} />)
                ) : banners.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)", background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
                        No banners currently active. Add one to feature promotions on the homepage.
                    </div>
                ) : banners.map(banner => (
                    <div key={banner.id} style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ width: "100%", height: "200px", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
                            <img src={banner.imageUrl} alt={`Banner ${banner.id}`} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                            {banner.redirectLink && (
                                <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", padding: "0 3rem" }}>
                                    <div style={{ padding: "0.4rem 0.8rem", background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "var(--radius-sm)", display: "inline-block", fontSize: "0.85rem" }}>
                                        🔗 {banner.redirectLink}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Banner ID: #{banner.id}</div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => handleEdit(banner)}
                                    style={{ background: "var(--bg)", color: "var(--vet-blue)", border: "1px solid var(--border)", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(banner.id)}
                                    style={{ background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)", border: "none", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeForm}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 300 }} />
                        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 301, pointerEvents: "none" }}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "2rem", width: "min(500px, 90vw)", pointerEvents: "all", boxShadow: "var(--shadow-lg)" }}>
                                <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>{editingId ? "Edit Banner" : "Create Banner"}</h2>
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                                    <ImageUpload label="Banner Image" value={imageUrl} onUpload={(url: string) => setImageUrl(url)} />
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Redirect Link (Optional)</label>
                                        <input type="text" value={redirectLink} onChange={e => setRedirectLink(e.target.value)}
                                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)" }}
                                            placeholder="/category/1 OR https://external.com" />
                                    </div>
                                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                                        <button type="button" onClick={closeForm} style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, padding: "0.75rem", justifyContent: "center", opacity: isSubmitting ? 0.7 : 1 }}>
                                            {isSubmitting ? "Saving..." : editingId ? "Update Banner" : "Publish Banner"}
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
