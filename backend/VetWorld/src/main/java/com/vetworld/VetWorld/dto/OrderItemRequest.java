package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Type ID is required")
    private Long typeId;

    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must be at most 255 characters")
    private String productName;

    @NotBlank(message = "Type name is required")
    @Size(max = 255, message = "Type name must be at most 255 characters")
    private String typeName;

    private BigDecimal unitPrice; // For display only; never used for calculation

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 100, message = "Quantity cannot exceed 100")
    private int quantity;
}
