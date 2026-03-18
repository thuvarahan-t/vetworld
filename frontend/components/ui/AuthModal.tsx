"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export interface User {
    name: string;
    email?: string;
    isAdmin?: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

type View = "login" | "signup" | "signup-otp" | "forgot" | "reset";

// Style tokens for consistent modal look
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.8rem", fontWeight: 600,
    color: "var(--text-secondary)", marginBottom: "0.3rem",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.9rem",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    background: "var(--surface)",
    outline: "none",
    transition: "border var(--transition), box-shadow var(--transition)",
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
    const [view, setView] = useState<View>("login");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Login / signup fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [otp, setOtp] = useState("");

    // Forgot / reset fields
    const [forgotEmail, setForgotEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const reset = () => {
        setErrorMsg(""); setSuccessMsg("");
        setEmail(""); setPassword(""); setName(""); setPhone(""); setAddress(""); setOtp("");
        setForgotEmail(""); setResetCode(""); setNewPassword("");
        setView("login");
    };

    const goTo = (v: View) => { reset(); setView(v); };

    const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 20000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        return fetch(input, {
            ...init,
            signal: controller.signal,
        }).finally(() => clearTimeout(timer));
    };

    // Tab toggle buttons (Login / Signup)
    const Tabs = () => (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {(["login", "signup"] as View[]).map(v => (
                <button key={v} onClick={() => goTo(v)} style={{
                    flex: 1, padding: "0.6rem", borderRadius: "var(--radius-sm)", border: "1.5px solid",
                    borderColor: view === v ? "var(--vet-blue)" : "var(--border)",
                    background: view === v ? "var(--vet-blue-light)" : "transparent",
                    color: view === v ? "var(--vet-blue)" : "var(--text-secondary)",
                    fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", transition: "all var(--transition)",
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

    // ── Signup OTP Verify ─────────────────────────────────────────────
    const handleSignupOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg(""); setIsLoading(true);
        try {
            const res = await fetchWithTimeout("/api/auth/signup", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, phone, address, otp }),
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
        e.preventDefault(); setErrorMsg(""); setIsLoading(true);
        try {
            const res = await fetchWithTimeout("/api/auth/forgot-password", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json();
            setSuccessMsg("Reset code sent! Check your email inbox.");
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { onClose(); reset(); }}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 200 }}
                    />

                    {/* Centering container — flexbox ensures perfect vertical+horizontal center */}
                    <div style={{
                        position: "fixed", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 201, pointerEvents: "none",
                    }}>
                        {/* Modal card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 24 }}
                            transition={{ type: "spring", damping: 25, stiffness: 280 }}
                            style={{
                                background: "var(--surface)", borderRadius: "var(--radius-lg)",
                                boxShadow: "var(--shadow-lg)", padding: "2rem",
                                width: "min(460px, 94vw)", maxHeight: "90vh",
                                overflowY: "auto", position: "relative", pointerEvents: "all",
                            }}
                        >
                            {/* Close button */}
                            <button onClick={() => { onClose(); reset(); }} style={{
                                position: "absolute", top: "1rem", right: "1rem",
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "1.3rem", color: "var(--text-secondary)",
                            }}>✕</button>

                            {/* ── LOGIN ── */}
                            {view === "login" && (
                                <>
                                    <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Welcome back 👋</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Sign in to your VetWorld account</p>
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
                                        <button type="button" onClick={() => goTo("forgot")} style={{
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
                                </>
                            )}

                            {/* ── SIGNUP ── */}
                            {view === "signup" && (
                                <>
                                    <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Create account 🐾</h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Join VetWorld today</p>
                                    <Tabs />
                                    <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div><label style={labelStyle}>Full Name</label>
                                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Dr. John Doe" /></div>
                                        <div><label style={labelStyle}>Email Address</label>
                                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
                                        <div><label style={labelStyle}>Phone Number</label>
                                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+94 74 1234567" /></div>
                                        <div><label style={labelStyle}>Delivery Address</label>
                                            <textarea value={address} onChange={e => setAddress(e.target.value)}
                                                className="input"
                                                style={{ resize: "vertical", minHeight: "70px" }}
                                                placeholder="Street, City, State..." /></div>
                                        <div><label style={labelStyle}>Password</label>
                                            <div style={{ position: "relative" }}>
                                                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingRight: "2.5rem" }} placeholder="••••••••" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)" }}>
                                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                </button>
                                            </div>
                                        </div>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Please wait..." : "Create Account"}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── SIGNUP OTP VERIFY ── */}
                            {view === "signup-otp" && (
                                <>
                                    <button type="button" onClick={() => goTo("signup")} style={{
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
                                                style={{ ...inputStyle, letterSpacing: "0.3em", fontSize: "1.1rem", textAlign: "center" }}
                                                placeholder="000000" /></div>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Verifying..." : "Verify & Create Account"}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── FORGOT PASSWORD ── */}
                            {view === "forgot" && (
                                <>
                                    <button type="button" onClick={() => goTo("login")} style={{
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
                                            <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" /></div>
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
                                </>
                            )}

                            {/* ── RESET PASSWORD ── */}
                            {view === "reset" && (
                                <>
                                    <button type="button" onClick={() => goTo("forgot")} style={{
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
                                            <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" /></div>
                                        <div><label style={labelStyle}>Reset Code (6 digits)</label>
                                            <input type="text" required maxLength={6} value={resetCode} onChange={e => setResetCode(e.target.value)}
                                                style={{ ...inputStyle, letterSpacing: "0.3em", fontSize: "1.1rem", textAlign: "center" }}
                                                placeholder="000000" /></div>
                                        <div><label style={labelStyle}>New Password</label>
                                            <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Min 6 characters" /></div>
                                        {errorMsg && <ErrorBox msg={errorMsg} />}
                                        <button type="submit" disabled={isLoading} className="btn-primary"
                                            style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? "Resetting..." : "Reset Password"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
  