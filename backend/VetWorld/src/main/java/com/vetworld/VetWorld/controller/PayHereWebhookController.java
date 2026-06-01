package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.service.OrderService;
import com.vetworld.VetWorld.util.PayHereSignatureUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(PayHereWebhookController.class);

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
            log.warn("PayHere signature mismatch for order: {}", orderId);
            return ResponseEntity.ok("INVALID_SIGNATURE"); // always return 200 to PayHere
        }

        // 2. Handle all PayHere status codes
        switch (statusCode) {
            case "2":
                // Payment successful
                try {
                    orderService.confirmPayment(orderId, payherePaymentId);
                    log.info("Payment confirmed for order: {}", orderId);
                } catch (Exception e) {
                    log.error("Failed to confirm order: {}", orderId, e);
                }
                break;
            case "0":
                log.info("Payment pending for order: {}", orderId);
                // status stays PENDING_PAYMENT — no action needed
                break;
            case "-1":
                try {
                    orderService.markPaymentFailed(orderId, "CANCELLED");
                    log.warn("Payment cancelled for order: {}", orderId);
                } catch (Exception e) {
                    log.error("Failed to mark cancelled for order: {}", orderId, e);
                }
                break;
            case "-2":
                try {
                    orderService.markPaymentFailed(orderId, "FAILED");
                    log.warn("Payment failed for order: {}", orderId);
                } catch (Exception e) {
                    log.error("Failed to mark failed for order: {}", orderId, e);
                }
                break;
            case "-3":
                try {
                    orderService.markPaymentFailed(orderId, "CHARGEBACK");
                    log.warn("Chargeback for order: {}", orderId);
                } catch (Exception e) {
                    log.error("Failed to mark chargeback for order: {}", orderId, e);
                }
                break;
            default:
                log.info("Unknown PayHere status {} for order: {}", statusCode, orderId);
        }

        return ResponseEntity.ok("OK");
    }
}
