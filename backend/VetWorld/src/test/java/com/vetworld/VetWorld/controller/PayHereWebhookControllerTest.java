package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.model.Order;
import com.vetworld.VetWorld.model.OrderStatus;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.OrderRepository;
import com.vetworld.VetWorld.repository.UserRepository;
import com.vetworld.VetWorld.util.PayHereSignatureUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "payhere.merchant.id=1234567",
    "payhere.merchant.secret=test_secret_key"
})
public class PayHereWebhookControllerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vetworld_test")
            .withUsername("test_user")
            .withPassword("test_password");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    private String merchantId = "1234567";
    private String merchantSecret = "test_secret_key";
    private Order testOrder;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        userRepository.deleteAll();

        User user = User.builder()
                .email("test@example.com")
                .password("hashed_password")
                .name("Test User")
                .build();
        user = userRepository.save(user);

        testOrder = Order.builder()
                .orderNumber("VW-2026-12345678")
                .user(user)
                .customerName("John Doe")
                .customerPhone("+94771234567")
                .deliveryAddress("123 Main St")
                .totalAmount(new BigDecimal("1000.00"))
                .status(OrderStatus.PENDING_PAYMENT)
                .build();
        testOrder = orderRepository.save(testOrder);
    }

    @Test
    void testValidSignature_StatusCode2_ConfirmsPayment() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "2";
        String payherePaymentId = "payment-123";

        String signature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", signature)
                .param("payment_id", payherePaymentId))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        Order updatedOrder = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, updatedOrder.getStatus());
        assertEquals(payherePaymentId, updatedOrder.getPayherePaymentId());
    }

    @Test
    void testValidSignature_StatusCode0_Pending() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "0";

        String signature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", signature))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        Order updatedOrder = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.PENDING_PAYMENT, updatedOrder.getStatus());
    }

    @Test
    void testValidSignature_StatusCodeMinus1_MarksCancelled() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "-1";

        String signature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", signature))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        Order updatedOrder = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.PAYMENT_CANCELLED, updatedOrder.getStatus());
    }

    @Test
    void testValidSignature_StatusCodeMinus2_MarksFailed() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "-2";

        String signature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", signature))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        Order updatedOrder = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.PAYMENT_FAILED, updatedOrder.getStatus());
    }

    @Test
    void testValidSignature_StatusCodeMinus3_MarksChargeback() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "-3";

        String signature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", signature))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        Order updatedOrder = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.PAYMENT_FAILED, updatedOrder.getStatus());
    }

    @Test
    void testInvalidSignature_RejectsRequest() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "2";
        String invalidSignature = "INVALID_SIGNATURE_VALUE";

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", invalidSignature))
                .andExpect(status().isOk())
                .andExpect(content().string("INVALID_SIGNATURE"));

        Order updatedOrder = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.PENDING_PAYMENT, updatedOrder.getStatus());
    }

    @Test
    void testWrongMerchantId_InvalidSignature() throws Exception {
        String wrongMerchantId = "wrong_merchant_id";
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "2";

        // Signature computed with correct merchant ID
        String correctSignature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        // But webhook called with wrong merchant ID
        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", wrongMerchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", correctSignature))
                .andExpect(status().isOk())
                .andExpect(content().string("INVALID_SIGNATURE"));
    }

    @Test
    void testAlreadyProcessedOrder_IgnoresSecondNotification() throws Exception {
        String orderId = testOrder.getOrderNumber();
        String amount = "1000.00";
        String currency = "LKR";
        String statusCode = "2";

        String signature = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode, merchantSecret);

        // First notification — should succeed
        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode)
                .param("md5sig", signature))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        Order afterFirst = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, afterFirst.getStatus());

        // Second notification with different status — should be ignored
        String statusCode2 = "-1";
        String signature2 = PayHereSignatureUtil.notificationSignature(
                merchantId, orderId, amount, currency, statusCode2, merchantSecret);

        mockMvc.perform(post("/api/payments/notify")
                .param("merchant_id", merchantId)
                .param("order_id", orderId)
                .param("payhere_amount", amount)
                .param("payhere_currency", currency)
                .param("status_code", statusCode2)
                .param("md5sig", signature2))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        // Order status should remain CONFIRMED (unchanged)
        Order afterSecond = orderRepository.findByOrderNumber(orderId).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, afterSecond.getStatus());
    }
}
