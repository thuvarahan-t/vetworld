package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    @Size(max = 255, message = "Name must be at most 255 characters")
    private String name;

    @Pattern(regexp = "^[0-9+\\-\\s()]{7,15}$|^$", message = "Phone format is invalid")
    private String phone;

    @Size(max = 500, message = "Address must be at most 500 characters")
    private String address;
}
