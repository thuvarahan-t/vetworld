package com.vetworld.VetWorld.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemRequest {
    private Long productId;
    private Long typeId;
    private String productName;
    private String typeName;
    private BigDecimal unitPrice;
    private int quantity;
}
