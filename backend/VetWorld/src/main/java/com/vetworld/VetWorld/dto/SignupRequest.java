package com.vetworld.VetWorld.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String address;
    private String otp; // for email verification
}
