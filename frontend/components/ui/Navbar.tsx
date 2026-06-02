"use client";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import AuthModal, { User } from "./AuthModal";
import ProfileModal from "./ProfileModal";
import SearchSuggestions from "./SearchSuggestions";
import { userApi } from "@/lib/api";
import { useProductSearch } from "@/lib/useProductSearch";

// useLayoutEffect warns during SSR; fall back to useEffect on the server so the
// pill measurement (client-only) stays warning-free.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const totalItems = useCartStore((s) => s.totalItems());
    const [menuOpen, setMenuOpen] = useState(false);
    // Count of orders whose status changed since the user last opened the Orders
    // page — shown as a notification badge next to the Orders icon.
    const [orderUpdates, setOrderUpdates] = useState(0);

    // Auth state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const mobileSearchBtnRef = useRef<HTMLButtonElement>(null);

    // Live type-ahead matches for the search boxes (shared cache; see hook).
    const { results: searchResults } = useProductSearch(searchQuery);
    // Called when a suggestion is chosen — collapse both search surfaces.
    const onSuggestionSelect = () => {
        setIsMobileSearchOpen(false);
        setIsSearchFocused(false);
    };

    // Mobile: collapse the search drop-down when tapping anywhere outside it
    // (but not on the toggle button, which manages its own open/close).
    useEffect(() => {
        if (!isMobileSearchOpen) return;
        const handleOutside = (e: PointerEvent) => {
            const t = e.target as Node;
            if (mobileSearchRef.current?.contains(t)) return;
            if (mobileSearchBtnRef.current?.contains(t)) return;
            setIsMobileSearchOpen(false);
        };
        document.addEventListener("pointerdown", handleOutside);
        return () => document.removeEventListener("pointerdown", handleOutside);
    }, [isMobileSearchOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isProfileDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent | PointerEvent | TouchEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    const confirmLogout = async () => {
        try {
            // Clear auth cookies via backend
            await fetch("/api/auth/set-token", { method: "DELETE" });
        } catch (e) {
            console.error("Failed to logout:", e);
        }

        setUser(null);
        localStorage.removeItem("vetworld_user");
        // Clear persisted cart so next user doesn't see previous user's items
        localStorage.removeItem("vetworld-cart");
        setShowLogoutConfirm(false);
    };

    // Load from local storage on mount, then refresh full profile (phone/address)
    // from the backend so "My Profile" always reflects the saved account details.
    useEffect(() => {
        setIsMounted(true);
        const storedUser = localStorage.getItem("vetworld_user");
        if (!storedUser) return;

        let parsed: User | null = null;
        try {
            parsed = JSON.parse(storedUser);
            setUser(parsed);
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
            return;
        }

        // Re-hydrate from the server using the auth cookie. Ignore failures
        // (e.g. expired session) — fetcher already handles 401 cleanup.
        userApi.getMe()
            .then((me) => {
                setUser((prev) => ({
                    ...prev,
                    name: me.name,
                    email: me.email,
                    isAdmin: me.role === "ADMIN",
                    phone: me.phone,
                    address: me.address,
                }));
            })
            .catch(() => { /* keep localStorage copy */ });
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

    // ── Order-update notifications ───────────────────────────────────────────
    // Poll the user's orders and badge the Orders icon with how many have changed
    // status since they last viewed the Orders page. The "seen" snapshot is kept
    // per-user in localStorage so a status change (or a new order) shows up, and
    // visiting /orders clears it.
    useEffect(() => {
        if (!isMounted || !user?.email) { setOrderUpdates(0); return; }

        const seenKey = `vetworld_orders_seen:${user.email}`;
        const readSeen = (): Record<string, string> => {
            try { return JSON.parse(localStorage.getItem(seenKey) || "{}"); } catch { return {}; }
        };
        const onOrdersPage = pathname?.startsWith("/orders") ?? false;

        let cancelled = false;
        const refresh = async () => {
            try {
                const orders = await userApi.getMyOrders();
                if (cancelled) return;
                const current: Record<string, string> = {};
                for (const o of orders) current[String(o.id)] = o.status;

                // First run for this user: seed the baseline silently (don't badge
                // pre-existing orders).
                if (localStorage.getItem(seenKey) === null) {
                    localStorage.setItem(seenKey, JSON.stringify(current));
                    setOrderUpdates(0);
                    return;
                }

                if (onOrdersPage) {
                    // They're looking at the orders — mark everything as seen.
                    localStorage.setItem(seenKey, JSON.stringify(current));
                    setOrderUpdates(0);
                } else {
                    const seen = readSeen();
                    const changed = orders.filter((o) => seen[String(o.id)] !== o.status).length;
                    setOrderUpdates(changed);
                }
            } catch { /* ignore — keep last known count */ }
        };

        refresh();
        const timer = setInterval(refresh, 30000);
        const onFocus = () => refresh();
        window.addEventListener("focus", onFocus);
        return () => {
            cancelled = true;
            clearInterval(timer);
            window.removeEventListener("focus", onFocus);
        };
    }, [isMounted, user?.email, pathname]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/category/all?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // Don't render auth buttons until mounted to prevent hydration mismatch
    const renderAuth = () => {
        if (!isMounted) return null;

        if (user) {
            return (
                <div style={{ position: "relative" }} ref={profileDropdownRef}>
                    <button
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="nav-action"
                        aria-label="Profile"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "var(--bg)",
                            color: "var(--text-primary)",
                            border: "1.5px solid var(--border)",
                            cursor: "pointer",
                            transition: "all var(--transition)",
                            overflow: "hidden",
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--vet-blue)";
                            e.currentTarget.style.color = "var(--vet-blue)";
                        }}
                        onMouseLeave={(e) => {
                            if (!isProfileDropdownOpen) {
                                e.currentTarget.style.borderColor = "var(--border)";
                                e.currentTarget.style.color = "var(--text-primary)";
                            }
                        }}
                    >
                        <UserIcon size={22} />
                    </button>

                    <AnimatePresence>
                        {isProfileDropdownOpen && (
                            <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    style={{
                                        position: "absolute",
                                        top: "calc(100% + 12px)",
                                        right: 0,
                                        width: "240px",
                                        background: "var(--surface)",
                                        borderRadius: "var(--radius-md)",
                                        boxShadow: "var(--shadow-lg)",
                                        border: "1px solid var(--border)",
                                        zIndex: 100,
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* User Info Header */}
                                    <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{user.name}</div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.2rem" }}>{user.email}</div>
                                    </div>

                                    {/* Menu Items */}
                                    <div style={{ padding: "0.5rem" }}>
                                        <button
                                            onClick={() => {
                                                setIsProfileDropdownOpen(false);
                                                setIsProfileModalOpen(true);
                                            }}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.75rem",
                                                padding: "0.75rem 0.85rem",
                                                borderRadius: "var(--radius-sm)",
                                                border: "none",
                                                background: "transparent",
                                                color: "var(--text-primary)",
                                                fontWeight: 500,
                                                fontSize: "0.9rem",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                textAlign: "left",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "var(--bg)";
                                                e.currentTarget.style.color = "var(--vet-blue)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = "var(--text-primary)";
                                            }}
                                        >
                                            <span style={{ fontSize: "1.1rem" }}>👤</span>
                                            <span>My Profile</span>
                                        </button>

                                        {user.isAdmin && (
                                            <DropdownLink href="/admin" icon={<DashboardIcon />} label="Admin Dashboard" onClick={() => setIsProfileDropdownOpen(false)} />
                                        )}

                                        <div style={{ height: "1px", background: "var(--border)", margin: "0.5rem" }} />

                                        <button
                                            onClick={() => {
                                                setIsProfileDropdownOpen(false);
                                                setShowLogoutConfirm(true);
                                            }}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.75rem",
                                                padding: "0.75rem 0.85rem",
                                                borderRadius: "var(--radius-sm)",
                                                border: "none",
                                                background: "transparent",
                                                color: "rgb(239, 68, 68)",
                                                fontWeight: 600,
                                                fontSize: "0.9rem",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                textAlign: "left",
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                            <LogoutIcon />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        return (
            <button
                onClick={() => setIsAuthModalOpen(true)}
                className="nav-action"
                aria-label="Login"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "var(--bg)",
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
                <span className="nav-action-label">Login</span>
            </button>
        );
    };

    return (
        <>
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
                transition: "all var(--transition)",
            }}
        >
            <div className="container-main nav-top-row" style={{ display: "flex", alignItems: "center", height: 64, gap: "1.5rem" }}>
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "1.25rem", color: "var(--vet-blue)", flexShrink: 0 }}>
                    <Image src="/logo.png" alt="VetWorld logo" width={34} height={34} priority />
                    <span className="nav-logo-text">VetWorld</span>
                </Link>

                {/* Nav Links (desktop only — mobile uses the floating bottom bar) */}
                <NavLinks />

                {/* Search Bar - Center/Right Expansion */}
                <div className="nav-search" style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center", maxWidth: "600px", minWidth: 0 }}>
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
                                padding: "0.65rem 1rem 0.65rem 2.75rem",
                                borderRadius: "var(--radius-lg)",
                                border: "1px solid",
                                borderColor: isSearchFocused ? "rgba(26,115,232,0.4)" : "rgba(0,0,0,0.05)",
                                background: isSearchFocused ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.4)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontSize: "0.9rem",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: isSearchFocused ? "0 8px 32px rgba(26, 115, 232, 0.1)" : "none",
                            }}
                        />
                    </form>

                    {/* Desktop type-ahead suggestions. onMouseDown preventDefault keeps the
                        input focused so clicking a result fires before the blur closes it. */}
                    {isSearchFocused && searchQuery.trim().length > 0 && (
                        <div
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ position: "absolute", top: "calc(100% + 0.5rem)", left: 0, right: 0, zIndex: 110 }}
                        >
                            <SearchSuggestions results={searchResults} query={searchQuery} onSelect={onSuggestionSelect} />
                        </div>
                    )}
                </div>

                {/* Actions: Cart + Auth */}
                <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                    {/* Search (mobile only — desktop uses the inline search bar) */}
                    <button
                        ref={mobileSearchBtnRef}
                        type="button"
                        className="nav-action nav-mobile-only"
                        aria-label="Search"
                        onClick={() => setIsMobileSearchOpen((v) => !v)}
                    >
                        <SearchIcon />
                    </button>

                    {/* My Orders (Visible when logged in) */}
                    {isMounted && user && (
                        <Link
                            href="/orders"
                            className="nav-action"
                            aria-label={orderUpdates > 0 ? `My Orders (${orderUpdates} updated)` : "My Orders"}
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                background: "var(--bg)",
                                color: "var(--text-primary)",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "var(--radius-sm)",
                                border: "1.5px solid var(--border)",
                                transition: "all var(--transition)",
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
                            <OrdersIcon />
                            <span className="nav-action-label">My Orders</span>
                            {orderUpdates > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="badge"
                                    style={{ position: "absolute", top: -8, right: -8 }}
                                >
                                    {orderUpdates}
                                </motion.span>
                            )}
                        </Link>
                    )}

                    {/* Cart */}
                    <Link
                        href="/cart"
                        id="nav-cart-icon"
                        className="nav-action"
                        aria-label="Cart"
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            background: "var(--bg)",
                            color: "var(--text-primary)",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1.5px solid var(--border)",
                            transition: "all var(--transition)",
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
                        <CartIcon />
                        <span className="nav-action-label">Cart</span>
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

                    {renderAuth()}
                </div>
            </div>

            {/* Mobile search drop-down — overlays (absolute) so it never shifts the bar */}
            <AnimatePresence>
                {isMobileSearchOpen && (
                    <motion.div
                        ref={mobileSearchRef}
                        className="nav-mobile-search"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            padding: "0.75rem 0.85rem",
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            borderBottom: "1px solid rgba(255,255,255,0.4)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
                        }}
                    >
                        <form
                            onSubmit={(e) => { handleSearch(e); setIsMobileSearchOpen(false); }}
                            style={{ position: "relative", display: "flex", alignItems: "center" }}
                        >
                            <div style={{ position: "absolute", left: "12px", opacity: 0.5, display: "flex", pointerEvents: "none" }}>
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search products, brands or equipment..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.7rem 1rem 0.7rem 2.75rem",
                                    borderRadius: "var(--radius-lg)",
                                    border: "1px solid rgba(26,115,232,0.4)",
                                    background: "rgba(255,255,255,0.9)",
                                    color: "var(--text-primary)",
                                    outline: "none",
                                    fontSize: "0.95rem",
                                }}
                            />
                        </form>

                        {/* Live suggestions under the mobile search input */}
                        {searchQuery.trim().length > 0 && (
                            <div style={{ marginTop: "0.6rem" }}>
                                <SearchSuggestions results={searchResults} query={searchQuery} onSelect={onSuggestionSelect} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={(u) => setUser(u)}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={user}
                onUpdateSuccess={(u) => setUser({ ...user, ...u })}
            />

        </header>

            {/* ── Floating Bottom Nav (mobile only) ── */}
            <MobileBottomNav
                isLoggedIn={isMounted && !!user}
                onRequireAuth={() => setIsAuthModalOpen(true)}
                orderBadge={orderUpdates}
            />

            {/* ── Logout Confirmation Dialog (Portal) ── */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {showLogoutConfirm && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", zIndex: 2147483646 }}
                            />

                            {/* Dialog centering wrapper */}
                            <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2147483647, pointerEvents: "none" }}>
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
                </AnimatePresence>
            , document.body)}
        </>
    );
}

