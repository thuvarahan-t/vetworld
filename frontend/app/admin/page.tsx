"use client";

import { motion } from "framer-motion";
import { useAdminStats } from "@/lib/adminHooks";

const STAT_CONFIGS = [
    { key: "totalUsers",       label: "Total Users",       icon: "👥", color: "#3B82F6" },
    { key: "totalOrders",      label: "Total Orders",      icon: "📦", color: "#6366F1" },
    { key: "pendingOrders",    label: "Pending Orders",    icon: "⏳", color: "#F59E0B" },
    { key: "totalProducts",    label: "Total Products",    icon: "🦴", color: "#10B981" },
    { key: "totalCategories",  label: "Total Categories",  icon: "📁", color: "#F59E0B" },
    { key: "topSellingCount",  label: "Top Selling Items", icon: "🔥", color: "#EF4444" },
] as const;

function StatSkeleton() {
    return (
        <div style={{
            background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "1.5rem",
            border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "1rem",
            animation: "pulse 1.5s ease-in-out infinite",
        }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--border)" }} />
            <div>
                <div style={{ width: "60px", height: "28px", borderRadius: "6px", background: "var(--border)", marginBottom: "0.5rem" }} />
                <div style={{ width: "100px", height: "14px", borderRadius: "6px", background: "var(--border)" }} />
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { data: stats, error, isLoading } = useAdminStats();

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>

            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    Dashboard Overview
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>Welcome to the VetWorld Admin Panel</p>
            </div>

            {error && (
                <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                    ⚠ Failed to load stats: {error.message}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                {isLoading
                    ? STAT_CONFIGS.map(c => <StatSkeleton key={c.key} />)
                    : STAT_CONFIGS.map((cfg, idx) => {
                        const value = stats ? (stats as any)[cfg.key] ?? 0 : 0;
                        return (
                            <motion.div
                                key={cfg.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.07, duration: 0.35 }}
                                style={{
                                    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "1.5rem",
                                    border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                                    display: "flex", flexDirection: "column", gap: "1rem",
                                }}
                            >
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "12px",
                                    background: `${cfg.color}18`, display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
                                }}>
                                    {cfg.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                                        {value.toLocaleString()}
                                    </h3>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.4rem", fontWeight: 500 }}>
                                        {cfg.label}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })
                }
            </div>
        </div>
    );
}
