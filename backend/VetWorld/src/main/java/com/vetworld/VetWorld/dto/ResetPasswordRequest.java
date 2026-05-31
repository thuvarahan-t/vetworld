package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    private String email;

    @NotBlank(message = "Reset code is required")
    @Size(min = 6, max = 6, message = "Reset code must be 6 digits")
    @Pattern(regexp = "^[0-9]{6}$", message = "Reset code must be 6 digits")
    private String resetCode;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String newPassword;
}
