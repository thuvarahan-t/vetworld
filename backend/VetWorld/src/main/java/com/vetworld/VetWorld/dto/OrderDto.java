package com.vetworld.VetWorld.dto;

import com.vetworld.VetWorld.model.Order;
import com.vetworld.VetWorld.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class OrderDto {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userEmail;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String payherePaymentId;
    private LocalDate deliveryDate;
    private String cancellationReason;
    private List<OrderItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderDto fromEntity(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .payherePaymentId(order.getPayherePaymentId())
                .deliveryDate(order.getDeliveryDate())
                .cancellationReason(order.getCancellationReason())
                .items(order.getItems().stream()
                        .map(OrderItemDto::fromEntity)
                        .collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
