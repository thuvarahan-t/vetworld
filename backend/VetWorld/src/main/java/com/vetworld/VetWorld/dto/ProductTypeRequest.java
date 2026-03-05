package com.vetworld.VetWorld.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductTypeRequest {
    private String typeName;
    private BigDecimal price;
}
