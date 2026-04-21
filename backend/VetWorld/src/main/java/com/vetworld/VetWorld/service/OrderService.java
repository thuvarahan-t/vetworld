package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.dto.AdminOrderUpdateRequest;
import com.vetworld.VetWorld.dto.OrderDto;
import com.vetworld.VetWorld.dto.PlaceOrderRequest;
import com.vetworld.VetWorld.model.*;
import com.vetworld.VetWorld.repository.OrderRepository;
import com.vetworld.VetWorld.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // ── Generate unique order number ─────────────────────────────────────
    private String generateOrderNumber() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        long count = orderRepository.count() + 1;
        return String.format("VW-%s-%05d", year, count);
    }

    // ── Place Order (status = PENDING_PAYMENT) ────────────────────────────
    @Transactional
    public Order createPendingOrder(User user, PlaceOrderRequest req) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item.");
        }

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .deliveryAddress(req.getDeliveryAddress())
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (var itemReq : req.getItems()) {
            BigDecimal lineTotal = itemReq.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.getProductId())
                    .typeId(itemReq.getTypeId())
                    .productName(itemReq.getProductName())
                    .typeName(itemReq.getTypeName())
                    .unitPrice(itemReq.getUnitPrice())
                    .quantity(itemReq.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
            order.getItems().add(item);
            total = total.add(lineTotal);
        }
        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    // ── Confirm Payment (called by PayHere webhook) ───────────────────────
    @Transactional
    public void confirmPayment(String orderNumber, String payherePaymentId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));

        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.CONFIRMED);
            order.setPayherePaymentId(payherePaymentId);
            orderRepository.save(order);
            sendConfirmationEmail(order);
        }
    }

    // ── Get user's orders ─────────────────────────────────────────────────
    public List<OrderDto> getUserOrders(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Get all orders (admin) ────────────────────────────────────────────
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Get single order ──────────────────────────────────────────────────
    public OrderDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        return OrderDto.fromEntity(order);
    }

    // ── Admin: update status / delivery date ──────────────────────────────
    @Transactional
    public OrderDto updateOrder(Long id, AdminOrderUpdateRequest req) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            order.setStatus(OrderStatus.valueOf(req.getStatus().toUpperCase()));
        }
        if (req.getDeliveryDate() != null) {
            order.setDeliveryDate(req.getDeliveryDate());
        }

        return OrderDto.fromEntity(orderRepository.save(order));
    }

    // ── Admin: cancel order ───────────────────────────────────────────────
    @Transactional
    public OrderDto cancelOrder(Long id, String reason) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        Order saved = orderRepository.save(order);

        sendCancellationEmail(saved);

        return OrderDto.fromEntity(saved);
    }

    // ── Get raw Order entity (for PDF generation) ─────────────────────────
    public Order getRawOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
    }

    // ── Internal: send confirmation email ─────────────────────────────────
    private void sendConfirmationEmail(Order order) {
        String subject = "VetWorld — Order Confirmed! 🎉 #" + order.getOrderNumber();
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(order.getCustomerName()).append(",\n\n");
        body.append("Thank you for your order! We have received your payment and your order is confirmed.\n\n");
        body.append("Order Number: ").append(order.getOrderNumber()).append("\n");
        body.append("Date: ").append(order.getCreatedAt()
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))).append("\n\n");
        body.append("Items Ordered:\n");
        for (var item : order.getItems()) {
            body.append("  • ").append(item.getProductName())
                    .append(" (").append(item.getTypeName()).append(")")
                    .append(" × ").append(item.getQuantity())
                    .append(" — Rs. ").append(item.getLineTotal().toPlainString()).append("\n");
        }
        body.append("\nTotal: Rs. ").append(order.getTotalAmount().toPlainString()).append("\n");
        body.append("Delivery Address: ").append(order.getDeliveryAddress()).append("\n\n");
        body.append("You can track your order status by logging into your VetWorld account.\n\n");
        body.append("Best regards,\nVetWorld Team");

        emailService.sendEmail(order.getUser().getEmail(), subject, body.toString());
    }

    // ── Internal: send cancellation email ────────────────────────────────
    private void sendCancellationEmail(Order order) {
        String subject = "VetWorld — Order Cancelled #" + order.getOrderNumber();
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(order.getCustomerName()).append(",\n\n");
        body.append("We regret to inform you that your order #").append(order.getOrderNumber())
                .append(" has been cancelled.\n\n");
        if (order.getCancellationReason() != null && !order.getCancellationReason().isBlank()) {
            body.append("Reason: ").append(order.getCancellationReason()).append("\n\n");
        }
        body.append("If a payment was made, a refund will be processed shortly.\n\n");
        body.append("We apologize for any inconvenience. Please contact us if you have any questions.\n\n");
        body.append("Best regards,\nVetWorld Team");

        emailService.sendEmail(order.getUser().getEmail(), subject, body.toString());
    }
}
