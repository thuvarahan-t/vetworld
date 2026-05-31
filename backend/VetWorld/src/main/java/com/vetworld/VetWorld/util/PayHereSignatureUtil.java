package com.vetworld.VetWorld.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

public final class PayHereSignatureUtil {

    private PayHereSignatureUtil() {
    }

    public static String checkoutHash(String merchantId, String orderId, String amount, String currency,
            String merchantSecret) {
        String secretMd5 = md5(merchantSecret).toUpperCase(Locale.ROOT);
        return md5(merchantId + orderId + amount + currency + secretMd5).toUpperCase(Locale.ROOT);
    }

    public static String notificationSignature(String merchantId, String orderId, String amount, String currency,
            String statusCode, String merchantSecret) {
        String secretMd5 = md5(merchantSecret).toUpperCase(Locale.ROOT);
        return md5(merchantId + orderId + amount + currency + statusCode + secretMd5).toUpperCase(Locale.ROOT);
    }

    public static boolean signatureMatches(String computedSig, String receivedSig) {
        if (computedSig == null || receivedSig == null) {
            return false;
        }

        return MessageDigest.isEqual(
                computedSig.getBytes(StandardCharsets.UTF_8),
                receivedSig.toUpperCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
    }

    /**
     * PayHere's signature specification requires MD5(secret) as part of the
     * signature input. MD5 is used only for PayHere protocol compatibility, not for
     * password hashing or new application cryptography.
     */
    @SuppressWarnings("java:S4790")
    public static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 algorithm not available", e);
        }
    }
}
