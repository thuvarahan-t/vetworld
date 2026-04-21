package com.vetworld.VetWorld.dto;

import lombok.Data;

@Data
public class AdminStatsDto {
    private long totalProducts;
    private long totalCategories;
    private long totalBanners;
    private long totalUsers;
    private long topSellingCount;
    private long totalOrders;
    private long pendingOrders;
}
