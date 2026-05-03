"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { userApi } from "@/lib/api";
import { User } from "./AuthModal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdateSuccess: (user: User) => void;
}

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

export default function ProfileModal({ isOpen, onClose, user, onUpdateSuccess }: Props) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setIsLoading(true);

        try {
            const updatedUser = await userApi.updateProfile({ name, phone, address });
            onUpdateSuccess(updatedUser);
            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => {
                onClose();
                setSuccessMsg("");
            }, 1500);
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 200 }}
                    />

                    <div style={{
                        position: "fixed", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 201, pointerEvents: "none",
                    }}>
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
                            <button onClick={onClose} style={{
                                position: "absolute", top: "1rem", right: "1rem",
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "1.3rem", color: "var(--text-secondary)",
                            }}>✕</button>

                            <h2 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>My Profile 👤</h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Update your account details</p>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Your Name" />
                                </div>

                                <div>
                                    <label style={labelStyle}>Email Address</label>
                                    <input type="email" disabled value={user?.email || ""} style={{ ...inputStyle, background: "var(--bg)", cursor: "not-allowed", opacity: 0.7 }} />
                                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Email cannot be changed</p>
                                </div>

                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+94 7X XXX XXXX" />
                                </div>

                                <div>
                                    <label style={labelStyle}>Delivery Address</label>
                                    <textarea 
                                        value={address} 
                                        onChange={e => setAddress(e.target.value)} 
                                        style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} 
                                        placeholder="Enter your default delivery address" 
                                    />
                                </div>

                                {errorMsg && (
                                    <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgb(239,68,68)", fontSize: "0.85rem", textAlign: "center" }}>
                                        {errorMsg}
                                    </div>
                                )}

                                {successMsg && (
                                    <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "rgb(22,163,74)", fontSize: "0.85rem", textAlign: "center" }}>
                                        {successMsg}
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className="btn-primary"
                                    style={{ width: "100%", justifyContent: "center", padding: "0.85rem", opacity: isLoading ? 0.7 : 1, marginTop: "0.5rem" }}>
                                    {isLoading ? "Saving Changes..." : "Save Profile"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
