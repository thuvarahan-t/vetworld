package com.vetworld.VetWorld.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP store for email verification during signup.
 * Stores email -> {code, expiry} pairs with 15-minute TTL.
 */
@Service
public class OtpService {

    private record OtpEntry(String code, LocalDateTime expiry) {
    }

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();

    /** Generate and store a 6-digit OTP for the given email. Returns the code. */
    public String generateOtp(String email) {
        String code = String.format("%06d", new Random().nextInt(999999));
        store.put(email.toLowerCase(), new OtpEntry(code, LocalDateTime.now().plusMinutes(15)));
        return code;
    }

    /**
     * Validate OTP. Returns true if code matches and has not expired. Removes on
     * success.
     */
    public boolean verifyOtp(String email, String code) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null)
            return false;
        if (entry.expiry().isBefore(LocalDateTime.now())) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (!entry.code().equals(code))
            return false;
        store.remove(email.toLowerCase()); // one-time use
        return true;
    }

    /** Check if an unexpired OTP exists for this email. */
    public boolean hasOtp(String email) {
        OtpEntry entry = store.get(email.toLowerCase());
        return entry != null && entry.expiry().isAfter(LocalDateTime.now());
    }
}
