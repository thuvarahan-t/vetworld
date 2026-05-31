package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.model.OtpToken;
import com.vetworld.VetWorld.repository.OtpTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.PostgreSQLContainer;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.hikari.maximum-pool-size=2"
})
public class OtpServiceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vetworld_test")
            .withUsername("test_user")
            .withPassword("test_password");

    @Autowired
    private OtpService otpService;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    private static final String TEST_EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        otpTokenRepository.deleteAll();
    }

    @Test
    void testGenerateOtp_CreatesValidToken() {
        String code = otpService.generateOtp(TEST_EMAIL);

        assertNotNull(code);
        assertEquals(6, code.length());
        assertTrue(code.matches("\\d{6}"));

        OtpToken token = otpTokenRepository.findById(TEST_EMAIL).orElse(null);
        assertNotNull(token);
        assertEquals(code, token.getCode());
    }

    @Test
    void testVerifyOtp_CorrectCode_ReturnsTrue() {
        String code = otpService.generateOtp(TEST_EMAIL);

        boolean result = otpService.verifyOtp(TEST_EMAIL, code);

        assertTrue(result);
        // Token should be deleted after successful verification (one-time use)
        assertFalse(otpTokenRepository.existsById(TEST_EMAIL));
    }

    @Test
    void testVerifyOtp_IncorrectCode_ReturnsFalse() {
        otpService.generateOtp(TEST_EMAIL);

        boolean result = otpService.verifyOtp(TEST_EMAIL, "999999");

        assertFalse(result);
        // Token should still exist after failed verification
        assertTrue(otpTokenRepository.existsById(TEST_EMAIL));
    }

    @Test
    void testVerifyOtp_NonExistentEmail_ReturnsFalse() {
        boolean result = otpService.verifyOtp("nonexistent@example.com", "123456");

        assertFalse(result);
    }

    @Test
    void testVerifyOtp_ExpiredToken_ReturnsFalse() {
        // Create an expired token manually
        OtpToken expiredToken = OtpToken.builder()
                .email(TEST_EMAIL)
                .code("123456")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();
        otpTokenRepository.save(expiredToken);

        boolean result = otpService.verifyOtp(TEST_EMAIL, "123456");

        assertFalse(result);
        // Expired token should be deleted
        assertFalse(otpTokenRepository.existsById(TEST_EMAIL));
    }

    @Test
    void testOtpExpiry_15MinuteTTL() {
        String code = otpService.generateOtp(TEST_EMAIL);
        OtpToken token = otpTokenRepository.findById(TEST_EMAIL).orElseThrow();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = token.getExpiresAt();

        // Should expire approximately 15 minutes from now (allow 1 minute tolerance)
        long minutesDiff = java.time.temporal.ChronoUnit.MINUTES.between(now, expiry);
        assertTrue(minutesDiff >= 14 && minutesDiff <= 16);
    }

    @Test
    void testOtpIsOneTimeUse_CantBeUsedTwice() {
        String code = otpService.generateOtp(TEST_EMAIL);

        // First use should succeed
        assertTrue(otpService.verifyOtp(TEST_EMAIL, code));

        // Second use should fail (token deleted after first use)
        assertFalse(otpService.verifyOtp(TEST_EMAIL, code));
    }

    @Test
    void testHasOtp_UnexpiredToken_ReturnsTrue() {
        otpService.generateOtp(TEST_EMAIL);

        assertTrue(otpService.hasOtp(TEST_EMAIL));
    }

    @Test
    void testHasOtp_ExpiredToken_ReturnsFalse() {
        OtpToken expiredToken = OtpToken.builder()
                .email(TEST_EMAIL)
                .code("123456")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();
        otpTokenRepository.save(expiredToken);

        assertFalse(otpService.hasOtp(TEST_EMAIL));
    }

    @Test
    void testHasOtp_NoToken_ReturnsFalse() {
        assertFalse(otpService.hasOtp(TEST_EMAIL));
    }
}
