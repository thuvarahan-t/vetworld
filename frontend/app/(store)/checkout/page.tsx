"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { userApi } from "@/lib/api";
import type { Order } from "@/types";
import Link from "next/link";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";

type PaymentMethod = "PAYHERE" | "SLIP";

// ─── Slip Uploader ────────────────────────────────────────────────────────
function SlipUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [isDrag, setIsDrag] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
            setUploadError("Please upload an image or PDF.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) { setUploadError("Max file size is 5MB."); return; }
        setUploadError("");
        setFile(f);
        setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
        uploadToCloudinary(f);
    };

    const uploadToCloudinary = async (f: File) => {
        setIsUploading(true);
        setUploadError("");
        onUploaded(""); // clear previous
        try {
            const formData = new FormData();
            formData.append("file", f);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) throw new Error("Cloudinary not configured.");
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Upload failed.");
            onUploaded(data.secure_url);
        } catch (e: any) {
            setUploadError(e.message || "Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={e => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
                onDragLeave={() => setIsDrag(false)}
                style={{
                    border: `2px dashed ${isDrag ? "var(--vet-blue)" : "var(--border)"}`,
                    background: isDrag ? "var(--vet-blue-light)" : "var(--background)",
                    borderRadius: "var(--radius-sm)", padding: "1.5rem",
                    textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                }}
            >
                <input ref={inputRef} type="file" accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                {isUploading ? (
                    <div style={{ color: "var(--vet-blue)", fontWeight: 600 }}>⏳ Uploading...</div>
                ) : preview ? (
                    <img src={preview} alt="Slip" style={{ maxHeight: 140, borderRadius: 6, margin: "0 auto", display: "block" }} />
                ) : file ? (
                    <div style={{ color: "var(--vet-blue)", fontWeight: 600 }}>📄 {file.name} — uploaded ✓</div>
                ) : (
                    <>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📤</div>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Click or drag & drop your receipt</p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>JPG, PNG or PDF · Max 5MB</p>
                    </>
                )}
            </div>
            {uploadError && <p style={{ color: "rgb(220,38,38)", fontSize: "0.85rem", marginTop: "0.5rem" }}>⚠ {uploadError}</p>}
            {file && !isUploading && !uploadError && !preview && (
                <p style={{ color: "var(--vet-green)", fontSize: "0.85rem", marginTop: "0.5rem" }}>✅ File ready to submit</p>
            )}
        </div>
    );
}

