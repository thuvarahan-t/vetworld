package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.service.OrderService;
import com.vetworld.VetWorld.util.PayHereSignatureUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives asynchronous payment status notifications from PayHere.
 * PayHere posts application/x-www-form-urlencoded to this endpoint
 * after every payment attempt (success or failure).
 *
 * This endpoint is intentionally public (no JWT) — security is
 * enforced by verifying the MD5 signature using the merchant secret.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PayHereWebhookController {

    private final OrderService orderService;

    @Value("${payhere.merchant.id}")
    private String merchantId;

    @Value("${payhere.merchant.secret}")
    private String merchantSecret;

    @PostMapping("/notify")
    public ResponseEntity<String> handleNotify(
            @RequestParam("merchant_id")    String recMerchantId,
            @RequestParam("order_id")       String orderId,
            @RequestParam("payhere_amount") String amount,
            @RequestParam("payhere_currency") String currency,
            @RequestParam("status_code")    String statusCode,
            @RequestParam("md5sig")         String receivedSig,
            @RequestParam(value = "payment_id", required = false) String payherePaymentId) {

        // 1. Verify MD5 signature
        String computedSig = PayHereSignatureUtil.notificationSignature(
                recMerchantId, orderId, amount, currency, statusCode, merchantSecret);
        if (!PayHereSignatureUtil.signatureMatches(computedSig, receivedSig)) {
            System.err.println("❌ PayHere signature mismatch for order: " + orderId);
            return ResponseEntity.ok("INVALID_SIGNATURE"); // always return 200 to PayHere
        }

        // 2. Handle all PayHere status codes
        switch (statusCode) {
            case "2":
                // Payment successful
                try {
                    orderService.confirmPayment(orderId, payherePaymentId);
                    System.out.println("✅ Payment confirmed for order: " + orderId);
                } catch (Exception e) {
                    System.err.println("❌ Failed to confirm order " + orderId + ": " + e.getMessage());
                }
                break;
            case "0":
                System.out.println("⏳ PayHere payment pending for order: " + orderId);
                // status stays PENDING_PAYMENT — no action needed
                break;
            case "-1":
                try {
                    orderService.markPaymentFailed(orderId, "CANCELLED");
                    System.out.println("🚫 Payment cancelled for order: " + orderId);
                } catch (Exception e) {
                    System.err.println("❌ Failed to mark cancelled: " + orderId + ": " + e.getMessage());
                }
                break;
            case "-2":
                try {
                    orderService.markPaymentFailed(orderId, "FAILED");
                    System.out.println("❌ Payment failed for order: " + orderId);
                } catch (Exception e) {
                    System.err.println("❌ Failed to mark failed: " + orderId + ": " + e.getMessage());
                }
                break;
            case "-3":
                try {
                    orderService.markPaymentFailed(orderId, "CHARGEBACK");
                    System.out.println("🔄 Chargeback for order: " + orderId);
                } catch (Exception e) {
                    System.err.println("❌ Failed to mark chargeback: " + orderId + ": " + e.getMessage());
                }
                break;
            default:
                System.out.println("ℹ️ Unknown PayHere status " + statusCode + " for order: " + orderId);
        }

        return ResponseEntity.ok("OK");
    }
}
