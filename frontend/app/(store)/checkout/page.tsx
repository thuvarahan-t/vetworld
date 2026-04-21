"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { userApi } from "@/lib/api";
import Link from "next/link";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCartStore();
    const grandTotal = totalPrice();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Step 1: Delivery Details
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    // Step 3: Success state
    const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
    const [placedOrderNumber, setPlacedOrderNumber] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const userStr = localStorage.getItem("vetworld_user");
        const token = localStorage.getItem("vetworld_token");

        if (!token || !userStr) {
            router.push("/");
            return;
        }

        try {
            const user = JSON.parse(userStr);
            setIsAuthenticated(true);
            setName(user.name || "");
            setPhone(user.phone || "");
            setAddress(user.address || "");
        } catch {
            router.push("/");
        }

        if (items.length === 0 && step !== 3) {
            router.push("/cart");
        }
    }, [router, items.length, step]);

    const handleProceedToReview = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!name || !phone || !address) {
            setError("Please fill in all delivery details.");
            return;
        }
        
        setStep(2);
    };

    const handlePayNow = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        setError("");

        try {
            // 1. Create PENDING_PAYMENT order in backend
            const payload = {
                customerName: name,
                customerPhone: phone,
                deliveryAddress: address,
                items: items.map(i => ({
                    productId: i.productId,
                    typeId: i.typeId,
                    productName: i.productName,
                    typeName: i.typeName,
                    unitPrice: i.unitPrice,
                    quantity: i.quantity
                }))
            };

            const payhereInit = await userApi.placeOrder(payload);

            // 2. Initialize PayHere Embed SDK
            const payhereConfig = {
                sandbox: true, // TODO: switch based on environment config if needed
                merchant_id: payhereInit.merchantId,
                return_url: `${window.location.origin}/orders`,
                cancel_url: `${window.location.origin}/checkout`,
                notify_url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/payments/notify`,
                order_id: payhereInit.orderNumber,
                items: "VetWorld Order " + payhereInit.orderNumber,
                amount: payhereInit.totalAmount,
                currency: payhereInit.currency,
                hash: payhereInit.hash,
                first_name: name.split(' ')[0] || name,
                last_name: name.split(' ')[1] || '',
                email: JSON.parse(localStorage.getItem('vetworld_user') || '{}').email || '',
                phone: phone,
                address: address,
                city: "Sri Lanka",
                country: "Sri Lanka",
            };

            // window.payhere is injected by the PayHere LK JS SDK script below
            window.payhere.onCompleted = function onCompleted(orderId) {
                // Payment success — orderId is the PayHere transaction reference
                console.log("PayHere payment completed:", orderId);
                setPlacedOrderId(payhereInit.orderId);
                setPlacedOrderNumber(payhereInit.orderNumber);
                clearCart();
                setStep(3);
            };

            window.payhere.onDismissed = function onDismissed() {
                // User closed the PayHere popup without paying
                setIsLoading(false);
                setError("Payment was cancelled. You can try again.");
            };

            window.payhere.onError = function onError(errorMsg) {
                // PayHere reported an error inside the widget
                setIsLoading(false);
                setError("Payment error: " + errorMsg);
            };

            // Open the PayHere checkout popup
            window.payhere.startPayment(payhereConfig);

        } catch (err: any) {
            setError(err.message || "Failed to initiate payment. Please try again.");
            setIsLoading(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!placedOrderId) return;
        try {
            await userApi.downloadReceipt(placedOrderId);
        } catch (err) {
            alert("Failed to download receipt.");
        }
    };

    if (!isAuthenticated) return null; // loading or redirecting

    return (
        <main className="container-main section" style={{ maxWidth: 800 }}>
            {step !== 3 && (
                <div style={{ marginBottom: "2rem" }}>
                    <h1 className="section-title">Checkout</h1>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", alignItems: "center" }}>
                        <div style={{ fontWeight: step === 1 ? 700 : 500, color: step === 1 ? "var(--vet-blue)" : "var(--text-secondary)" }}>
                            1. Delivery Details
                        </div>
                        <div style={{ color: "var(--border)" }}>→</div>
                        <div style={{ fontWeight: step === 2 ? 700 : 500, color: step === 2 ? "var(--vet-blue)" : "var(--text-secondary)" }}>
                            2. Review & Pay
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.form
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleProceedToReview}
                        className="card" style={{ padding: "2rem" }}
                    >
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Confirm Delivery Details</h2>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Recipient Name</label>
                                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Contact Phone View</label>
                                <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Delivery Address</label>
                                <textarea className="input" rows={3} value={address} onChange={e => setAddress(e.target.value)} required style={{ resize: "vertical" }} />
                            </div>
                            
                            <div style={{ padding: "1rem", background: "var(--vet-blue-light)", borderRadius: "var(--radius-sm)", color: "var(--vet-blue)", fontWeight: 500 }}>
                                💳 Payment Method: Secure Online Card Payment (PayHere)
                            </div>
                        </div>

                        {error && <div style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</div>}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                            <button type="submit" className="btn-primary">
                                Continue to Review →
                            </button>
                        </div>
                    </motion.form>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="card" style={{ padding: "2rem" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Review Your Order</h2>
                            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--vet-blue)", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                                Edit Details
                            </button>
                        </div>

                        <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.5rem" }}>
                            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{name} • {phone}</p>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{address}</p>
                        </div>

                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {items.map(item => (
                                <div key={`${item.productId}-${item.typeId}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                        <div style={{ width: 40, height: 40, background: "var(--background)", borderRadius: 4, overflow: "hidden" }}>
                                            {item.productImage && <img src={item.productImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.typeName} × {item.quantity}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: "2px solid var(--border)", margin: "1.5rem 0", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>Total Amount</span>
                            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--vet-blue)" }}>
                                Rs. {grandTotal.toLocaleString()}
                            </span>
                        </div>

                        {error && <div style={{ color: "red", marginBottom: "1rem", fontSize: "0.9rem", textAlign: "center" }}>{error}</div>}

                        <button 
                            onClick={handlePayNow} 
                            disabled={isLoading}
                            className="btn-primary" 
                            style={{ width: "100%", justifyContent: "center", padding: "1rem", fontSize: "1.1rem", opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? "Initiating Payment..." : "Pay Now securely via PayHere 🔒"}
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}
                    >
                        <div style={{ width: 80, height: 80, background: "var(--vet-green-light)", color: "var(--vet-green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1.5rem" }}>
                            ✓
                        </div>
                        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Order Confirmed!</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                            Thank you for your order. We've sent a confirmation email to you.
                        </p>

                        <div style={{ background: "var(--background)", padding: "1.5rem", borderRadius: "var(--radius-md)", display: "inline-block", marginBottom: "2rem" }}>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Order Number</p>
                            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--vet-blue)", letterSpacing: "1px" }}>{placedOrderNumber}</p>
                        </div>

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                            <button onClick={handleDownloadReceipt} className="btn-secondary">
                                📄 Download Receipt
                            </button>
                            <Link href="/orders" className="btn-primary">
                                Track Order →
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/*
             * PayHere LK JS SDK — loaded once per page.
             * Injects window.payhere with startPayment / onCompleted /
             * onDismissed / onError. Types are in types/payhere.d.ts.
             * Use sandbox="https://sandbox.payhere.lk/lib/payhere.js" for testing.
             */}
            <Script
                src="https://www.payhere.lk/lib/payhere.js"
                strategy="lazyOnload"
            />
        </main>
    );
}
