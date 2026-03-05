package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.AuthRequest;
import com.vetworld.VetWorld.dto.AuthResponse;
import com.vetworld.VetWorld.dto.SignupRequest;
import com.vetworld.VetWorld.model.Role;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.UserRepository;
import com.vetworld.VetWorld.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * POST /api/auth/signup
     * Registers a new regular user in the system.
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        // Check if email already taken
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already registered. Please login or use a different email."));
        }

        User newUser = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(Role.USER)
                .build();

        userRepository.save(newUser);

        // Auto-login: generate a token for the newly created user
        String token = jwtUtil.generateToken(newUser.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                AuthResponse.builder()
                        .token(token)
                        .name(newUser.getName())
                        .email(newUser.getEmail())
                        .role(newUser.getRole().name())
                        .build());
    }

    /**
     * POST /api/auth/login
     * Authenticates a user (regular or admin) and returns a JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            // This will throw BadCredentialsException if invalid
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password."));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.ok(
                AuthResponse.builder()
                        .token(token)
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build());
    }

    /**
     * GET /api/auth/me
     * Returns currently authenticated user info from token.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No token provided."));
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token."));
        }
        String email = jwtUtil.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(
                AuthResponse.builder()
                        .token(token)
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build());
    }
}
