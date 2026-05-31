package com.vetworld.VetWorld.config;

import com.vetworld.VetWorld.model.Role;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        @Value("${APP_ADMIN_EMAIL}")
        private String adminEmail;

        @Value("${APP_ADMIN_NAME:Admin}")
        private String adminName;

        @Value("${APP_ADMIN_PASSWORD}")
        private String adminPassword;

        @Bean
        public CommandLineRunner loadData() {
                return args -> {
                        // Seed admin user only (schema is managed by Flyway)
                        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
                                throw new IllegalStateException(
                                                "[FATAL] APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD must be configured to seed the admin user.");
                        }

                        if (!userRepository.existsByEmail(adminEmail)) {
                                User admin = User.builder()
                                                .name(adminName)
                                                .email(adminEmail)
                                                .password(passwordEncoder.encode(adminPassword))
                                                .role(Role.ADMIN)
                                                .build();
                                userRepository.save(admin);
                                System.out.println("✅ Admin user seeded.");
                        }
                };
        }
}
