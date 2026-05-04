package com.vetworld.VetWorld.model;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAYMENT_FAILED,
    PAYMENT_CANCELLED,
    PAYMENT_REVIEW,
    CONFIRMED,
    PROCESSING,
    PACKED,
    DELIVERED,
    CANCELLED,
    REFUNDED
}
