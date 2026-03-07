package com.vetworld.VetWorld.dto;

import com.vetworld.VetWorld.model.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String role;

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .build();
    }
}
