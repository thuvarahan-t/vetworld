package com.vetworld.VetWorld.dto;

import com.vetworld.VetWorld.model.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemDto {
    private Long id;
    private Long productId;
    private Long typeId;
    private String productName;
    private String typeName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal lineTotal;

    public static OrderItemDto fromEntity(OrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .typeId(item.getTypeId())
                .productName(item.getProductName())
                .typeName(item.getTypeName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
