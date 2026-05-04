package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.OrderDto;
import com.vetworld.VetWorld.dto.PlaceOrderRequest;
import com.vetworld.VetWorld.model.Order;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.UserRepository;
import com.vetworld.VetWorld.service.OrderService;
import com.vetworld.VetWorld.service.ReceiptPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final ReceiptPdfService receiptPdfService;
    private final UserRepository userRepository;

    @Value("${payhere.merchant.id}")
    private String merchantId;

    @Value("${payhere.merchant.secret}")
    private String merchantSecret;

    // ── Helper: resolve current user ──────────────────────────────────────
    private User getCurrentUser(Authentication auth) {
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── MD5 helper ────────────────────────────────────────────────────────
    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            BigInteger no = new BigInteger(1, digest);
            String hash = no.toString(16);
            while (hash.length() < 32) hash = "0" + hash;
            return hash;
        } catch (Exception e) {
            throw new RuntimeException("MD5 error", e);
        }
    }

    // ── POST /api/orders → create pending order + return PayHere params ───
    @PostMapping
    public ResponseEntity<?> placeOrder(
            @RequestBody PlaceOrderRequest req,
            Authentication auth) {
        try {
            User user = getCurrentUser(auth);
            Order order = orderService.createPendingOrder(user, req);

            // Build PayHere hash server-side (NEVER expose merchant secret to frontend)
            // Use Locale.US to guarantee '.' as decimal separator regardless of JVM locale
            DecimalFormat df = new DecimalFormat("0.00", new DecimalFormatSymbols(Locale.US));
            String amountFormatted = df.format(order.getTotalAmount());
            String currency = "LKR";

            String secretMd5 = md5(merchantSecret).toUpperCase();
            String hashInput = merchantId + order.getOrderNumber() + amountFormatted + currency + secretMd5;
            String hash = md5(hashInput).toUpperCase();
            System.err.println("=== PAYHERE HASH DEBUG ===");
            System.err.println("merchant_id   : [" + merchantId + "]");
            System.err.println("order_id      : [" + order.getOrderNumber() + "]");
            System.err.println("amount        : [" + amountFormatted + "]");
            System.err.println("currency      : [" + currency + "]");
            System.err.println("secret_md5    : [" + secretMd5 + "]");
            System.err.println("hash_input    : [" + hashInput + "]");
            System.err.println("final_hash    : [" + hash + "]");
            System.err.println("=========================");

            return ResponseEntity.ok(Map.of(
                    "orderId", order.getId(),
                    "orderNumber", order.getOrderNumber(),
                    "totalAmount", amountFormatted,
                    "currency", currency,
                    "merchantId", merchantId,
                    "hash", hash
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /api/orders/my → logged-in user's orders ──────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<OrderDto>> getMyOrders(Authentication auth) {
        User user = getCurrentUser(auth);
        return ResponseEntity.ok(orderService.getUserOrders(user));
    }

    // ── PUT /api/orders/{id}/payment-slip → user uploads slip URL ─────────
    @PutMapping("/{id}/payment-slip")
    public ResponseEntity<?> uploadPaymentSlip(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            User user = getCurrentUser(auth);
            String slipUrl = body.get("paymentSlipUrl");
            if (slipUrl == null || slipUrl.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Slip URL is required"));
            }
            OrderDto updated = orderService.submitPaymentSlip(user, id, slipUrl);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/orders/{id}/bank-details → user submits bank details ─────
    @PutMapping("/{id}/bank-details")
    public ResponseEntity<?> submitBankDetails(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            User user = getCurrentUser(auth);
            String bankDetails = body.get("bankDetails");
            if (bankDetails == null || bankDetails.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bank details are required"));
            }
            OrderDto updated = orderService.submitBankDetails(user, id, bankDetails);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /api/orders/{id}/receipt → download PDF ───────────────────────
    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long id, Authentication auth) {
        try {
            User user = getCurrentUser(auth);
            Order order = orderService.getRawOrder(id);

            // Security: users can only download their own receipts
            if (!order.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            byte[] pdfBytes = receiptPdfService.generateReceipt(order);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData(
                    "attachment",
                    "VetWorld-Receipt-" + order.getOrderNumber() + ".pdf"
            );
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
