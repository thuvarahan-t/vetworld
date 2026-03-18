package com.vetworld.VetWorld.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private CategoryDto category;
    private boolean topSelling;
    private boolean soldOut;
    private LocalDateTime createdAt;
    private List<ProductTypeDto> types;
}