// ─── Payment Method Radio ─────────────────────────────────────────────────
function PayMethodOption({ id, value, selected, onChange, icon, title, subtitle }: {
    id: string; value: PaymentMethod; selected: boolean;
    onChange: (v: PaymentMethod) => void;
    icon: string; title: string; subtitle: string;
}) {
    return (
        <label htmlFor={id} style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "1rem 1.25rem", borderRadius: "var(--radius-sm)",
            border: `2px solid ${selected ? "var(--vet-blue)" : "var(--border)"}`,
            background: selected ? "var(--vet-blue-light)" : "var(--surface)",
            cursor: "pointer", transition: "all 0.2s",
        }}>
            <input id={id} type="radio" name="payMethod" value={value}
                checked={selected} onChange={() => onChange(value)}
                style={{ accentColor: "var(--vet-blue)", width: 18, height: 18 }} />
            <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{icon}</span>
            <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>{subtitle}</div>
            </div>
        </label>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCartStore();
    const grandTotal = totalPrice();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1 fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [payMethod, setPayMethod] = useState<PaymentMethod>("PAYHERE");

    // Slip upload
    const [slipUrl, setSlipUrl] = useState("");

    // Step 3 success
    const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
    const [placedOrderNumber, setPlacedOrderNumber] = useState("");
    const [successMode, setSuccessMode] = useState<"PAYHERE" | "SLIP">("PAYHERE");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const userStr = localStorage.getItem("vetworld_user");
        const token = localStorage.getItem("vetworld_token");
        if (!token || !userStr) { router.push("/"); return; }
        try {
            const user = JSON.parse(userStr);
            setIsAuthenticated(true);
            setName(user.name || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
        } catch { router.push("/"); }
        if (items.length === 0 && step !== 3) router.push("/cart");
    }, [router, items.length, step]);

    const buildPayload = () => ({
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        items: items.map(i => ({
            productId: i.productId, typeId: i.typeId,
            productName: i.productName, typeName: i.typeName,
            unitPrice: i.unitPrice, quantity: i.quantity,
        })),
    });

    const handleProceedToReview = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!name.trim() || !phone.trim() || !address.trim()) {
            setError("Please fill in all delivery details.");
            return;
        }
        setStep(2);
    };

    // Pay via PayHere
    const handlePayHere = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true); setError("");
        try {
            const payhereInit = await userApi.placeOrder(buildPayload());
            const payhereConfig = {
                sandbox: true,
                merchant_id: payhereInit.merchantId,
                return_url: `${window.location.origin}/orders`,
                cancel_url: `${window.location.origin}/checkout`,
                notify_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/payments/notify`,
                order_id: payhereInit.orderNumber,
                items: "VetWorld Order " + payhereInit.orderNumber,
                amount: payhereInit.totalAmount,
                currency: payhereInit.currency,
                hash: payhereInit.hash,
                first_name: name.split(" ")[0] || name,
                last_name: name.split(" ").slice(1).join(" ") || "",
                email: JSON.parse(localStorage.getItem("vetworld_user") || "{}").email || "",
                phone, address, city: "Sri Lanka", country: "Sri Lanka",
            };
            window.payhere.onCompleted = () => {
                setPlacedOrderId(payhereInit.orderId);
                setPlacedOrderNumber(payhereInit.orderNumber);
                setSuccessMode("PAYHERE");
                clearCart();
                setStep(3);
            };
            window.payhere.onDismissed = () => { setIsLoading(false); setError("Payment was cancelled. You can try again."); };
            window.payhere.onError = (msg: string) => { setIsLoading(false); setError("Payment error: " + msg); };
            window.payhere.startPayment(payhereConfig);
        } catch (err: any) {
            setError(err.message || "Failed to initiate payment. Please try again.");
            setIsLoading(false);
        }
    };

    // Pay via Slip Upload
    const handleSubmitSlip = async () => {
        if (!slipUrl) { setError("Please upload your payment receipt first."); return; }
        setIsLoading(true); setError("");
        try {
            // 1. Create the order (PENDING_PAYMENT)
            const payhereInit = await userApi.placeOrder(buildPayload());
            // 2. Immediately submit the slip → status becomes PAYMENT_REVIEW
            await userApi.uploadPaymentSlip(payhereInit.orderId, slipUrl);
            setPlacedOrderId(payhereInit.orderId);
            setPlacedOrderNumber(payhereInit.orderNumber);
            setSuccessMode("SLIP");
            clearCart();
            setStep(3);
        } catch (err: any) {
            setError(err.message || "Failed to submit order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = () => {
        if (payMethod === "PAYHERE") handlePayHere();
        else handleSubmitSlip();
    };

    const handleDownloadReceipt = async () => {
        if (!placedOrderId) return;
        try { await userApi.downloadReceipt(placedOrderId); }
        catch { setError("Failed to download receipt. You can download it from My Orders."); }
    };

    if (!isAuthenticated) return null;

    return (
        <main className="container-main section" style={{ maxWidth: 760 }}>
            {/* ── Progress bar ── */}
            {step !== 3 && (
                <div style={{ marginBottom: "2rem" }}>
                    <h1 className="section-title">Checkout</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
                        {[{ n: 1, label: "Delivery & Payment" }, { n: 2, label: "Review & Confirm" }].map((s, i) => (
                            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                {i > 0 && <div style={{ width: 32, height: 2, background: step >= s.n ? "var(--vet-blue)" : "var(--border)", borderRadius: 2 }} />}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: step >= s.n ? "var(--vet-blue)" : "var(--border)",
                                        color: step >= s.n ? "white" : "var(--text-muted)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 700, fontSize: "0.85rem",
                                    }}>{s.n}</div>
                                    <span style={{ fontWeight: step === s.n ? 700 : 500, color: step === s.n ? "var(--vet-blue)" : "var(--text-secondary)", fontSize: "0.9rem" }}>{s.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* ── Step 1: Delivery + Payment Method ── */}
                {step === 1 && (
                    <motion.form key="step1"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleProceedToReview} className="card" style={{ padding: "2rem" }}>

                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Delivery Details</h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600 }}>Recipient Name</label>
                                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="Full name" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600 }}>Contact Phone</label>
                                <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+94 71 234 5678" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", fontWeight: 600 }}>Delivery Address</label>
                                <textarea className="input" rows={3} value={address} onChange={e => setAddress(e.target.value)} required style={{ resize: "vertical" }} placeholder="No. 10, Main Street, Colombo" />
                            </div>

                            {/* ── Payment Method Selection ── */}
                            <div>
                                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                    Payment Method
                                </label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <PayMethodOption
                                        id="pay-payhere" value="PAYHERE" selected={payMethod === "PAYHERE"} onChange={setPayMethod}
                                        icon="💳" title="Pay Online with Card"
                                        subtitle="Secure instant payment via PayHere (Visa, Mastercard, etc.)" />
                                    <PayMethodOption
                                        id="pay-slip" value="SLIP" selected={payMethod === "SLIP"} onChange={setPayMethod}
                                        icon="🏦" title="Upload Bank Transfer Receipt"
                                        subtitle="Make a bank transfer and upload your payment slip for admin verification" />
                                </div>
                            </div>
                        </div>

                        {error && <div style={{ color: "rgb(220,38,38)", marginTop: "1rem", fontSize: "0.88rem" }}>{error}</div>}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                            <button type="submit" className="btn-primary">Continue to Review →</button>
                        </div>
                    </motion.form>
                )}

                {/* ── Step 2: Review + Pay / Upload ── */}
                {step === 2 && (
                    <motion.div key="step2"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="card" style={{ padding: "2rem" }}>

                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Review Your Order</h2>
                            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--vet-blue)", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                                ← Edit Details
                            </button>
                        </div>

                        {/* Delivery summary */}
                        <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }}>
                            <p style={{ fontWeight: 700, marginBottom: "0.2rem" }}>{name} · {phone}</p>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "0.5rem" }}>{address}</p>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                background: payMethod === "PAYHERE" ? "var(--vet-blue-light)" : "#ecfdf5",
                                color: payMethod === "PAYHERE" ? "var(--vet-blue)" : "var(--vet-green)",
                                padding: "0.3rem 0.75rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
                            }}>
                                {payMethod === "PAYHERE" ? "💳 Pay via PayHere" : "🏦 Upload Payment Slip"}
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                            {items.map(item => (
                                <div key={`${item.productId}-${item.typeId}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--background)", flexShrink: 0 }}>
                                            {item.productImage && <img src={item.productImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.typeName} × {item.quantity}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700 }}>Rs. {(item.unitPrice * item.quantity).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div style={{ borderTop: "2px solid var(--border)", margin: "1.5rem 0", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>Total Amount</span>
                            <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--vet-blue)" }}>Rs. {grandTotal.toLocaleString()}</span>
                        </div>

                        {/* Slip uploader — only shown when SLIP method selected */}
                        {payMethod === "SLIP" && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
                                    📎 Upload Your Bank Transfer Receipt
                                </p>
                                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                                    Transfer the total amount to our bank account, then upload your receipt below. Our team will verify and confirm your order.
                                </p>

                                {/* Bank details box */}
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", padding: "0.9rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                                    <div style={{ fontWeight: 700, color: "var(--vet-green)", marginBottom: "0.4rem" }}>🏦 VetWorld Bank Account</div>
                                    <div><strong>Bank:</strong> Commercial Bank of Ceylon</div>
                                    <div><strong>Account Name:</strong> VetWorld (Pvt) Ltd</div>
                                    <div><strong>Account No:</strong> 1234 5678 9012</div>
                                    <div><strong>Branch:</strong> Colombo Main</div>
                                    <div style={{ marginTop: "0.4rem", color: "var(--text-secondary)" }}>Reference: Your phone number</div>
                                </div>

                                <SlipUploader onUploaded={url => { setSlipUrl(url); setError(""); }} />

                                {slipUrl && (
                                    <div style={{ marginTop: "0.75rem", padding: "0.6rem 1rem", background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--vet-green)", fontWeight: 600 }}>
                                        ✅ Receipt uploaded successfully — ready to submit
                                    </div>
                                )}
                            </div>
                        )}

                        {error && <div style={{ color: "rgb(220,38,38)", marginBottom: "1rem", fontSize: "0.88rem", textAlign: "center" }}>{error}</div>}

                        <button
                            onClick={handleAction}
                            disabled={isLoading || (payMethod === "SLIP" && !slipUrl)}
                            className="btn-primary"
                            style={{ width: "100%", justifyContent: "center", padding: "1rem", fontSize: "1rem", opacity: (isLoading || (payMethod === "SLIP" && !slipUrl)) ? 0.65 : 1 }}>
                            {isLoading
                                ? (payMethod === "PAYHERE" ? "Initiating Payment..." : "Submitting Order...")
                                : payMethod === "PAYHERE"
                                    ? "Pay Now Securely via PayHere 🔒"
                                    : "Submit Order with Payment Slip 📤"}
                        </button>

                        {payMethod === "SLIP" && !slipUrl && (
                            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                Upload your receipt above to enable submission
                            </p>
                        )}
                    </motion.div>
                )}

                {/* ── Step 3: Success ── */}
                {step === 3 && (
                    <motion.div key="step3"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>

                        {successMode === "PAYHERE" ? (
                            <>
                                <div style={{ width: 80, height: 80, background: "var(--vet-green-light)", color: "var(--vet-green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1.5rem" }}>✓</div>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Order Confirmed! 🎉</h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                                    Payment received. We've sent a confirmation email to you.
                                </p>
                            </>
                        ) : (
                            <>
                                <div style={{ width: 80, height: 80, background: "#eff6ff", color: "#1d4ed8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1.5rem" }}>🔍</div>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Slip Submitted!</h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                                    Your payment receipt has been submitted for review.
                                </p>
                                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", fontSize: "0.88rem", color: "#1d4ed8", marginBottom: "2rem", display: "inline-block" }}>
                                    ⏳ Our team will verify your payment and confirm your order shortly. You'll receive an email once confirmed.
                                </div>
                            </>
                        )}

                        <div style={{ background: "var(--background)", padding: "1.25rem 2rem", borderRadius: "var(--radius-md)", display: "inline-block", marginBottom: "2rem" }}>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Order Number</p>
                            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--vet-blue)", letterSpacing: "1px" }}>{placedOrderNumber}</p>
                        </div>

                        {error && <p style={{ color: "rgb(220,38,38)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                            {successMode === "PAYHERE" && (
                                <button onClick={handleDownloadReceipt} className="btn-secondary">📄 Download Receipt</button>
                            )}
                            <Link href="/orders" className="btn-primary">📦 Track My Order →</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Script src="https://www.payhere.lk/lib/payhere.js" strategy="lazyOnload" />
        </main>
    );
}
