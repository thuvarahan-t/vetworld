"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";
import type { Order } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Status helpers ────────────────────────────────────────────────────────
function statusColor(status: string): { bg: string; text: string } {
    switch (status) {
        case "PENDING_PAYMENT":   return { bg: "#fff3e0", text: "#c2410c" };
        case "PAYMENT_FAILED":    return { bg: "#fee2e2", text: "#991b1b" };
        case "PAYMENT_CANCELLED": return { bg: "#fef3c7", text: "#92400e" };
        case "PAYMENT_REVIEW":    return { bg: "#eff6ff", text: "#1d4ed8" };
        case "CONFIRMED":         return { bg: "#ecfdf5", text: "#065f46" };
        case "PROCESSING":        return { bg: "#f0fdf4", text: "#15803d" };
        case "PACKED":            return { bg: "#ede9fe", text: "#6d28d9" };
        case "DELIVERED":         return { bg: "#dcfce7", text: "#166534" };
        case "CANCELLED":         return { bg: "#fee2e2", text: "#991b1b" };
        default:                  return { bg: "#f1f5f9", text: "#475569" };
    }
}
function statusLabel(status: string) {
    return status.replace(/_/g, " ");
}

// Parse JSON address → readable string
function formatAddress(raw: string): string {
    if (!raw) return "—";
    try {
        const p = JSON.parse(raw);
        if (p && typeof p === "object" && "line1" in p) {
            return [p.line1, p.line2, p.district].filter(Boolean).join(", ");
        }
    } catch {}
    return raw;
}

