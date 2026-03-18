package com.vetworld.VetWorld.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRoleUpdateRequest {
    @NotBlank(message = "Role is required")
    private String role;
}
