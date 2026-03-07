package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.AuthRequest;
import com.vetworld.VetWorld.dto.AuthResponse;
import com.vetworld.VetWorld.dto.ForgotPasswordRequest;
import com.vetworld.VetWorld.dto.ResetPasswordRequest;
import com.vetworld.VetWorld.dto.SendSignupOtpRequest;
import com.vetworld.VetWorld.dto.SignupRequest;
import com.vetworld.VetWorld.model.Role;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.UserRepository;
import com.vetworld.VetWorld.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.vetworld.VetWorld.service.OtpService;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final JavaMailSender mailSender;
        private final OtpService otpService;

        @Value("${app.mail.from:noreply@vetworld.com}")
        private String fromEmail;

        /**
         * POST /api/auth/send-signup-otp
         * Sends an OTP for email verification during signup.
         */
        @PostMapping("/send-signup-otp")
        public ResponseEntity<?> sendSignupOtp(@RequestBody SendSignupOtpRequest request) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                        .body(Map.of("error", "Email is already registered. Please log in."));
                }

                String code = otpService.generateOtp(request.getEmail());

                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(fromEmail);
                        message.setTo(request.getEmail());
                        message.setSubject("VetWorld - Verify your email");
                        message.setText(
                                        "Hello,\n\n" +
                                                        "Thank you for registering at VetWorld.\n\n" +
                                                        "Your verification code is: " + code + "\n\n" +
                                                        "This code is valid for 15 minutes. Do not share it with anyone.\n\n"
                                                        +
                                                        "Regards,\nVetWorld Team");
                        mailSender.send(message);
                        System.out.println("✅ Signup OTP email sent to " + request.getEmail());
                } catch (Exception e) {
                        System.err.println("❌ Email error: " + e.getMessage());
                        System.out.println("🔑 Fallback Signup OTP for " + request.getEmail() + ": " + code);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error",
                                                        "Could not send verification email. Please try again later."));
                }

                return ResponseEntity
                                .ok(Map.of("message", "A verification code has been sent to " + request.getEmail()));
        }

        /**
         * POST /api/auth/signup
         * Registers a new regular user in the system after verifying OTP.
         */
        @PostMapping("/signup")
        public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
                // Check if email already taken
                if (userRepository.existsByEmail(request.getEmail())) {
                        return ResponseEntity
                                        .status(HttpStatus.CONFLICT)
                                        .body(Map.of("error",
                                                        "Email is already registered. Please login or use a different email."));
                }

                // Verify OTP
                if (request.getOtp() == null || !otpService.verifyOtp(request.getEmail(), request.getOtp())) {
                        return ResponseEntity
                                        .status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Invalid or expired verification code."));
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
                                        new UsernamePasswordAuthenticationToken(request.getEmail(),
                                                        request.getPassword()));
                } catch (AuthenticationException e) {
                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("error", "Invalid email or password."));
                }

                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow();

                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

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
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("error", "No token provided."));
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

        /**
         * POST /api/auth/forgot-password
         * Generates a 6-digit reset code valid for 15 minutes.
         */
        @PostMapping("/forgot-password")
        public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
                User user = userRepository.findByEmail(request.getEmail())
                                .orElse(null);

                // Always return 200 to prevent email enumeration attacks
                if (user == null) {
                        return ResponseEntity.ok(Map.of(
                                        "message", "If this email is registered, a reset code has been sent."));
                }

                // Generate a 6-digit OTP
                String code = String.format("%06d", new Random().nextInt(999999));
                user.setResetToken(code);
                user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
                userRepository.save(user);

                // Send the OTP via email
                boolean emailSent = false;
                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setFrom(fromEmail);
                        message.setTo(user.getEmail());
                        message.setSubject("VetWorld - Password Reset Code");
                        message.setText(
                                        "Hello " + user.getName() + ",\n\n" +
                                                        "You requested a password reset for your VetWorld account.\n\n"
                                                        +
                                                        "Your reset code is: " + code + "\n\n" +
                                                        "This code is valid for 15 minutes. Do not share it with anyone.\n\n"
                                                        +
                                                        "If you did not request this, please ignore this email.\n\n" +
                                                        "Regards,\nVetWorld Team");
                        mailSender.send(message);
                        emailSent = true;
                        System.out.println("✅ Reset email sent to " + user.getEmail());
                } catch (Exception e) {
                        System.err.println("❌ Email error: " + e.getMessage());
                        System.out.println("🔑 Fallback OTP for " + user.getEmail() + ": " + code);
                }

                // Clean response — no debug fields
                return ResponseEntity.ok(Map.of(
                                "message", emailSent
                                                ? "A reset code has been sent to " + user.getEmail()
                                                                + ". Check your inbox!"
                                                : "Could not send email. Please try again or contact support."));
        }

        /**
         * POST /api/auth/reset-password
         * Validates the OTP code and sets a new password.
         */
        @PostMapping("/reset-password")
        public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
                User user = userRepository.findByEmail(request.getEmail())
                                .orElse(null);

                if (user == null || user.getResetToken() == null) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Invalid reset request."));
                }

                // Check code matches
                if (!user.getResetToken().equals(request.getResetCode())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Invalid reset code."));
                }

                // Check code hasn't expired (15 minutes)
                if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Reset code has expired. Please request a new one."));
                }

                // Set new password and clear reset token
                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                userRepository.save(user);

                return ResponseEntity.ok(Map.of("message", "Password reset successfully! You can now login."));
        }
}
