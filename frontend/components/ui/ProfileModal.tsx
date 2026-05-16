"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { userApi } from "@/lib/api";
import { User } from "./AuthModal";
import DistrictDropdown from "./DistrictDropdown";


interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdateSuccess: (user: User) => void;
}


// Parse stored address string (JSON or plain) into structured fields
function parseAddress(raw: string): { line1: string; line2: string; district: string } {
    if (!raw) return { line1: "", line2: "", district: "" };
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "line1" in parsed) return parsed;
    } catch {}
    // Legacy plain text → put everything in line1
    return { line1: raw, line2: "", district: "" };
}

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: 600,
    color: "var(--text-secondary)", marginBottom: "0.2rem",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.8rem",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.875rem",
    color: "var(--text-primary)",
    background: "var(--surface)",
    outline: "none",
    transition: "border var(--transition), box-shadow var(--transition)",
};

export default function ProfileModal({ isOpen, onClose, user, onUpdateSuccess }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [name, setName] = useState("");
    const [phoneDigits, setPhoneDigits] = useState(""); // 9 digits only (without +94)
    const [addrLine1, setAddrLine1] = useState("");
    const [addrLine2, setAddrLine2] = useState("");
    const [district, setDistrict] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (user && isOpen) {
            setName(user.name || "");
            // Parse phone: strip "+94" prefix if present
            const rawPhone = user.phone || "";
            const digits = rawPhone.startsWith("+94") ? rawPhone.slice(3).trim() : rawPhone;
            setPhoneDigits(digits.replace(/\D/g, "").slice(0, 9));
            // Parse address
            const addr = parseAddress(user.address || "");
            setAddrLine1(addr.line1);
            setAddrLine2(addr.line2);
            setDistrict(addr.district);
        }
    }, [user, isOpen]);

    const handlePhoneInput = (val: string) => {
        // Only allow digits, max 9
        const digits = val.replace(/\D/g, "").slice(0, 9);
        setPhoneDigits(digits);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(""); setSuccessMsg("");

        if (phoneDigits.length !== 9) {
            setErrorMsg("Phone number must be exactly 9 digits after +94.");
            return;
        }
        if (!addrLine1.trim()) {
            setErrorMsg("Address Line 1 is required.");
            return;
        }
        if (!district) {
            setErrorMsg("Please select your district.");
            return;
        }

        const fullPhone = `+94${phoneDigits}`;
        const fullAddress = JSON.stringify({ line1: addrLine1.trim(), line2: addrLine2.trim(), district });

        setIsLoading(true);
        try {
            const updatedUser = await userApi.updateProfile({ name, phone: fullPhone, address: fullAddress });
            // Also update localStorage so checkout auto-fills correctly
            const stored = localStorage.getItem("vetworld_user");
            if (stored) {
                try {
                    const u = JSON.parse(stored);
                    localStorage.setItem("vetworld_user", JSON.stringify({ ...u, name, phone: fullPhone, address: fullAddress }));
                } catch {}
            }
            onUpdateSuccess(updatedUser);
            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => { onClose(); setSuccessMsg(""); }, 1500);
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;
    const portalRoot = document.body;
    if (!portalRoot) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", zIndex: 2147483646 }}
                    />

                    <div style={{
                        position: "fixed", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "1.5rem", zIndex: 2147483647, pointerEvents: "none",
                        overflowY: "auto", WebkitOverflowScrolling: "touch",
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 24 }}
                            transition={{ type: "spring", damping: 25, stiffness: 280 }}
                            style={{
                                background: "var(--surface)", borderRadius: "var(--radius-lg)",
                                boxShadow: "var(--shadow-lg)", padding: "1.4rem 1.6rem",
                                width: "min(480px, 100%)",
                                maxHeight: "calc(100vh - 2rem)",
                                overflowY: "auto",
                                position: "relative", pointerEvents: "all",
                                margin: "auto",
                            }}
                        >
                            <button onClick={onClose} style={{
                                position: "absolute", top: "0.85rem", right: "0.85rem",
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "1.1rem", color: "var(--text-secondary)",
                            }}>✕</button>

                            <h2 style={{ marginBottom: "0.1rem", fontSize: "1.2rem" }}>My Profile 👤</h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "1rem" }}>Update your account details</p>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                                {/* Full Name + Email — two columns */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                                    <div>
                                        <label style={labelStyle}>Full Name</label>
                                        <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Dr. John Perera" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Email <span style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontWeight:400 }}>(locked)</span></label>
                                        <input type="email" disabled value={user?.email || ""} style={{ ...inputStyle, background: "var(--bg)", cursor: "not-allowed", opacity: 0.65 }} />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <div style={{ display: "flex" }}>
                                        <span style={{
                                            display: "flex", alignItems: "center",
                                            padding: "0.5rem 0.65rem",
                                            background: "var(--bg)",
                                            border: "1.5px solid var(--border)",
                                            borderRight: "none",
                                            borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
                                            fontSize: "0.85rem", fontWeight: 700,
                                            color: "var(--text-primary)",
                                            whiteSpace: "nowrap", userSelect: "none",
                                        }}>🇱🇰 +94</span>
                                        <input
                                            type="tel" inputMode="numeric"
                                            value={phoneDigits}
                                            onChange={e => handlePhoneInput(e.target.value)}
                                            maxLength={9} placeholder="771234567"
                                            style={{
                                                ...inputStyle,
                                                borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                                                letterSpacing: "0.08em",
                                            }}
                                        />
                                    </div>
                                    <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>9 digits · e.g. 771234567</p>
                                </div>

                                {/* ── Glass Address Card ── */}
                                <div>
                                    {/* Section header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.45rem" }}>
                                        <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>📍 Delivery Address</span>
                                        <span style={{ fontSize: "0.65rem", color: "rgb(239,68,68)", fontWeight: 700 }}>*</span>
                                    </div>

                                    {/* Unified glass card — Line 1 + Line 2 */}
                                    <div style={{
                                        borderRadius: "14px",
                                        overflow: "hidden",
                                        background: "rgba(248, 250, 255, 0.6)",
                                        backdropFilter: "blur(20px)",
                                        WebkitBackdropFilter: "blur(20px)",
                                        border: "1.5px solid rgba(26, 115, 232, 0.14)",
                                        boxShadow: "0 2px 20px rgba(26,115,232,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                                        transition: "border-color 0.25s, box-shadow 0.25s",
                                    }}>
                                        {/* Line 1 row */}
                                        <div style={{ display: "flex", alignItems: "center", padding: "0 0.85rem" }}>
                                            <span style={{ fontSize: "0.9rem", opacity: 0.55, flexShrink: 0, marginRight: "0.5rem" }}>🏠</span>
                                            <input
                                                type="text"
                                                required
                                                value={addrLine1}
                                                onChange={e => setAddrLine1(e.target.value)}
                                                placeholder="Line 1 · No. 42, Galle Road"
                                                style={{
                                                    width: "100%",
                                                    padding: "0.6rem 0",
                                                    border: "none",
                                                    outline: "none",
                                                    background: "transparent",
                                                    fontSize: "0.85rem",
                                                    color: "var(--text-primary)",
                                                    fontFamily: "inherit",
                                                }}
                                            />
                                        </div>

                                        {/* Inner divider */}
                                        <div style={{ height: "1px", background: "rgba(26,115,232,0.1)", margin: "0 1rem" }} />

                                        {/* Line 2 row */}
                                        <div style={{ display: "flex", alignItems: "center", padding: "0 0.85rem" }}>
                                            <span style={{ fontSize: "0.9rem", opacity: 0.45, flexShrink: 0, marginRight: "0.5rem" }}>🏢</span>
                                            <input
                                                type="text"
                                                value={addrLine2}
                                                onChange={e => setAddrLine2(e.target.value)}
                                                placeholder="Line 2 · Apartment / Area (optional)"
                                                style={{
                                                    width: "100%",
                                                    padding: "0.6rem 0",
                                                    border: "none",
                                                    outline: "none",
                                                    background: "transparent",
                                                    fontSize: "0.85rem",
                                                    color: "var(--text-primary)",
                                                    fontFamily: "inherit",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* District — custom dropdown */}
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <DistrictDropdown
                                            value={district}
                                            onChange={setDistrict}
                                            required
                                        />
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgb(239,68,68)", fontSize: "0.8rem", textAlign: "center" }}>
                                        {errorMsg}
                                    </div>
                                )}

                                {successMsg && (
                                    <div style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "rgb(22,163,74)", fontSize: "0.8rem", textAlign: "center" }}>
                                        {successMsg}
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className="btn-primary"
                                    style={{ width: "100%", justifyContent: "center", padding: "0.7rem", opacity: isLoading ? 0.7 : 1 }}>
                                    {isLoading ? "Saving Changes..." : "Save Profile"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    , portalRoot);
}
