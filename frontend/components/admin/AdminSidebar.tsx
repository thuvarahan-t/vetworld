"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = () => {
        if (confirm("Are you sure you want to log out of the admin panel?")) {
            localStorage.removeItem("vetworld_token");
            router.push("/");
        }
    };

    const links = [
        { href: "/admin", label: "Dashboard", icon: "📊" },
        { href: "/admin/categories", label: "Categories", icon: "📁" },
        { href: "/admin/products", label: "Products", icon: "🦴" },
        { href: "/admin/banners", label: "Banners", icon: "🖼️" },
        { href: "/admin/users", label: "Users", icon: "👥" },
    ];

    if (!isMounted) return null;

    return (
        <aside style={{
            width: "250px",
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            position: "sticky",
            top: 0,
        }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <Link href="/" style={{ textDecoration: "none", color: "var(--vet-blue)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.5px" }}>
                    VetWorld<span style={{ color: "var(--text-primary)" }}>Admin</span>
                </Link>
            </div>

            <nav style={{ flex: 1, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.85rem 1rem",
                            borderRadius: "var(--radius-md)",
                            textDecoration: "none",
                            color: isActive ? "var(--vet-blue)" : "var(--text-secondary)",
                            background: isActive ? "var(--vet-blue-light)" : "transparent",
                            fontWeight: isActive ? 600 : 500,
                            transition: "all var(--transition)",
                        }}>
                            <span style={{ fontSize: "1.2rem", filter: isActive ? "none" : "grayscale(100%) opacity(70%)" }}>{link.icon}</span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: "100%",
                        padding: "0.85rem",
                        borderRadius: "var(--radius-md)",
                        border: "1.5px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-primary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all var(--transition)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--vet-blue)"; e.currentTarget.style.color = "var(--vet-blue)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                >
                    <span>🚪</span> Logout
                </button>
            </div>
        </aside>
    );
}
