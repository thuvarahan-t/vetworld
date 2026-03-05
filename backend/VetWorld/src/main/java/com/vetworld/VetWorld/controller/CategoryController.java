package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.*;
import com.vetworld.VetWorld.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAll() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @GetMapping("/{id}/products")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getByCategory(id));
    }
}
