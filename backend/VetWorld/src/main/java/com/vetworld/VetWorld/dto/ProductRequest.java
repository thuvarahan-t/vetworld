package com.vetworld.VetWorld.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductRequest {
    private String name;
    private String description;
    private String imageUrl;
    private Long categoryId;
    private boolean topSelling;
    private List<ProductTypeRequest> types;
}
