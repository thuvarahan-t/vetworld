package com.vetworld.VetWorld.dto;

import lombok.Data;

@Data
public class AdminStatsDto {
    private long totalProducts;
    private long totalCategories;
    private long totalBanners;
    private long topSellingCount;
}
