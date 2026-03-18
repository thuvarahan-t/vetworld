package com.vetworld.VetWorld.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductTypeDto {
    private Long id;
    private String typeName;
    private BigDecimal price;
    private String imageUrl;
    private String projectKey;
    private boolean soldOut;
}
