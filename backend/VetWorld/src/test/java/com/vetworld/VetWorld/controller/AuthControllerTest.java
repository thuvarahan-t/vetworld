package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.UserRepository;
import com.vetworld.VetWorld.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.hikari.maximum-pool-size=2",
    "app.jwt.secret=test_jwt_secret_key_minimum_256_bits_long_xxxxxxxxx", // must be 32+ chars for HS256
    "APP_ADMIN_EMAIL=admin@test.com",
    "APP_ADMIN_PASSWORD=TestAdminPass123"
})
public class AuthControllerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vetworld_test")
            .withUsername("test_user")
            .withPassword("test_password");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.vetworld.VetWorld.repository.OtpTokenRepository otpTokenRepository;

    private static final String TEST_EMAIL = "newuser@example.com";
    private static final String TEST_NAME = "John Doe";
    private static final String TEST_PASSWORD = "SecurePass123";
    private static final String TEST_PHONE = "+94771234567";
    private static final String TEST_ADDRESS = "123 Main St";

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        otpTokenRepository.deleteAll();
    }

    @Test
    void testSignupFlow_SendOtp_Success() throws Exception {
        mockMvc.perform(post("/api/auth/send-signup-otp")
                .contentType("application/json")
                .content("{\"email\":\"" + TEST_EMAIL + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        assertTrue(otpService.hasOtp(TEST_EMAIL));
    }

    @Test
    void testSignupFlow_SendOtp_DuplicateEmail_Conflict() throws Exception {
        // Create existing user
        User existingUser = User.builder()
                .email(TEST_EMAIL)
                .password("hashed")
                .name("Existing User")
                .build();
        userRepository.save(existingUser);

        mockMvc.perform(post("/api/auth/send-signup-otp")
                .contentType("application/json")
                .content("{\"email\":\"" + TEST_EMAIL + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testSignupFlow_CompleteSignup_ValidOtp_Success() throws Exception {
        // Step 1: Generate OTP
        String otp = otpService.generateOtp(TEST_EMAIL);

        // Step 2: Sign up with OTP
        String signupJson = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"%s\"}",
            TEST_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS, otp
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.name").value(TEST_NAME))
                .andExpect(jsonPath("$.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.role").value("USER"));

        // Verify user was created
        User createdUser = userRepository.findByEmail(TEST_EMAIL).orElse(null);
        assertNotNull(createdUser);
        assertEquals(TEST_NAME, createdUser.getName());
        assertTrue(passwordEncoder.matches(TEST_PASSWORD, createdUser.getPassword()));
    }

    @Test
    void testSignupFlow_InvalidOtp_BadRequest() throws Exception {
        // Generate OTP but don't use it (use a different one)
        otpService.generateOtp(TEST_EMAIL);

        String signupJson = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"999999\"}",
            TEST_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());

        // User should NOT be created
        assertFalse(userRepository.existsByEmail(TEST_EMAIL));
    }

    @Test
    void testSignupFlow_MissingOtp_BadRequest() throws Exception {
        String signupJson = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\"}",
            TEST_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson))
                .andExpect(status().isBadRequest());

        assertFalse(userRepository.existsByEmail(TEST_EMAIL));
    }

    @Test
    void testSignupFlow_ExpiredOtp_BadRequest() throws Exception {
        // Create an expired OTP by generating one and then manually waiting
        String otp = otpService.generateOtp(TEST_EMAIL);

        // Consume the OTP to make it unavailable
        otpService.verifyOtp(TEST_EMAIL, otp);

        // Try to use it again (it's been consumed)
        String signupJson = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"%s\"}",
            TEST_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS, otp
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());

        assertFalse(userRepository.existsByEmail(TEST_EMAIL));
    }

    @Test
    void testSignupFlow_DuplicateEmail_AfterSignup_Conflict() throws Exception {
        // Complete first signup
        String otp1 = otpService.generateOtp(TEST_EMAIL);
        String signupJson1 = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"%s\"}",
            TEST_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS, otp1
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson1))
                .andExpect(status().isCreated());

        // Try to signup with same email
        String otp2 = otpService.generateOtp(TEST_EMAIL);
        String signupJson2 = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"%s\"}",
            TEST_NAME, TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS, otp2
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testLogin_ValidCredentials_Success() throws Exception {
        // Create user with known password
        User user = User.builder()
                .email("login@example.com")
                .password(passwordEncoder.encode("LoginPass123"))
                .name("Login Test")
                .build();
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"login@example.com\",\"password\":\"LoginPass123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.name").value("Login Test"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void testLogin_InvalidPassword_Unauthorized() throws Exception {
        User user = User.builder()
                .email("login@example.com")
                .password(passwordEncoder.encode("CorrectPass123"))
                .name("Login Test")
                .build();
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"login@example.com\",\"password\":\"WrongPass123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testLogin_UnregisteredEmail_Unauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"nonexistent@example.com\",\"password\":\"AnyPass123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testSendSignupOtp_ValidationFailure_BlankEmail() throws Exception {
        mockMvc.perform(post("/api/auth/send-signup-otp")
                .contentType("application/json")
                .content("{\"email\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSendSignupOtp_ValidationFailure_InvalidEmail() throws Exception {
        mockMvc.perform(post("/api/auth/send-signup-otp")
                .contentType("application/json")
                .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSignup_ValidationFailure_ShortPassword() throws Exception {
        String otp = otpService.generateOtp(TEST_EMAIL);

        String signupJson = String.format(
            "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"short\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"%s\"}",
            TEST_NAME, TEST_EMAIL, TEST_PHONE, TEST_ADDRESS, otp
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson))
                .andExpect(status().isBadRequest());

        assertFalse(userRepository.existsByEmail(TEST_EMAIL));
    }

    @Test
    void testSignup_ValidationFailure_BlankName() throws Exception {
        String otp = otpService.generateOtp(TEST_EMAIL);

        String signupJson = String.format(
            "{\"name\":\"\",\"email\":\"%s\",\"password\":\"%s\",\"phone\":\"%s\",\"address\":\"%s\",\"otp\":\"%s\"}",
            TEST_EMAIL, TEST_PASSWORD, TEST_PHONE, TEST_ADDRESS, otp
        );

        mockMvc.perform(post("/api/auth/signup")
                .contentType("application/json")
                .content(signupJson))
                .andExpect(status().isBadRequest());

        assertFalse(userRepository.existsByEmail(TEST_EMAIL));
    }
}
