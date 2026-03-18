package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    @Size(max = 120, message = "Category name must be at most 120 characters")
    private String name;

    @Size(max = 1000, message = "Image URL must be at most 1000 characters")
    private String imageUrl;
}
