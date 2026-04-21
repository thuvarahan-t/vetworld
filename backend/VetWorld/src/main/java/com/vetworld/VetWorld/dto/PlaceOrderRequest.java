package com.vetworld.VetWorld.dto;

import lombok.Data;

import java.util.List;

@Data
public class PlaceOrderRequest {
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private List<OrderItemRequest> items;
}
