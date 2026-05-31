package com.vetworld.VetWorld.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthRateLimitService {

    private static final long MAX_REQUESTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String endpoint, String email, HttpServletRequest request) {
        return buckets.computeIfAbsent(bucketKey(endpoint, email, request), ignored -> newBucket())
                .tryConsume(1);
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(MAX_REQUESTS, WINDOW))
                .build();
    }

    private String bucketKey(String endpoint, String email, HttpServletRequest request) {
        if (email != null && !email.isBlank()) {
            return endpoint + ":email:" + email.trim().toLowerCase(Locale.ROOT);
        }
        return endpoint + ":ip:" + clientIp(request);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
