package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.Map;

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
        String computedSig = computeSignature(recMerchantId, orderId, amount, currency, statusCode);
        if (!computedSig.equalsIgnoreCase(receivedSig)) {
            System.err.println("❌ PayHere signature mismatch for order: " + orderId);
            return ResponseEntity.ok("INVALID_SIGNATURE"); // always return 200 to PayHere
        }

        // 2. statusCode 2 = success
        if ("2".equals(statusCode)) {
            try {
                orderService.confirmPayment(orderId, payherePaymentId);
                System.out.println("✅ Payment confirmed for order: " + orderId);
            } catch (Exception e) {
                System.err.println("❌ Failed to confirm order " + orderId + ": " + e.getMessage());
            }
        } else {
            // statusCode 0=pending, -1=cancelled, -2=failed, -3=chargebacked
            System.out.println("ℹ️ PayHere notification for order " + orderId + " with status: " + statusCode);
        }

        return ResponseEntity.ok("OK");
    }

    // ── MD5 hash (matches PayHere spec exactly) ───────────────────────────
    private String computeSignature(String merchantId, String orderId,
                                    String amount, String currency, String statusCode) {
        String secretMd5 = md5(merchantSecret).toUpperCase();
        String raw = merchantId + orderId + amount + currency + statusCode + secretMd5;
        return md5(raw).toUpperCase();
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes());
            BigInteger no = new BigInteger(1, digest);
            String hash = no.toString(16);
            while (hash.length() < 32) hash = "0" + hash;
            return hash;
        } catch (Exception e) {
            throw new RuntimeException("MD5 error", e);
        }
    }
}
