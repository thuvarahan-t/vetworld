package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.*;
import com.vetworld.VetWorld.model.Role;
import com.vetworld.VetWorld.model.User;
import com.vetworld.VetWorld.repository.*;
import com.vetworld.VetWorld.security.JwtUtil;
import com.vetworld.VetWorld.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    private final UserRepository userRepository;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:vetworld2024}")
    private String adminPassword;

    // ── Auth ──────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request) {
        if (adminUsername.equals(request.getUsername()) && adminPassword.equals(request.getPassword())) {
            String token = jwtUtil.generateToken(request.getUsername(), "ADMIN");
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
        stats.setTotalUsers(userRepository.count());
        stats.setTopSellingCount(productRepository.findByTopSellingTrue().size());
        return ResponseEntity.ok(stats);
    }

    // ── Categories ─────────────────────────────────────────────

    @PostMapping("/categories")
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryDto> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ── Products ───────────────────────────────────────────────

    @PostMapping("/products")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
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

    @PutMapping("/products/{id}/sold-out")
    public ResponseEntity<ProductDto> toggleSoldOut(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleSoldOut(id));
    }

    @PutMapping("/products/{productId}/types/{typeId}/sold-out")
    public ResponseEntity<ProductDto> toggleTypeSoldOut(@PathVariable Long productId, @PathVariable Long typeId) {
        return ResponseEntity.ok(productService.toggleTypeSoldOut(productId, typeId));
    }

    // ── Banners ────────────────────────────────────────────────

    @PostMapping("/banners")
    public ResponseEntity<BannerDto> createBanner(@Valid @RequestBody BannerRequest request) {
        return ResponseEntity.ok(bannerService.createBanner(request));
    }

    @PutMapping("/banners/{id}")
    public ResponseEntity<BannerDto> updateBanner(@PathVariable Long id, @Valid @RequestBody BannerRequest request) {
        return ResponseEntity.ok(bannerService.updateBanner(id, request));
    }

    @DeleteMapping("/banners/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    // ── Users ──────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id, @Valid @RequestBody UserRoleUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            Role newRole = Role.valueOf(request.getRole().toUpperCase());
            user.setRole(newRole);
            User updated = userRepository.save(user);
            return ResponseEntity.ok(UserDto.fromEntity(updated));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + request.getRole());
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