// `match` lists the route prefix(es) that mark a tab active — separate from
// `href` (where the tab links to). "Products" links to /category/all but stays
// active across every /category/* and /product/* page.
const NAV_ITEMS = [
    { href: "/", label: "Home", icon: HomeIcon, match: ["/"] },
    { href: "/category/all", label: "Products", icon: ProductsIcon, match: ["/category", "/product"] },
    { href: "/categories", label: "Categories", icon: CategoriesIcon, match: ["/categories"] },
];

// The mobile bottom bar adds Orders as a fourth tab (desktop keeps it as a
// separate top-right action that only appears when signed in).
const MOBILE_NAV_ITEMS = [
    ...NAV_ITEMS,
    { href: "/orders", label: "Orders", icon: OrdersIcon, match: ["/orders"] },
];

// True when `pathname` is, or sits under, `prefix` (segment-aware so
// "/categories" never matches the "/category" prefix). "/" matches only "/".
function matchesPrefix(pathname: string, prefix: string): boolean {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(prefix + "/");
}

// Determine which nav item matches the current route. Longest matched prefix
// wins so "/category" beats "/" on product pages, and "/" only matches exactly.
function getActiveHref(pathname: string, items = NAV_ITEMS): string | null {
    let activeHref: string | null = null;
    let bestLen = -1;
    for (const item of items) {
        for (const prefix of item.match) {
            if (matchesPrefix(pathname, prefix) && prefix.length > bestLen) {
                activeHref = item.href;
                bestLen = prefix.length;
            }
        }
    }
    return activeHref;
}

