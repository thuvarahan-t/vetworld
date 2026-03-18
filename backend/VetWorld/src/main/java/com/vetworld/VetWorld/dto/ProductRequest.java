package com.vetworld.VetWorld.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    @Size(max = 180, message = "Product name must be at most 180 characters")
    private String name;

    @NotBlank(message = "Product description is required")
    private String description;

    @NotBlank(message = "Product imageUrl is required")
    @Size(max = 1000, message = "Image URL must be at most 1000 characters")
    private String imageUrl;

    @NotNull(message = "Category id is required")
    private Long categoryId;

    private boolean topSelling;

    private boolean soldOut;

    @NotEmpty(message = "At least one product type is required")
    @Valid
    private List<ProductTypeRequest> types;
}
