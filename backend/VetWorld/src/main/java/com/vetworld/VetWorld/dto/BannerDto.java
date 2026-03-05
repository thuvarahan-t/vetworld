package com.vetworld.VetWorld.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BannerDto {
    private Long id;
    private String imageUrl;
    private String redirectLink;
    private LocalDateTime createdAt;
}