function NavLinks() {
    const pathname = usePathname();
    const [hovered, setHovered] = useState<string | null>(null);

    const activeHref = getActiveHref(pathname);

    // The pill follows the hovered item, falling back to the active route.
    const highlighted = hovered ?? activeHref;

    return (
        <nav
            className="nav-desktop-only"
            onMouseLeave={() => setHovered(null)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem" }}
        >
            {NAV_ITEMS.map((item) => {
                const isActive = item.href === activeHref;
                const isHighlighted = item.href === highlighted;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onMouseEnter={() => setHovered(item.href)}
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            padding: "0.5rem 1rem",
                            borderRadius: "999px",
                            fontWeight: isActive ? 700 : 500,
                            fontSize: "0.9rem",
                            color: isHighlighted ? "var(--vet-blue)" : "var(--text-secondary)",
                            transition: "color 0.25s ease",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {/* Travelling liquid-glass pill */}
                        {isHighlighted && (
                            <motion.span
                                layoutId="nav-glass-pill"
                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "999px",
                                    background: "linear-gradient(135deg, rgba(26,115,232,0.16), rgba(255,255,255,0.35))",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    border: "1px solid rgba(26,115,232,0.25)",
                                    boxShadow: "0 4px 18px rgba(26,115,232,0.18), inset 0 1px 1px rgba(255,255,255,0.6)",
                                    zIndex: 0,
                                }}
                            />
                        )}
                        <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

/* ── Floating glass bottom nav (mobile). A compact, content-width pill
   centred via left:50% + x:-50%; springs up on mount, and the travelling
   pill marks the active page. ── */
function MobileBottomNav({ isLoggedIn, onRequireAuth, orderBadge }: { isLoggedIn: boolean; onRequireAuth: () => void; orderBadge: number }) {
    const pathname = usePathname();
    const router = useRouter();
    const activeHref = getActiveHref(pathname, MOBILE_NAV_ITEMS);

    const navRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    // The single travelling pill, positioned from the active tab's measured rect.
    // `animate` stays false for the very first placement so the pill simply
    // appears under the active tab instead of sliding in from the corner.
    const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number; animate: boolean } | null>(null);
    // The glass is see-through, so the dark footer scrolling up behind it makes
    // the tabs hard to read. Track when the bar overlaps the footer and solidify
    // it to white in that case; stay glassy everywhere else.
    const [overFooter, setOverFooter] = useState(false);

    // iOS-26-style drag: press the bar and slide — the pill follows your finger
    // and you switch to whichever tab you release on. `drag` holds the live pill
    // x while dragging; `dragHref` is the tab currently under the finger.
    const [drag, setDrag] = useState<{ x: number } | null>(null);
    const [dragHref, setDragHref] = useState<string | null>(null);
    const dragState = useRef({ active: false, moved: false, startX: 0 });
    const suppressClickRef = useRef(false);

    // Re-measure whenever the active tab changes. Because the nav lives in the
    // persistent layout (never re-mounts), the previous pill position is kept,
    // so the pill always travels from the *current* tab to the next one —
    // 3rd→4th, never 1st→4th.
    useIsoLayoutEffect(() => {
        const measure = () => {
            const nav = navRef.current;
            const el = activeHref ? itemRefs.current[activeHref] : null;
            if (!nav || !el) return;
            const navRect = nav.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            setPill((prev) => ({
                x: r.left - navRect.left,
                y: r.top - navRect.top,
                w: r.width,
                h: r.height,
                animate: prev !== null, // skip the slide on the initial placement
            }));
        };
        measure();
        // Keep the pill aligned on viewport resize / orientation change.
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [activeHref]);

    // Watch whether the floating bar currently overlaps the (dark) footer.
    useEffect(() => {
        let raf = 0;
        const check = () => {
            raf = 0;
            const nav = navRef.current;
            const footer = document.querySelector("footer");
            if (!nav || !footer) return;
            const navRect = nav.getBoundingClientRect();
            const footerRect = footer.getBoundingClientRect();
            setOverFooter(footerRect.top < navRect.bottom && footerRect.bottom > navRect.top);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
        check();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [pathname]);

    // Navigate, honouring the Orders auth gate.
    const navTo = (href: string) => {
        if (href === "/orders" && !isLoggedIn) { onRequireAuth(); return false; }
        if (href !== pathname) router.push(href);
        return true;
    };

    // The tab whose box contains clientX (falls back to the nearest centre so a
    // finger past either end still selects the end tab).
    const hrefAtClientX = (clientX: number): string | null => {
        let best: string | null = null;
        let bestDist = Infinity;
        for (const item of MOBILE_NAV_ITEMS) {
            const el = itemRefs.current[item.href];
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (clientX >= r.left && clientX <= r.right) return item.href;
            const d = Math.abs(clientX - (r.left + r.width / 2));
            if (d < bestDist) { bestDist = d; best = item.href; }
        }
        return best;
    };

    const onPointerDown = (e: React.PointerEvent) => {
        dragState.current = { active: true, moved: false, startX: e.clientX };
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const st = dragState.current;
        if (!st.active || !pill) return;
        if (!st.moved) {
            if (Math.abs(e.clientX - st.startX) < 6) return; // ignore micro-jitter taps
            st.moved = true;
            navRef.current?.setPointerCapture?.(e.pointerId);
        }
        const nav = navRef.current;
        if (!nav) return;
        const navRect = nav.getBoundingClientRect();
        // Centre the pill on the finger, clamped to the first/last tab slots.
        const first = itemRefs.current[MOBILE_NAV_ITEMS[0].href]?.getBoundingClientRect();
        const last = itemRefs.current[MOBILE_NAV_ITEMS[MOBILE_NAV_ITEMS.length - 1].href]?.getBoundingClientRect();
        let x = e.clientX - navRect.left - pill.w / 2;
        if (first && last) x = Math.max(first.left - navRect.left, Math.min(last.left - navRect.left, x));
        setDrag({ x });
        setDragHref(hrefAtClientX(e.clientX));
    };

    const endDrag = () => {
        const st = dragState.current;
        dragState.current = { active: false, moved: false, startX: 0 };
        if (st.moved && dragHref) {
            // Suppress the click that the browser fires after the drag's pointerup.
            suppressClickRef.current = true;
            setTimeout(() => { suppressClickRef.current = false; }, 60);
            const ok = navTo(dragHref);
            // Snap the pill to the chosen tab (spring) when we actually navigate;
            // otherwise let it spring back to the current tab.
            const snapHref = ok ? dragHref : activeHref;
            const el = snapHref ? itemRefs.current[snapHref] : null;
            const nav = navRef.current;
            if (el && nav) {
                const navRect = nav.getBoundingClientRect();
                const r = el.getBoundingClientRect();
                setPill({ x: r.left - navRect.left, y: r.top - navRect.top, w: r.width, h: r.height, animate: true });
            }
        }
        setDrag(null);
        setDragHref(null);
    };

    // While dragging, the visual "active" tab is the one under the finger.
    const highlightHref = drag ? dragHref : activeHref;

    return (
        <>
        <motion.nav
            ref={navRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="mobile-bottom-nav"
            aria-label="Primary"
            initial={{ opacity: 0, y: 28, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
            style={{
                position: "fixed",
                left: "50%",
                bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.85rem)",
                width: "min(440px, calc(100% - 1.5rem))",
                zIndex: 200,
                display: "none", // switched to flex on mobile via CSS
                alignItems: "stretch",
                gap: "0.2rem",
                padding: "0.4rem",
                borderRadius: "999px",
                overflow: "hidden", // clip the reflection sheen to the rounded shape
                touchAction: "none", // let the slide-to-switch drag own touch input
                // Liquid-glass material: a translucent vertical tint over a strong
                // blur so the content behind shows through and refracts.
                background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.32) 100%)",
                backdropFilter: "blur(22px) saturate(200%) brightness(1.06)",
                WebkitBackdropFilter: "blur(22px) saturate(200%) brightness(1.06)",
                border: "1px solid rgba(255, 255, 255, 0.55)",
                boxShadow: [
                    "0 10px 36px rgba(31, 38, 135, 0.22)",   // soft float shadow
                    "0 2px 8px rgba(31, 38, 135, 0.10)",
                    "inset 0 1px 1px rgba(255, 255, 255, 0.95)",   // bright top specular edge
                    "inset 0 -10px 18px rgba(255, 255, 255, 0.20)", // soft inner bottom glow
                    "inset 0 0 0 0.5px rgba(255, 255, 255, 0.40)",  // crisp glass rim
                ].join(", "),
            }}
        >
            {/* Solid white underlay — fades in only while the bar overlaps the
                dark footer, so the tabs stay readable. Sits behind the pill and
                tab content (zIndex 0), above the blurred glass background. */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    background: "#ffffff",
                    opacity: overFooter ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Specular reflection — a glossy sheen across the top of the glass,
                like the iOS 26 / WhatsApp liquid-glass bar. Kept subtle and only
                over the upper half so the tab icons stay legible. Sits above the
                content (zIndex 2) so it reads as light on the glass surface. */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "52%",
                    borderRadius: "999px 999px 40% 40% / 999px 999px 100% 100%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.14) 55%, rgba(255,255,255,0) 100%)",
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            />
            {/* Single travelling liquid-glass pill — only `transform` animates, so
                the slide is GPU-composited and stays smooth even while the next
                page is rendering on the main thread. */}
            {pill && (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: pill.w,
                        height: pill.h,
                        // Follow the finger while dragging; otherwise sit on the active tab.
                        transform: `translate(${drag ? drag.x : pill.x}px, ${pill.y}px) scale(${drag ? 1.06 : 1})`,
                        // Hide on non-tab routes (cart/checkout/product) but keep the
                        // measured position so it can travel back in on return.
                        opacity: (activeHref || drag) ? 1 : 0,
                        borderRadius: "999px",
                        background: "linear-gradient(135deg, rgba(26,115,232,0.18), rgba(255,255,255,0.4))",
                        border: "1px solid rgba(26,115,232,0.3)",
                        boxShadow: drag
                            ? "0 8px 22px rgba(26,115,232,0.30), inset 0 1px 1px rgba(255,255,255,0.8)"
                            : "0 4px 16px rgba(26,115,232,0.22), inset 0 1px 1px rgba(255,255,255,0.7)",
                        transition: drag
                            ? "transform 0.10s ease-out, box-shadow 0.15s ease"
                            : pill.animate
                                ? "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), width 0.42s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, opacity 0.25s ease"
                                : "opacity 0.25s ease",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                />
            )}
            {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = item.href === activeHref;
                const isHighlighted = item.href === highlightHref;
                const Icon = item.icon;
                // Orders needs a session — prompt login instead of bouncing to home.
                const requiresAuth = item.href === "/orders" && !isLoggedIn;
                return (
                    <div key={item.href} style={{ flex: 1, position: "relative", zIndex: 1 }}>
                    <Link
                        ref={(el) => { itemRefs.current[item.href] = el; }}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        draggable={false}
                        onClick={(e) => {
                            // A click fired right after a slide-gesture — ignore it,
                            // the drag already navigated.
                            if (suppressClickRef.current) { e.preventDefault(); return; }
                            if (requiresAuth) { e.preventDefault(); onRequireAuth(); }
                        }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.15rem",
                            padding: "0.5rem 0",
                            borderRadius: "999px",
                            color: isHighlighted ? "var(--vet-blue)" : "var(--text-secondary)",
                            fontWeight: isHighlighted ? 700 : 500,
                            fontSize: "0.68rem",
                            transition: "color 0.25s ease",
                            transform: drag && isHighlighted ? "scale(1.04)" : "scale(1)",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        <span style={{ position: "relative", display: "flex", transition: "transform 0.18s ease", transform: drag && isHighlighted ? "translateY(-1px)" : "none" }}>
                            <Icon />
                            {item.href === "/orders" && orderBadge > 0 && (
                                <span
                                    className="badge"
                                    style={{ position: "absolute", top: -7, right: -10, minWidth: 16, height: 16, fontSize: "0.62rem" }}
                                >
                                    {orderBadge}
                                </span>
                            )}
                        </span>
                        <span>{item.label}</span>
                    </Link>
                    </div>
                );
            })}
        </motion.nav>
        </>
    );
}

function DropdownLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                color: "var(--text-primary)",
                fontWeight: 500,
                fontSize: "0.9rem",
                transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg)";
                e.currentTarget.style.color = "var(--vet-blue)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-primary)";
            }}
        >
            <span style={{ fontSize: "1.1rem", display: "flex", alignItems: "center" }}>{icon}</span>
            <span>{label}</span>
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

function HomeIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5 12 3l9 6.5"></path>
            <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"></path>
            <path d="M9 21v-6h6v6"></path>
        </svg>
    );
}

function ProductsIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <path d="m3.3 7 8.7 5 8.7-5"></path>
            <path d="M12 22V12"></path>
        </svg>
    );
}

function CategoriesIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
    );
}

function OrdersIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 9.4 7.5 4.21"></path>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <path d="m3.3 7 8.7 5 8.7-5"></path>
            <path d="M12 22V12"></path>
        </svg>
    );
}

function UserIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
