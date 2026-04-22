package com.vetworld.VetWorld.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Email service using Resend REST API (https://resend.com).
 * Works on all hosting platforms including Render free tier
 * (no SMTP port needed — uses only HTTPS port 443).
 */
@Service
public class EmailService {

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${app.mail.from:otp@vetworld.thuvarahan.me}")
    private String fromEmail;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Send an email via Resend API.
     * Returns true if sent successfully, false otherwise.
     */
    public boolean sendEmail(String to, String subject, String text) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            System.err.println("❌ RESEND_API_KEY is not configured. Email not sent to: " + to);
            return false;
        }

        // Escape special characters for JSON
        String safeText = text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");

        String jsonBody = String.format(
                "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"}",
                fromEmail, to, subject, safeText
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                System.out.println("✅ Email sent via Resend to: " + to);
                return true;
            } else {
                System.err.println("❌ Resend API error " + response.statusCode() + ": " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("❌ Email send failed: " + e.getMessage());
            return false;
        }
    }
}
