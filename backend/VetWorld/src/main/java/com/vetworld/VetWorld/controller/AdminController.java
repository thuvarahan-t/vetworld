package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.*;
import com.vetworld.VetWorld.repository.*;
import com.vetworld.VetWorld.security.JwtUtil;
import com.vetworld.VetWorld.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final JwtUtil jwtUtil;
    private final CategoryService categoryService;
    private final ProductService productService;
    private final BannerService bannerService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BannerRepository bannerRepository;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:vetworld2024}")
    private String adminPassword;

    // ── Auth ──────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest request) {
        if (adminUsername.equals(request.getUsername()) && adminPassword.equals(request.getPassword())) {
            String token = jwtUtil.generateToken(request.getUsername());
            return ResponseEntity.ok(Map.of("token", token));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    // ── Stats ──────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        AdminStatsDto stats = new AdminStatsDto();
        stats.setTotalProducts(productRepository.count());
        stats.setTotalCategories(categoryRepository.count());
        stats.setTotalBanners(bannerRepository.count());
        stats.setTopSellingCount(productRepository.findByIsTopSellingTrue().size());
        return ResponseEntity.ok(stats);
    }

    // ── Categories ─────────────────────────────────────────────

    @PostMapping("/categories")
    public ResponseEntity<CategoryDto> createCategory(@RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ── Products ───────────────────────────────────────────────

    @PostMapping("/products")
    public ResponseEntity<ProductDto> createProduct(@RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/products/{id}/top-selling")
    public ResponseEntity<ProductDto> toggleTopSelling(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleTopSelling(id));
    }

    // ── Banners ────────────────────────────────────────────────

    @PostMapping("/banners")
    public ResponseEntity<BannerDto> createBanner(@RequestBody BannerRequest request) {
        return ResponseEntity.ok(bannerService.createBanner(request));
    }

    @DeleteMapping("/banners/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}
