package com.vetworld.VetWorld.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Startup health check for PayHere payment gateway.
 * Logs sandbox mode status clearly at application startup as a fail-safe.
 */
@Component
@RequiredArgsConstructor
public class PayHereHealthCheck implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(PayHereHealthCheck.class);

    @Value("${payhere.sandbox:false}")
    private boolean isSandbox;

    @Value("${payhere.merchant.id:}")
    private String merchantId;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        logPayHereStatus();
    }

    private void logPayHereStatus() {
        if (isSandbox) {
            logger.warn("⚠️  PayHere running in SANDBOX mode — no real payments processed");
        } else {
            logger.info("✅ PayHere running in PRODUCTION mode");
        }

        if (merchantId == null || merchantId.isBlank()) {
            logger.error("❌ PAYHERE_MERCHANT_ID is not set — payment gateway will not function");
        } else {
            logger.debug("PayHere merchant ID configured: {}", merchantId);
        }
    }
}
