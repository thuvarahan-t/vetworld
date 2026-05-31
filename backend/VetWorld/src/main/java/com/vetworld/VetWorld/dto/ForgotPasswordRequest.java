package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    private String email;
}
