package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.model.OtpToken;
import com.vetworld.VetWorld.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Database-backed OTP store for email verification during signup.
 */
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_TTL_MINUTES = 15;

    private final OtpTokenRepository otpTokenRepository;

    /** Generate and store a 6-digit OTP for the given email. Returns the code. */
    @Transactional
    public String generateOtp(String email) {
        // range 0-999999 gives uniform distribution across all 6-digit codes
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        otpTokenRepository.save(OtpToken.builder()
                .email(normalizeEmail(email))
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES))
                .build());
        return code;
    }

    /**
     * Validate OTP. Returns true if code matches and has not expired. Removes on
     * success.
     */
    @Transactional
    public boolean verifyOtp(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        OtpToken token = otpTokenRepository.findById(normalizedEmail).orElse(null);
        if (token == null)
            return false;
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpTokenRepository.delete(token);
            return false;
        }
        if (!token.getCode().equals(code))
            return false;
        otpTokenRepository.delete(token); // one-time use
        return true;
    }

    /** Check if an unexpired OTP exists for this email. */
    public boolean hasOtp(String email) {
        return otpTokenRepository.existsByEmailAndExpiresAtAfter(normalizeEmail(email), LocalDateTime.now());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
