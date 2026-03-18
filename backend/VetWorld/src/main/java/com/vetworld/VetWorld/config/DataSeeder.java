package com.vetworld.VetWorld.config;

import com.vetworld.VetWorld.model.Role;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JdbcTemplate jdbcTemplate;

        @Bean
        public CommandLineRunner loadData() {
                return args -> {

                        // Ensure schema is compatible with latest product sold-out flags.
                        jdbcTemplate.execute(
                                "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT FALSE"
                        );
                        jdbcTemplate.execute(
                                "ALTER TABLE product_types ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT FALSE"
                        );

                        // ---- Remove sample data (safe: targets only known seeded names) ----
                        jdbcTemplate.update(
                                "DELETE FROM product_types WHERE product_id IN (" +
                                "  SELECT id FROM products WHERE name IN (" +
                                "    'Binocular Compound Microscope'," +
                                "    'Borosilicate Glass Test Tubes'," +
                                "    'Surgical Scalpel Handle'," +
                                "    'Veterinary Stethoscope'" +
                                "  )" +
                                ")"
                        );
                        jdbcTemplate.update(
                                "DELETE FROM products WHERE name IN (" +
                                "  'Binocular Compound Microscope'," +
                                "  'Borosilicate Glass Test Tubes'," +
                                "  'Surgical Scalpel Handle'," +
                                "  'Veterinary Stethoscope'" +
                                ")"
                        );
                        jdbcTemplate.update(
                                "DELETE FROM categories WHERE name IN (" +
                                "  'Lab Equipment', 'Surgical Instruments', 'Diagnostics'" +
                                ")"
                        );
                        jdbcTemplate.update(
                                "DELETE FROM banners WHERE image_url LIKE '%unsplash%'"
                        );
                        int deletedUsers = jdbcTemplate.update(
                                "DELETE FROM users WHERE role = 'USER'"
                        );
                        if (deletedUsers > 0) {
                                System.out.println("🗑️  Removed " + deletedUsers + " sample user(s).");
                        }

                        // ---- Seed Admin User only ----
                        if (!userRepository.existsByEmail("adminvetworld@gmail.com")) {
                                User admin = User.builder()
                                                .name("Admin")
                                                .email("adminvetworld@gmail.com")
                                                .password(passwordEncoder.encode("admin@123"))
                                                .role(Role.ADMIN)
                                                .build();
                                userRepository.save(admin);
                                System.out.println("✅ Admin user seeded.");
                        }
                };
        }
}
