"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AdminStats {
    totalProducts: number;
    totalCategories: number;
    totalBanners: number;
    totalUsers: number;
    topSellingCount: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("vetworld_token");
                const res = await fetch("http://localhost:8080/api/admin/stats", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch stats");
                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = stats ? [
        { title: "Total Users", value: stats.totalUsers, icon: "👥", color: "#3B82F6" },
        { title: "Total Products", value: stats.totalProducts, icon: "🦴", color: "#10B981" },
        { title: "Total Categories", value: stats.totalCategories, icon: "📁", color: "#F59E0B" },
        { title: "Total Banners", value: stats.totalBanners, icon: "🖼️", color: "#8B5CF6" },
        { title: "Top Selling Items", value: stats.topSellingCount, icon: "🔥", color: "#EF4444" },
    ] : [];

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    Dashboard Overview
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>Welcome to the VetWorld Admin Panel</p>
            </div>

            {isLoading && <div style={{ color: "var(--text-secondary)" }}>Loading stats...</div>}
            {error && <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)" }}>Error: {error}</div>}

            {!isLoading && !error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                    {statCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            style={{
                                background: "var(--surface)",
                                borderRadius: "var(--radius-lg)",
                                padding: "1.5rem",
                                border: "1px solid var(--border)",
                                boxShadow: "var(--shadow-sm)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "12px",
                                    background: `${card.color}15`, color: card.color,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.5rem"
                                }}>
                                    {card.icon}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                                    {card.value}
                                </h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.4rem", fontWeight: 500 }}>
                                    {card.title}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
