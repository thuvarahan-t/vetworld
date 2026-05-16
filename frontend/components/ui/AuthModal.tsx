"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DistrictDropdown from "./DistrictDropdown";


export interface User {
    name: string;
    email?: string;
    isAdmin?: boolean;
    phone?: string;
    address?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

type View = "login" | "signup" | "signup-otp" | "forgot" | "reset";

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.8rem", fontWeight: 600,
    color: "var(--text-secondary)", marginBottom: "0.3rem",
};

function ErrorBox({ msg }: { msg: string }) {
    return (
        <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgb(239,68,68)", fontSize: "0.85rem", textAlign: "center" }}>
            {msg}
        </div>
    );
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: Props) {
    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState<View>("login");
    const [animDir, setAnimDir] = useState<"left"|"right"|"up"|"down">("left");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Login / signup fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phoneDigits, setPhoneDigits] = useState("");
    const [addrLine1, setAddrLine1] = useState("");
    const [addrLine2, setAddrLine2] = useState("");
    const [district, setDistrict] = useState("");
    const [otp, setOtp] = useState("");

    // Forgot / reset fields
    const [forgotEmail, setForgotEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    const portalRoot = document.body;
    if (!portalRoot) return null;

    const clearFields = () => {
        setErrorMsg(""); setSuccessMsg("");
        setEmail(""); setPassword(""); setName("");
        setPhoneDigits(""); setAddrLine1(""); setAddrLine2(""); setDistrict("");
        setOtp("");
        setForgotEmail(""); setResetCode(""); setNewPassword("");
    };

    const reset = () => { clearFields(); setView("login"); };

    const goTo = (v: View, dir?: "left"|"right"|"up"|"down") => {
        clearFields();
        const auto = v === "signup" ? "left" : v === "login" ? "right" : "up";
        setAnimDir(dir ?? auto);
        setView(v);
    };

    const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 20000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        return fetch(input, {
            ...init,
            signal: controller.signal,
        }).finally(() => clearTimeout(timer));
    };

    const slideVariants = {
        enter: (dir: string) => ({
            x: dir === "left" ? 16 : dir === "right" ? -16 : 0,
            y: dir === "up" ? 8 : dir === "down" ? -8 : 0,
            opacity: 0,
            scale: 0.98,
        }),
        center: { x: 0, y: 0, opacity: 1, scale: 1 },
        exit: (dir: string) => ({
            x: dir === "left" ? -16 : dir === "right" ? 16 : 0,
            y: dir === "up" ? -8 : dir === "down" ? 8 : 0,
            opacity: 0,
            scale: 0.98,
        }),
    };
    const slideTrans = { duration: 0.18, ease: "easeInOut" };

    // Tab toggle — sliding pill indicator
    const Tabs = () => (
        <div style={{ position: "relative", display: "flex", background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3, marginBottom: "0.75rem" }}>
            <motion.div
                layoutId="auth-tab-pill"
                style={{
                    position: "absolute", inset: 3,
                    width: "calc(50% - 3px)",
                    background: "var(--vet-blue)",
                    borderRadius: 8,
                    left: view === "login" ? 3 : "calc(50%)",
                }}
                transition={{ type: "spring", damping: 28, stiffness: 380 }}
            />
            {(["login", "signup"] as View[]).map(v => (
                <button key={v}
                    onClick={() => goTo(v)}
                    style={{
                        flex: 1, padding: "0.5rem", background: "transparent", border: "none",
                        color: view === v ? "white" : "var(--text-secondary)",
                        fontWeight: 600, cursor: "pointer", fontSize: "0.88rem",
                        position: "relative", zIndex: 1, borderRadius: 8,
                        transition: "color 0.2s",
                    }}>
                    {v === "login" ? "Sign In" : "Sign Up"}
                </button>
            ))}
        </div>
    );


    // ── Login ─────────────────────────────────────────────────────────
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg(""); setIsLoading(true);
        try {
            const res = await fetchWithTimeout("/api/auth/login", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setErrorMsg(data.error || "Invalid credentials."); return; }
            localStorage.setItem("vetworld_token", data.token);
            onLoginSuccess({ name: data.name, isAdmin: data.role === "ADMIN", email: data.email });
            onClose(); reset();
        } catch (err: any) {
            setErrorMsg(err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Make sure the server is running.");
        }
        finally { setIsLoading(false); }
    };

    // ── Signup ────────────────────────────────────────────────────────
    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg(""); setIsLoading(true);
        try {
            const res = await fetchWithTimeout("/api/auth/send-signup-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setErrorMsg(data.error || "Failed to send OTP."); return; }
            setSuccessMsg("Verification code sent! Check your email inbox.");
            setView("signup-otp");
        } catch (err: any) {
            setErrorMsg(err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Make sure the server is running.");
        }
        finally { setIsLoading(false); }
    };

    const handleSignupOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg(""); setIsLoading(true);
        const fullPhone = `+94${phoneDigits.replace(/\D/g, "").slice(0, 9)}`;
        const fullAddress = JSON.stringify({ line1: addrLine1.trim(), line2: addrLine2.trim(), district });
        try {
            const res = await fetchWithTimeout("/api/auth/signup", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, phone: fullPhone, address: fullAddress, otp }),
            });
            const data = await res.json();
            if (!res.ok) { setErrorMsg(data.error || "Signup failed."); return; }
            localStorage.setItem("vetworld_token", data.token);
            onLoginSuccess({ name: data.name, isAdmin: false, email: data.email });
            onClose(); reset();
        } catch (err: any) {
            setErrorMsg(err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Make sure the server is running.");
        }
        finally { setIsLoading(false); }
    };

    // ── Forgot Password ───────────────────────────────────────────────
    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg(""); setSuccessMsg(""); setIsLoading(true);
        try {
            const res = await fetchWithTimeout("/api/auth/forgot-password", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data?.error || data?.message || "Failed to send reset code.");
                return;
            }

            const message = data?.message || "If this email is registered, a reset code has been sent.";
            if (message.toLowerCase().includes("could not send email")) {
                setErrorMsg(message);
                return;
            }

            setSuccessMsg(message);
            setView("reset");
        } catch (err: any) {
            setErrorMsg(err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Please try again.");
        }
        finally { setIsLoading(false); }
    };

    // ── Reset Password ─────────────────────────────────────────────────
    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg(""); setIsLoading(true);
        try {
            const res = await fetchWithTimeout("/api/auth/reset-password", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail, resetCode, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) { setErrorMsg(data.error || "Reset failed."); return; }
            setSuccessMsg("Password reset! You can now log in.");
            setTimeout(() => goTo("login"), 1500);
        } catch (err: any) {
            setErrorMsg(err?.name === "AbortError" ? "Request timed out. Please try again." : "Network error. Please try again.");
        }
        finally { setIsLoading(false); }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { onClose(); reset(); }}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", zIndex: 2147483646 }}
                    />

                    {/* Dialog container — keep the modal fully visible and scrollable on smaller screens */}
                    <div style={{
                        position: "fixed", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "1.5rem", zIndex: 2147483647, pointerEvents: "none",
                        overflowY: "auto", WebkitOverflowScrolling: "touch",
                    }}>
                        {/* Modal card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 24 }}
                            transition={{ type: "spring", damping: 25, stiffness: 280 }}
                            style={{
                                background: "var(--surface)", borderRadius: "var(--radius-lg)",
                                boxShadow: "var(--shadow-lg)", padding: "1.2rem 1.5rem",
                                width: "min(560px, 100%)", maxHeight: "calc(100vh - 1.5rem)",
                                overflowY: "auto", position: "relative", pointerEvents: "all",
                                margin: "auto",
                            }}
                        >
                            {/* Close button */}
                            <button onClick={() => { onClose(); reset(); }} style={{
                                position: "absolute", top: "1rem", right: "1rem",
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "1.3rem", color: "var(--text-secondary)",
                            }}>✕</button>

                            {/* ── Views with slide animation ── */}
                            <div style={{ overflow: "hidden" }}>
                            <AnimatePresence mode="wait" custom={animDir}>

                            {/* ── LOGIN ── */}
                            {view === "login" && (
                                <motion.div key="login" custom={animDir}
                                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                                    transition={slideTrans}
                                >
                                    <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Welcome back 👋</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Sign in to your VetWorld account</p>
                                    <Tabs />
                                    <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div><label style={labelStyle}>Email</label>
                                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
                                        <div><label style={labelStyle}>Password</label>
                                            <div style={{ position: "relative" }}>
                                                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingRight: "2.5rem" }} placeholder="••••••••" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)" }}>
                                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => goTo("forgot", "up")} style={{
                                            alignSelf: "flex-end", background: "none", border: "none",
                                            color: "var(--vet-blue)", fontSize: "0.83rem", fontWeight: 600,
                                            cursor: "pointer", marginTop: "-0.5rem",
                                        }}>Forgot password?</button>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Please wait..." : "Sign In"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── SIGNUP ── */}
                            {view === "signup" && (
                                <motion.div key="signup" custom={animDir}
                                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                                    transition={slideTrans}
                                >
                                    <h2 style={{ marginBottom: "0.1rem", fontSize: "1.2rem" }}>Create account 🐾</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>Join VetWorld today</p>
                                    <Tabs />
                                    <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>

                                        {/* Name + Email — 2 columns */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                                            <div><label style={labelStyle}>Full Name</label>
                                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Dr. John Doe" /></div>
                                            <div><label style={labelStyle}>Email Address</label>
                                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
                                        </div>

                                        {/* Phone + Password — 2 columns */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                                            <div>
                                                <label style={labelStyle}>Phone Number</label>
                                                <div style={{ display: "flex" }}>
                                                    <span style={{
                                                        display: "flex", alignItems: "center",
                                                        padding: "0.45rem 0.55rem",
                                                        background: "var(--bg)",
                                                        border: "1.5px solid var(--border)", borderRight: "none",
                                                        borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
                                                        fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap", userSelect: "none",
                                                    }}>🇱🇰 +94</span>
                                                    <input type="tel" inputMode="numeric"
                                                        value={phoneDigits}
                                                        onChange={e => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
                                                        maxLength={9} placeholder="771234567"
                                                        className="input"
                                                        style={{ borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", letterSpacing: "0.06em", fontSize: "0.85rem" }}
                                                    />
                                                </div>
                                                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>9 digits · e.g. 771234567</p>
                                            </div>
                                            <div><label style={labelStyle}>Password</label>
                                                <div style={{ position: "relative" }}>
                                                    <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingRight: "2.5rem" }} placeholder="Min 6 characters" />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)" }}>
                                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address — structured glass card */}
                                        <div>
                                            <label style={labelStyle}>📍 Delivery Address</label>
                                            <div style={{
                                                borderRadius: 10, overflow: "hidden",
                                                background: "rgba(248,250,255,0.6)",
                                                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                                                border: "1.5px solid rgba(26,115,232,0.14)",
                                                boxShadow: "0 2px 16px rgba(26,115,232,0.06),inset 0 1px 0 rgba(255,255,255,0.8)",
                                                marginBottom: "0.35rem",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", padding: "0 0.75rem" }}>
                                                    <span style={{ fontSize: "0.85rem", opacity: 0.55, marginRight: "0.45rem" }}>🏠</span>
                                                    <input type="text" value={addrLine1} onChange={e => setAddrLine1(e.target.value)}
                                                        placeholder="Line 1 · No. 42, Galle Road"
                                                        style={{ width: "100%", padding: "0.5rem 0", border: "none", outline: "none", background: "transparent", fontSize: "0.82rem", color: "var(--text-primary)", fontFamily: "inherit" }}
                                                    />
                                                </div>
                                                <div style={{ height: 1, background: "rgba(26,115,232,0.1)", margin: "0 0.75rem" }} />
                                                <div style={{ display: "flex", alignItems: "center", padding: "0 0.75rem" }}>
                                                    <span style={{ fontSize: "0.85rem", opacity: 0.45, marginRight: "0.45rem" }}>🏢</span>
                                                    <input type="text" value={addrLine2} onChange={e => setAddrLine2(e.target.value)}
                                                        placeholder="Line 2 · Area / Apartment (optional)"
                                                        style={{ width: "100%", padding: "0.5rem 0", border: "none", outline: "none", background: "transparent", fontSize: "0.82rem", color: "var(--text-primary)", fontFamily: "inherit" }}
                                                    />
                                                </div>
                                            </div>
                                            <DistrictDropdown value={district} onChange={setDistrict} />
                                        </div>

                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.7rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Please wait..." : "Send Verification Code"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── SIGNUP OTP VERIFY ── */}
                            {view === "signup-otp" && (
                                <motion.div key="signup-otp" custom={animDir}
                                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                                    transition={slideTrans}
                                >
                                    <button type="button" onClick={() => goTo("signup", "down")} style={{
                                        background: "none", border: "none", color: "var(--vet-blue)",
                                        cursor: "pointer", fontSize: "0.88rem", fontWeight: 600,
                                        marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.3rem",
                                    }}>← Back</button>
                                    <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Verify Email ✉️</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                                        Enter the 6-digit code sent to {email}.
                                    </p>
                                    {successMsg && (
                                        <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "rgb(22,163,74)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                                            {successMsg}
                                        </div>
                                    )}
                                    <form onSubmit={handleSignupOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div><label style={labelStyle}>Verification Code (6 digits)</label>
                                            <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                                                className="input"
                                                style={{ letterSpacing: "0.3em", fontSize: "1.1rem", textAlign: "center" }}
                                                placeholder="000000" /></div>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Verifying..." : "Verify & Create Account"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── FORGOT PASSWORD ── */}
                            {view === "forgot" && (
                                <motion.div key="forgot" custom={animDir}
                                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                                    transition={slideTrans}
                                >
                                    <button type="button" onClick={() => goTo("login", "down")} style={{
                                        background: "none", border: "none", color: "var(--vet-blue)",
                                        cursor: "pointer", fontSize: "0.88rem", fontWeight: 600,
                                        marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.3rem",
                                    }}>← Back to Sign In</button>
                                    <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Forgot Password 🔑</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                                        Enter your email and we&apos;ll send you a reset code.
                                    </p>
                                    <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div><label style={labelStyle}>Email Address</label>
                                            <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Sending..." : "Send Reset Code"}
                                        </button>
                                        <button type="button" onClick={() => goTo("reset")} style={{
                                            background: "none", border: "none", color: "var(--text-secondary)",
                                            fontSize: "0.85rem", cursor: "pointer", textAlign: "center",
                                        }}>Already have a reset code? Enter it here →</button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ── RESET PASSWORD ── */}
                            {view === "reset" && (
                                <motion.div key="reset" custom={animDir}
                                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                                    transition={slideTrans}
                                >
                                    <button type="button" onClick={() => goTo("forgot", "down")} style={{
                                        background: "none", border: "none", color: "var(--vet-blue)",
                                        cursor: "pointer", fontSize: "0.88rem", fontWeight: 600,
                                        marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.3rem",
                                    }}>← Back</button>
                                    <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Reset Password 🔒</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                                        Enter the 6-digit code and your new password.
                                    </p>
                                    {successMsg && (
                                        <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "rgb(22,163,74)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                                            {successMsg}
                                        </div>
                                    )}
                                    <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div><label style={labelStyle}>Email Address</label>
                                            <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
                                        <div><label style={labelStyle}>Reset Code (6 digits)</label>
                                            <input type="text" required maxLength={6} value={resetCode} onChange={e => setResetCode(e.target.value)}
                                                className="input"
                                                style={{ letterSpacing: "0.3em", fontSize: "1.1rem", textAlign: "center" }}
                                                placeholder="000000" /></div>
                                        <div><label style={labelStyle}>New Password</label>
                                            <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" placeholder="Min 6 characters" /></div>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Resetting..." : "Reset Password"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    , portalRoot);
}
  