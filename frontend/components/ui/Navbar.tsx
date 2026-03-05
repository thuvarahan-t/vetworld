"use client";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import AuthModal, { User } from "./AuthModal";

export default function Navbar() {
    const totalItems = useCartStore((s) => s.totalItems());
    const [menuOpen, setMenuOpen] = useState(false);

    // Auth state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        setIsMounted(true);
        const storedUser = localStorage.getItem("vetworld_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }
    }, []);

    // Save to local storage when user changes
    useEffect(() => {
        if (isMounted) {
            if (user) {
                localStorage.setItem("vetworld_user", JSON.stringify(user));
            } else {
                localStorage.removeItem("vetworld_user");
            }
        }
    }, [user, isMounted]);

    // Don't render auth buttons until mounted to prevent hydration mismatch
    const renderAuth = () => {
        if (!isMounted) return null;

        return (
            <>
                {/* Admin Buttons (Only visible if isAdmin) */}
                {user?.isAdmin && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Link
                            href="/admin"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                background: "var(--vet-orange)",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "var(--radius-sm)",
                                transition: "filter var(--transition)",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
                        >
                            <DashboardIcon />
                            <span>Dashboard</span>
                        </Link>

                        <button
                            onClick={() => setUser(null)} // Explicit Logout
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                background: "rgba(239, 68, 68, 0.1)", // Light red background
                                color: "rgb(239, 68, 68)", // Red text
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                transition: "all var(--transition)",
                                cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            }}
                        >
                            <LogoutIcon />
                            <span>Logout</span>
                        </button>
                    </div>
                )}

                {/* Auth Button for Regular Users / Login Trigger */}
                {!user?.isAdmin && (
                    <button
                        onClick={() => {
                            if (user) setUser(null); // Logout functionality for regular users
                            else setIsAuthModalOpen(true);   // Open modal
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            background: "transparent",
                            color: "var(--text-primary)",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1.5px solid var(--border)",
                            transition: "all var(--transition)",
                            cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--vet-blue)";
                            e.currentTarget.style.color = "var(--vet-blue)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                    >
                        <UserIcon />
                        <span>{user ? `Hi ${user.name}` : "Login"}</span>
                    </button>
                )}
            </>
        );
    };

    return (
        <header
            style={{
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}
        >
            <div className="container-main" style={{ display: "flex", alignItems: "center", height: 64, gap: "1.5rem" }}>
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "1.25rem", color: "var(--vet-blue)" }}>
                    <span style={{ fontSize: "1.5rem" }}>🐾</span>
                    <span>VetWorld</span>
                </Link>

                {/* Nav Links */}
                <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginLeft: "1rem", flex: 1 }}>
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/category/all">Products</NavLink>
                </nav>

                {/* Actions: Cart + Auth */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {renderAuth()}

                    {/* Cart */}
                    <Link
                        href="/cart"
                        id="nav-cart-icon"
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            background: "var(--vet-blue-light)",
                            color: "var(--vet-blue)",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "var(--radius-sm)",
                            transition: "background var(--transition)",
                        }}
                    >
                        <CartIcon />
                        <span>Cart</span>
                        {totalItems > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="badge"
                                style={{ position: "absolute", top: -8, right: -8 }}
                            >
                                {totalItems}
                            </motion.span>
                        )}
                    </Link>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={(u) => setUser(u)}
            />
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            style={{
                color: "var(--text-secondary)",
                fontWeight: 500,
                fontSize: "0.9rem",
                transition: "color var(--transition)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--vet-blue)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
            {children}
        </Link>
    );
}

function CartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );
}

function DashboardIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
    );
}
