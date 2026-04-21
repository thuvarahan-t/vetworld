/**
 * Global type declarations for the PayHere LK JS SDK.
 *
 * The PayHere LK SDK is NOT an npm package — it is loaded at runtime via:
 *   <script src="https://www.payhere.lk/lib/payhere.js"></script>
 *
 * This file teaches TypeScript about the `window.payhere` global that the
 * script injects, so `window.payhere.onCompleted` etc. compile cleanly.
 *
 * Placement: frontend/types/payhere.d.ts
 * tsconfig.json already includes **\/*.ts — no tsconfig changes needed.
 *
 * @see https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout
 */

// ─── Payment configuration passed to startPayment() ────────────────────────

interface PayHerePaymentConfig {
    /** Use PayHere sandbox (test) environment */
    sandbox: boolean;
    /** PayHere merchant ID from the merchant dashboard */
    merchant_id: string;
    /** URL to redirect after successful payment */
    return_url: string;
    /** URL to redirect when the user cancels */
    cancel_url: string;
    /** Backend webhook URL (server-to-server notify) */
    notify_url: string;
    /** Unique order identifier */
    order_id: string;
    /** Human-readable description of the items */
    items: string;
    /** Payment amount string, e.g. "1500.00" */
    amount: string;
    /** ISO 4217 currency code, e.g. "LKR" */
    currency: string;
    /** HMAC-MD5 signature for request integrity */
    hash: string;
    /** Customer first name */
    first_name: string;
    /** Customer last name */
    last_name: string;
    /** Customer email */
    email: string;
    /** Customer phone number */
    phone: string;
    /** Customer street address */
    address: string;
    /** Customer city */
    city: string;
    /** Customer country */
    country: string;
    /** Optional delivery address */
    delivery_address?: string;
    /** Optional delivery city */
    delivery_city?: string;
    /** Optional delivery country */
    delivery_country?: string;
    /** Optional custom string fields */
    custom_1?: string;
    custom_2?: string;
}

// ─── The global `payhere` object injected by the SDK script ─────────────────

interface PayHereStatic {
    /**
     * Callback invoked when payment completes successfully.
     * @param orderId - The PayHere order ID as a string
     */
    onCompleted: (orderId: string) => void;

    /**
     * Callback invoked when the user dismisses the payment popup
     * without completing payment.
     */
    onDismissed: () => void;

    /**
     * Callback invoked when a payment error occurs.
     * @param errorMsg - Human-readable error description from PayHere
     */
    onError: (errorMsg: string) => void;

    /**
     * Opens the PayHere checkout popup with the provided payment config.
     */
    startPayment: (config: PayHerePaymentConfig) => void;
}

// ─── Augment Window to include the global `payhere` variable ────────────────

declare global {
    interface Window {
        payhere: PayHereStatic;
    }
}

export {};
