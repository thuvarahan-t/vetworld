package com.vetworld.VetWorld.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AdminOrderUpdateRequest {
    private String status;             // Optional: PROCESSING, PACKED, DELIVERED
    private LocalDate deliveryDate;    // Optional: admin sets expected delivery date
    private String cancellationReason; // Optional: triggers cancellation flow
}
