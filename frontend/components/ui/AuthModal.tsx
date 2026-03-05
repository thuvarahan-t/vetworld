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

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: Props) {
    const [isLogin, setIsLogin] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Form inputs
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        try {
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
            const body = isLogin
                ? { email, password }
                : { name, email, password, phone, address };

            const res = await fetch(`http://localhost:8080${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Something went wrong. Please try again.");
                return;
            }

            // Store JWT token in localStorage
            localStorage.setItem("vetworld_token", data.token);

            onLoginSuccess({
                name: data.name,
                isAdmin: data.role === "ADMIN",
                email: data.email,
            });
            onClose();

            // Reset form
            setEmail("");
            setPassword("");
            setName("");
            setPhone("");
            setAddress("");
        } catch {
            setErrorMsg("Network error. Make sure the server is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                            zIndex: 99999,
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.95, y: 20, x: "-50%" }}
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            width: "90%",
                            maxWidth: "400px",
                            background: "var(--surface)",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            zIndex: 100000,
                            overflow: "hidden",
                        }}
                    >
                        {/* Header Tabs */}
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                            <button
                                onClick={() => setIsLogin(true)}
                                style={{
                                    flex: 1,
                                    padding: "1rem",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: isLogin ? "2px solid var(--vet-blue)" : "2px solid transparent",
                                    color: isLogin ? "var(--vet-blue)" : "var(--text-secondary)",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                style={{
                                    flex: 1,
                                    padding: "1rem",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: !isLogin ? "2px solid var(--vet-blue)" : "2px solid transparent",
                                    color: !isLogin ? "var(--vet-blue)" : "var(--text-secondary)",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Close Button X */}
                        <button
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: "0.75rem",
                                right: "0.75rem",
                                background: "var(--background)",
                                border: "none",
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "var(--text-secondary)",
                            }}
                        >
                            ✕
                        </button>

                        {/* Form Body */}
                        <div style={{ padding: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)", textAlign: "center" }}>
                                {isLogin ? "Welcome back to VetWorld" : "Create your VetWorld account"}
                            </h2>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {!isLogin && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                        <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            style={{
                                                padding: "0.75rem",
                                                borderRadius: "var(--radius-sm)",
                                                border: "1px solid var(--border)",
                                                background: "var(--background)",
                                                color: "var(--text-primary)",
                                            }}
                                            placeholder="Dr. John Doe"
                                        />
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            padding: "0.75rem",
                                            borderRadius: "var(--radius-sm)",
                                            border: "1px solid var(--border)",
                                            background: "var(--background)",
                                            color: "var(--text-primary)",
                                        }}
                                        placeholder="doctor@clinic.com"
                                    />
                                </div>

                                {!isLogin && (
                                    <>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                style={{
                                                    padding: "0.75rem",
                                                    borderRadius: "var(--radius-sm)",
                                                    border: "1px solid var(--border)",
                                                    background: "var(--background)",
                                                    color: "var(--text-primary)",
                                                }}
                                                placeholder="+91 9876543210"
                                            />
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                            <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Delivery Address</label>
                                            <textarea
                                                required
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                style={{
                                                    padding: "0.75rem",
                                                    borderRadius: "var(--radius-sm)",
                                                    border: "1px solid var(--border)",
                                                    background: "var(--background)",
                                                    color: "var(--text-primary)",
                                                    minHeight: "80px",
                                                    resize: "vertical",
                                                }}
                                                placeholder="123 Clinic Street, Medical District..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <label style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{
                                            padding: "0.75rem",
                                            borderRadius: "var(--radius-sm)",
                                            border: "1px solid var(--border)",
                                            background: "var(--background)",
                                            color: "var(--text-primary)",
                                        }}
                                        placeholder="••••••••"
                                    />
                                </div>

                                {/* Error message */}
                                {errorMsg && (
                                    <div style={{
                                        padding: "0.75rem",
                                        borderRadius: "var(--radius-sm)",
                                        background: "rgba(239, 68, 68, 0.08)",
                                        border: "1px solid rgba(239, 68, 68, 0.2)",
                                        color: "rgb(239, 68, 68)",
                                        fontSize: "0.85rem",
                                        textAlign: "center",
                                    }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary"
                                    style={{ marginTop: "1rem", width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1 }}
                                >
                                    {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
