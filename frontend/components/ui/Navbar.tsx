"use client";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthModal, { User } from "./AuthModal";

export default function Navbar() {
    const router = useRouter();
    const totalItems = useCartStore((s) => s.totalItems());
    const [menuOpen, setMenuOpen] = useState(false);

    // Auth state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const confirmLogout = () => {
        setUser(null);
        localStorage.removeItem("vetworld_token");
        setShowLogoutConfirm(false);
    };

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/category/all?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

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
                            onClick={() => setShowLogoutConfirm(true)}
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

                {/* Auth: Regular User (logged in) */}
                {!user?.isAdmin && user && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Greeting */}
                        <span style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                            padding: "0.5rem 1rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1.5px solid var(--border)",
                        }}>
                            <UserIcon />
                            Hi {user.name}!
                        </span>

                        {/* Logout Button */}
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "rgb(239, 68, 68)",
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

                {/* Auth: Not logged in -> Show Login button */}
                {!user && (
                    <button
                        onClick={() => setIsAuthModalOpen(true)}
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
                        <span>Login</span>
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
                    <Image src="/logo.png" alt="VetWorld logo" width={34} height={34} priority />
                    <span>VetWorld</span>
                </Link>

                {/* Nav Links */}
                <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginLeft: "1rem" }}>
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/category/all">Products</NavLink>
                    <NavLink href="/categories">Categories</NavLink>
                </nav>

                {/* Search Bar - Center/Right Expansion */}
                <div style={{ flex: 1, display: "flex", justifyContent: "center", maxWidth: "600px" }}>
                    <form
                        onSubmit={handleSearch}
                        style={{
                            width: "100%",
                            position: "relative",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <div style={{
                            position: "absolute",
                            left: "12px",
                            opacity: 0.5,
                            display: "flex",
                            alignItems: "center",
                            pointerEvents: "none"
                        }}>
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for products, brands or equipment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            style={{
                                width: "100%",
                                padding: "0.6rem 1rem 0.6rem 2.5rem",
                                borderRadius: "var(--radius-md)",
                                border: "1.5px solid",
                                borderColor: isSearchFocused ? "var(--vet-blue)" : "var(--border)",
                                background: "var(--bg)",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontSize: "0.9rem",
                                transition: "all var(--transition)",
                                boxShadow: isSearchFocused ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "none"
                            }}
                        />
                    </form>
                </div>

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
                        {isMounted && totalItems > 0 && (
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

            {/* ── Logout Confirmation Dialog ── */}
            {showLogoutConfirm && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowLogoutConfirm(false)}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 300 }}
                    />

                    {/* Dialog centering wrapper */}
                    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 301, pointerEvents: "none" }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.88, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            style={{
                                background: "var(--surface)", borderRadius: "var(--radius-lg)",
                                boxShadow: "var(--shadow-lg)", padding: "2rem",
                                width: "min(380px, 90vw)", pointerEvents: "all",
                                textAlign: "center",
                            }}
                        >
                            {/* Warning icon */}
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                                Confirm Logout
                            </h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                                Are you sure you want to logout?<br />You will need to sign in again to access your account.
                            </p>

                            {/* Buttons */}
                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    style={{
                                        flex: 1, padding: "0.7rem 1.2rem", borderRadius: "var(--radius-sm)",
                                        border: "1.5px solid var(--border)", background: "transparent",
                                        color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem",
                                        cursor: "pointer", transition: "all var(--transition)",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--vet-blue)"; e.currentTarget.style.color = "var(--vet-blue)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    style={{
                                        flex: 1, padding: "0.7rem 1.2rem", borderRadius: "var(--radius-sm)",
                                        border: "none", background: "rgb(239, 68, 68)",
                                        color: "#fff", fontWeight: 600, fontSize: "0.9rem",
                                        cursor: "pointer", transition: "filter var(--transition)",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
                                    onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
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

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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