// ─── Skeleton loader ───────────────────────────────────────────────────────
function OrderSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                        <div>
                            <div style={{ width: 160, height: 20, background: "var(--border)", borderRadius: 6, marginBottom: 8 }} />
                            <div style={{ width: 100, height: 14, background: "var(--border)", borderRadius: 6 }} />
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ width: 80, height: 20, background: "var(--border)", borderRadius: 6, marginBottom: 8 }} />
                            <div style={{ width: 50, height: 14, background: "var(--border)", borderRadius: 6 }} />
                        </div>
                    </div>
                    <div style={{ height: 60, background: "var(--border)", borderRadius: 8, marginBottom: "1.5rem", opacity: 0.6 }} />
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between" }}>
                        <div style={{ width: 200, height: 14, background: "var(--border)", borderRadius: 6 }} />
                        <div style={{ width: 140, height: 32, background: "var(--border)", borderRadius: 6 }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Slip uploader component ───────────────────────────────────────────────
function PaymentSlipUploader({ orderId, onSuccess }: { orderId: number; onSuccess: (o: Order) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
            setUploadError("Please upload an image (JPG, PNG) or PDF file.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setUploadError("File must be under 5MB.");
            return;
        }
        setUploadError("");
        setFile(f);
        if (f.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(f));
        } else {
            setPreview("");
        }
    };

    const uploadToCloudinary = async (f: File): Promise<string> => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", f);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) throw new Error("Cloudinary not configured");
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
                method: "POST", body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Upload failed");
            return data.secure_url;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!file) { setUploadError("Please select a file first."); return; }
        setUploadError("");
        setIsSubmitting(true);
        try {
            const slipUrl = await uploadToCloudinary(file);
            const updated = await userApi.uploadPaymentSlip(orderId, slipUrl);
            onSuccess(updated as Order);
        } catch (e: any) {
            setUploadError(e.message || "Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: "1.25rem", borderTop: "1px dashed var(--border)", paddingTop: "1.25rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
                📎 Paid via bank transfer? Upload your payment receipt:
            </p>

            {/* Drop zone */}
            <div
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2px dashed ${isDragOver ? "var(--vet-blue)" : "var(--border)"}`,
                    background: isDragOver ? "var(--vet-blue-light)" : "var(--background)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1.25rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    marginBottom: "0.75rem",
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {preview ? (
                    <img src={preview} alt="Slip preview" style={{ maxHeight: 120, borderRadius: 6, margin: "0 auto", display: "block" }} />
                ) : file ? (
                    <div style={{ color: "var(--vet-blue)", fontWeight: 600, fontSize: "0.9rem" }}>📄 {file.name}</div>
                ) : (
                    <>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📤</div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                            Click or drag & drop your receipt here
                        </p>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                            JPG, PNG or PDF · Max 5MB
                        </p>
                    </>
                )}
            </div>

            {uploadError && (
                <p style={{ color: "rgb(220,38,38)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>⚠ {uploadError}</p>
            )}

            <button
                onClick={handleSubmit}
                disabled={isUploading || isSubmitting || !file}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", opacity: (!file || isUploading || isSubmitting) ? 0.6 : 1 }}
            >
                {isUploading ? "Uploading..." : isSubmitting ? "Submitting..." : "Submit Slip for Review"}
            </button>
        </div>
    );
}

// ─── Order Tracker ─────────────────────────────────────────────────────────
function OrderTracker({ status }: { status: string }) {
    const steps = [
        { key: "CONFIRMED", label: "Confirmed", icon: "✓" },
        { key: "PROCESSING", label: "Processing", icon: "⚙" },
        { key: "PACKED", label: "Packed", icon: "📦" },
        { key: "DELIVERED", label: "Delivered", icon: "🏠" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === status);
    const validIdx = currentIdx >= 0 ? currentIdx : 0;
    const progressPct = steps.length > 1 ? (validIdx / (steps.length - 1)) * 100 : 0;

    return (
        <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
            {/* Track */}
            <div style={{ position: "absolute", top: 15, left: "8%", right: "8%", height: 3, background: "var(--border)", zIndex: 0 }} />
            <div style={{ position: "absolute", top: 15, left: "8%", height: 3, width: `${progressPct * 0.84}%`, background: "var(--vet-green)", zIndex: 1, transition: "width 0.6s ease" }} />

            <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
                {steps.map((step, idx) => {
                    const done = idx <= validIdx;
                    const active = idx === validIdx;
                    return (
                        <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: done ? "var(--vet-green)" : "var(--surface)",
                                border: done ? "2px solid var(--vet-green)" : "2px solid var(--border)",
                                color: done ? "white" : "var(--text-muted)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.9rem", fontWeight: 700, transition: "all 0.3s",
                                boxShadow: active ? "0 0 0 4px rgba(13,158,110,0.2)" : "none",
                            }}>
                                {done ? step.icon : ""}
                            </div>
                            <span style={{ fontSize: "0.78rem", fontWeight: active ? 700 : 500, color: active ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [toastMsg, setToastMsg] = useState("");

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 3500);
    };

    useEffect(() => {
        const token = typeof window !== "undefined"
                        ? localStorage.getItem("vetworld_token") : null;
        if (!token) { router.push("/"); return; }

        let pollTimer: ReturnType<typeof setInterval> | null = null;
        let pollCount = 0;
        const MAX_POLLS = 12; // 12 × 8s = 96s max

        const fetchOrders = async () => {
            try {
                const data = await userApi.getMyOrders();
                setOrders(data as Order[]);

                const hasPending = (data as Order[]).some(
                    (o) => o.status === "PENDING_PAYMENT"
                );
                if (hasPending && pollCount < MAX_POLLS) {
                    if (!pollTimer) {
                        pollTimer = setInterval(async () => {
                            pollCount++;
                            try {
                                const fresh = await userApi.getMyOrders();
                                setOrders(fresh as Order[]);
                                const stillPending = (fresh as Order[]).some(
                                    (o) => o.status === "PENDING_PAYMENT"
                                );
                                if (!stillPending || pollCount >= MAX_POLLS) {
                                    if (pollTimer) {
                                        clearInterval(pollTimer);
                                        pollTimer = null;
                                    }
                                }
                            } catch { /* ignore poll errors silently */ }
                        }, 8000);
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError("Unable to load your orders. Please try again.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
        return () => { if (pollTimer) clearInterval(pollTimer); };
    }, [router]);

    const handleDownloadReceipt = async (orderId: number) => {
        try {
            await userApi.downloadReceipt(orderId);
        } catch {
            showToast("Failed to download receipt. Please try again.");
        }
    };

    const toggleItems = (orderId: number) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            next.has(orderId) ? next.delete(orderId) : next.add(orderId);
            return next;
        });
    };

    const handleSlipSuccess = (updated: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        showToast("✅ Payment slip submitted! We'll review and confirm your order shortly.");
    };

    if (isLoading) return (
        <main className="container-main section">
            <h1 className="section-title">My Orders</h1>
            <p className="section-subtitle" style={{ marginBottom: "2rem" }}>Track and manage your past purchases</p>
            <OrderSkeleton />
        </main>
    );

    if (error) return (
        <main className="container-main section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </main>
    );

    if (orders.length === 0) return (
        <main className="container-main section" style={{ textAlign: "center", padding: "5rem 1rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>No Orders Yet</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Browse our catalogue and place your first order.</p>
            <Link href="/category/all" className="btn-primary">Browse Products →</Link>
        </main>
    );

    return (
        <main className="container-main section">
            <div style={{ marginBottom: "2rem" }}>
                <h1 className="section-title">My Orders</h1>
                <p className="section-subtitle" style={{ marginBottom: 0 }}>
                    {orders.length} order{orders.length !== 1 ? "s" : ""} · Track and manage your purchases
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {orders.map((order, idx) => {
                    const sc = statusColor(order.status);
                    const itemsOpen = expandedItems.has(order.id);
                    return (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07 }}
                            className="card"
                            style={{ padding: "1.5rem", overflow: "visible" }}
                        >
                            {/* ─── Header ─────────────────────────────────── */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                <div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--vet-blue)", letterSpacing: "-0.3px" }}>
                                        {order.orderNumber}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                        {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        {" · "}
                                        {new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{
                                        padding: "0.3rem 0.75rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
                                        background: sc.bg, color: sc.text
                                    }}>
                                        {statusLabel(order.status)}
                                    </span>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>Rs. {order.totalAmount.toLocaleString()}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── Status Section ─────────────────────────── */}
                            {order.status === "REFUNDED" ? (
                                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem" }}>
                                    <div style={{ color: "rgb(21,128,61)", fontWeight: 800, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span>✅</span> Refund Processed</div>
                                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                                        This order was cancelled and the refund has been processed to your bank account successfully.
                                    </p>
                                    {order.refundReceiptUrl && (
                                        <a href={order.refundReceiptUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.85rem", color: "rgb(21,128,61)", fontWeight: 700, textDecoration: "underline" }}>
                                            View Refund Receipt
                                        </a>
                                    )}
                                </div>
                            ) : order.status === "CANCELLED" ? (
                                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem" }}>
                                    <div style={{ color: "rgb(185,28,28)", fontWeight: 700, marginBottom: "0.25rem" }}>✕ Order Cancelled</div>
                                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                                        Your order was cancelled. Your refund will be processed within 2 working days.
                                    </p>
                                    {order.cancellationReason && (
                                        <div style={{ background: "white", padding: "0.6rem 0.9rem", borderRadius: "var(--radius-sm)", borderLeft: "3px solid rgb(239,68,68)", marginTop: "0.75rem", fontSize: "0.88rem" }}>
                                            <strong>Reason:</strong> {order.cancellationReason}
                                        </div>
                                    )}
                                    <div style={{ marginTop: "1rem", borderTop: "1px dashed rgba(239,68,68,0.3)", paddingTop: "1rem" }}>
                                        {order.bankDetails ? (
                                            <div style={{ background: "white", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Bank Details Submitted for Refund:</div>
                                                <div style={{ fontSize: "0.88rem", whiteSpace: "pre-wrap" }}>{order.bankDetails}</div>
                                            </div>
                                        ) : (
                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const form = e.target as HTMLFormElement;
                                                const bankName = (form.elements.namedItem("bankName") as HTMLInputElement).value.trim();
                                                const branchName = (form.elements.namedItem("branchName") as HTMLInputElement).value.trim();
                                                const accountNo = (form.elements.namedItem("accountNo") as HTMLInputElement).value.trim();
                                                const accountHolder = (form.elements.namedItem("accountHolder") as HTMLInputElement).value.trim();
                                                if (!bankName || !branchName || !accountNo || !accountHolder) return;
                                                const details = `Bank Name: ${bankName}\nBranch Name: ${branchName}\nAccount No: ${accountNo}\nAccount Holder: ${accountHolder}`;
                                                const btn = form.querySelector("button");
                                                if (btn) btn.disabled = true;
                                                try {
                                                    const updated = await userApi.submitBankDetails(order.id, details);
                                                    setOrders(prev => prev.map(o => o.id === updated.id ? updated as Order : o));
                                                    showToast("Bank details submitted successfully.");
                                                } catch (err: any) {
                                                    showToast("Error: " + err.message);
                                                } finally {
                                                    if (btn) btn.disabled = false;
                                                }
                                            }}>
                                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Please provide your Bank Details for Refund:</label>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                                    <input type="text" name="bankName" required placeholder="Bank Name" className="input" style={{ width: "100%" }} />
                                                    <input type="text" name="branchName" required placeholder="Branch Name" className="input" style={{ width: "100%" }} />
                                                    <input type="text" name="accountNo" required placeholder="Account Number" className="input" style={{ width: "100%" }} />
                                                    <input type="text" name="accountHolder" required placeholder="Account Holder Name" className="input" style={{ width: "100%" }} />
                                                </div>
                                                <button type="submit" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>Submit Bank Details</button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            ) : order.status === "PENDING_PAYMENT" ? (
                                <div style={{ background: "var(--vet-orange-light)", border: "1px solid rgba(249,115,22,0.3)", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem" }}>
                                    <div style={{ fontWeight: 700, color: "var(--vet-orange)", marginBottom: "0.25rem" }}>⚠️ Payment Pending</div>
                                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                                        Complete your payment via PayHere, or upload a bank transfer receipt below.
                                    </p>
                                    {order.slipRejectionReason && (
                                        <div style={{ background: "white", padding: "0.6rem 0.9rem", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--vet-orange)", marginTop: "0.75rem", fontSize: "0.88rem" }}>
                                            <strong>Previous rejection reason:</strong> {order.slipRejectionReason}
                                        </div>
                                    )}
                                    <PaymentSlipUploader orderId={order.id} onSuccess={handleSlipSuccess} />
                                </div>
                            ) : order.status === "PAYMENT_REVIEW" ? (
                                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem" }}>
                                    <div style={{ fontWeight: 700, color: "#1d4ed8", marginBottom: "0.25rem" }}>🔍 Payment Slip Under Review</div>
                                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                                        Your slip has been submitted. Our team will verify and confirm your order shortly.
                                    </p>
                                    {order.paymentSlipUrl && (
                                        <a href={order.paymentSlipUrl} target="_blank" rel="noopener noreferrer"
                                            style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.85rem", color: "#1d4ed8", fontWeight: 600 }}>
                                            📎 View Submitted Slip ↗
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div style={{ marginBottom: "1.75rem" }}>
                                    <OrderTracker status={order.status} />
                                    {order.deliveryDate && order.status !== "DELIVERED" && (
                                        <p style={{ textAlign: "center", marginTop: "0.9rem", fontSize: "0.88rem", color: "var(--vet-blue)", fontWeight: 600 }}>
                                            📅 Expected Delivery:{" "}
                                            {new Date(order.deliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                                        </p>
                                    )}
                                    {order.status === "DELIVERED" && (
                                        <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.88rem", color: "var(--vet-green)", fontWeight: 700 }}>
                                            🎉 Delivered successfully!
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ─── Items Accordion ────────────────────────── */}
                            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem", overflow: "hidden" }}>
                                <button
                                    onClick={() => toggleItems(order.id)}
                                    style={{
                                        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "0.75rem 1rem", background: "var(--background)", border: "none",
                                        cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)",
                                    }}
                                >
                                    <span>🛍 {order.items.length} item{order.items.length !== 1 ? "s" : ""} ordered</span>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", transform: itemsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                                </button>
                                <AnimatePresence>
                                    {itemsOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {order.items.map((item) => (
                                                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.88rem" }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                                            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{item.typeName} × {item.quantity}</div>
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Rs. {item.lineTotal.toLocaleString()}</div>
                                                    </div>
                                                ))}
                                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                                                    <span>Total</span>
                                                    <span style={{ color: "var(--vet-blue)" }}>Rs. {order.totalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* ─── Footer ─────────────────────────────────── */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    <strong>📍 Delivery:</strong> {formatAddress(order.deliveryAddress)}
                                </div>
                                <button
                                    onClick={() => handleDownloadReceipt(order.id)}
                                    className="btn-secondary"
                                    style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }}
                                >
                                    📄 Download Receipt
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Toast notification */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        style={{
                            position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
                            background: "var(--text-primary)", color: "white",
                            padding: "0.9rem 1.5rem", borderRadius: "var(--radius-md)",
                            fontWeight: 600, fontSize: "0.9rem", zIndex: 9999,
                            boxShadow: "var(--shadow-lg)", maxWidth: "90vw", textAlign: "center",
                        }}
                    >
                        {toastMsg}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
