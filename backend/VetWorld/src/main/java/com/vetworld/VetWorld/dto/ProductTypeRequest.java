package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductTypeRequest {
    @NotBlank(message = "Product type name is required")
    @Size(max = 120, message = "Product type name must be at most 120 characters")
    private String typeName;

    @NotNull(message = "Product type price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Product type price must be greater than 0")
    private BigDecimal price;

    @Size(max = 1000, message = "Type image URL must be at most 1000 characters")
    private String imageUrl;

    @Size(max = 120, message = "Product key must be at most 120 characters")
    private String projectKey;

    private boolean soldOut;
}
