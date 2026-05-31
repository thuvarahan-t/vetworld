package com.vetworld.VetWorld.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class PlaceOrderRequest {
    @NotBlank(message = "Customer name is required")
    @Size(max = 255, message = "Customer name must be at most 255 characters")
    private String customerName;

    @NotBlank(message = "Customer phone is required")
    @Pattern(regexp = "^[0-9+\\-\\s()]{7,15}$", message = "Phone format is invalid")
    private String customerPhone;

    @NotBlank(message = "Delivery address is required")
    @Size(max = 500, message = "Delivery address must be at most 500 characters")
    private String deliveryAddress;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<OrderItemRequest> items;
}
