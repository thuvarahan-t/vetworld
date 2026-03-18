package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BannerRequest {
    @NotBlank(message = "Banner imageUrl is required")
    @Size(max = 1000, message = "Image URL must be at most 1000 characters")
    private String imageUrl;

    @Size(max = 1000, message = "Redirect link must be at most 1000 characters")
    private String redirectLink;
}
