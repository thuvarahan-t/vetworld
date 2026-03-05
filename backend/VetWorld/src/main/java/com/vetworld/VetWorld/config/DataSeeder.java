package com.vetworld.VetWorld.config;

import com.vetworld.VetWorld.model.Banner;
import com.vetworld.VetWorld.model.Category;
import com.vetworld.VetWorld.model.Product;
import com.vetworld.VetWorld.model.ProductType;
import com.vetworld.VetWorld.model.Role;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.BannerRepository;
import com.vetworld.VetWorld.repository.CategoryRepository;
import com.vetworld.VetWorld.repository.ProductRepository;
import com.vetworld.VetWorld.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

        private final CategoryRepository categoryRepository;
        private final ProductRepository productRepository;
        private final BannerRepository bannerRepository;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        @Bean
        public CommandLineRunner loadData() {
                return args -> {
                        // ---- Seed Admin User ----
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
                        if (categoryRepository.count() == 0) {
                                // Categories
                                Category labTools = new Category();
                                labTools.setName("Lab Equipment");
                                labTools.setImageUrl(
                                                "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800");
                                categoryRepository.save(labTools);

                                Category surgical = new Category();
                                surgical.setName("Surgical Instruments");
                                surgical.setImageUrl(
                                                "https://images.unsplash.com/photo-1551076805-e1869043e560?auto=format&fit=crop&q=80&w=800");
                                categoryRepository.save(surgical);

                                Category diagnostics = new Category();
                                diagnostics.setName("Diagnostics");
                                diagnostics.setImageUrl(
                                                "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800");
                                categoryRepository.save(diagnostics);

                                // Products
                                Product microscope = new Product();
                                microscope.setName("Binocular Compound Microscope");
                                microscope.setDescription(
                                                "High-quality binocular microscope for veterinary diagnostics and lab use. Features 40x-1000x magnification.");
                                microscope.setImageUrl(
                                                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800");
                                microscope.setCategory(labTools);
                                microscope.setTopSelling(true);

                                ProductType type1 = new ProductType();
                                type1.setTypeName("Standard Edition");
                                type1.setPrice(new BigDecimal("12500.00"));
                                type1.setProduct(microscope);

                                ProductType type2 = new ProductType();
                                type2.setTypeName("Pro Edition (LED)");
                                type2.setPrice(new BigDecimal("18000.00"));
                                type2.setProduct(microscope);
                                microscope.setTypes(List.of(type1, type2));

                                productRepository.save(microscope);

                                Product testTubes = new Product();
                                testTubes.setName("Borosilicate Glass Test Tubes");
                                testTubes.setDescription(
                                                "Heat resistant borosilicate glass test tubes for sample collection and analysis.");
                                testTubes.setImageUrl(
                                                "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800");
                                testTubes.setCategory(labTools);
                                testTubes.setTopSelling(true);

                                ProductType tube1 = new ProductType();
                                tube1.setTypeName("Pack of 50 (10ml)");
                                tube1.setPrice(new BigDecimal("450.00"));
                                tube1.setProduct(testTubes);
                                testTubes.setTypes(List.of(tube1));

                                productRepository.save(testTubes);

                                Product scalpel = new Product();
                                scalpel.setName("Surgical Scalpel Handle");
                                scalpel.setDescription(
                                                "Stainless steel scalpel handle size 3 and 4, rust-resistant and autoclavable.");
                                scalpel.setImageUrl(
                                                "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800");
                                scalpel.setCategory(surgical);
                                scalpel.setTopSelling(false);

                                ProductType sc1 = new ProductType();
                                sc1.setTypeName("Size 3");
                                sc1.setPrice(new BigDecimal("200.00"));
                                sc1.setProduct(scalpel);
                                scalpel.setTypes(List.of(sc1));

                                productRepository.save(scalpel);

                                Product steth = new Product();
                                steth.setName("Veterinary Stethoscope");
                                steth.setDescription(
                                                "Dual-head acoustic stethoscope designed specifically for animal care and veterinary practitioners.");
                                steth.setImageUrl(
                                                "https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=800");
                                steth.setCategory(diagnostics);
                                steth.setTopSelling(true);

                                ProductType st1 = new ProductType();
                                st1.setTypeName("Classic Black");
                                st1.setPrice(new BigDecimal("1500.00"));
                                st1.setProduct(steth);
                                steth.setTypes(List.of(st1));

                                productRepository.save(steth);
                        }

                        if (bannerRepository.count() == 0) {
                                Banner b1 = new Banner();
                                b1.setImageUrl(
                                                "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1600&h=400");
                                b1.setRedirectLink("/category/all");
                                bannerRepository.save(b1);

                                Banner b2 = new Banner();
                                b2.setImageUrl(
                                                "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=1600&h=400");
                                b2.setRedirectLink("/category/1");
                                bannerRepository.save(b2);
                        }
                };
        }
}
