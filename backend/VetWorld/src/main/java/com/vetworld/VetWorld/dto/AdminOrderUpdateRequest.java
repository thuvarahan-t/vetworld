package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AdminOrderUpdateRequest {
    @Size(max = 50, message = "Status must be at most 50 characters")
    private String status;             // Optional: PROCESSING, PACKED, DELIVERED

    private LocalDate deliveryDate;    // Optional: admin sets expected delivery date

    @Size(max = 500, message = "Cancellation reason must be at most 500 characters")
    private String cancellationReason; // Optional: triggers cancellation flow
}
