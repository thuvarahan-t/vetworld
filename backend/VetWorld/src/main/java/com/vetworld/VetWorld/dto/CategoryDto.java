package com.vetworld.VetWorld.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CategoryDto {
    private Long id;
    private String name;
    private String imageUrl;
    private LocalDateTime createdAt;
}
