package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.model.PasswordResetToken;
import com.vetworld.VetWorld.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Issues and validates password-reset codes. Only a SHA-256 hash of each code
 * is persisted (never the plain code), and requests are rate-limited per user.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_TTL_MINUTES = 15;
    private static final int MAX_REQUESTS_PER_WINDOW = 3;

    private final PasswordResetTokenRepository tokenRepository;

    /**
     * Returns true if the user has reached the limit of reset requests within the
     * current window (an unexpired token equals a request made in the last 15 min).
     */
    public boolean isRateLimited(Long userId) {
        return tokenRepository.countByUserIdAndExpiresAtAfter(userId, LocalDateTime.now())
                >= MAX_REQUESTS_PER_WINDOW;
    }

    /** Generates a 6-digit reset code, persists its SHA-256 hash, returns the plain code. */
    @Transactional
    public String createToken(Long userId) {
        // range 0-999999 gives uniform distribution across all 6-digit codes
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        tokenRepository.save(PasswordResetToken.builder()
                .userId(userId)
                .tokenHash(sha256Hex(code))
                .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_TTL_MINUTES))
                .used(false)
                .build());
        return code;
    }

    /**
     * Validates the submitted code against an unused, unexpired token for the user.
     * Marks the token used on success so it cannot be replayed.
     */
    @Transactional
    public boolean consumeToken(Long userId, String code) {
        if (code == null) {
            return false;
        }
        return tokenRepository
                .findByUserIdAndTokenHashAndUsedFalseAndExpiresAtAfter(
                        userId, sha256Hex(code), LocalDateTime.now())
                .map(token -> {
                    token.setUsed(true);
                    tokenRepository.save(token);
                    return true;
                })
                .orElse(false);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
