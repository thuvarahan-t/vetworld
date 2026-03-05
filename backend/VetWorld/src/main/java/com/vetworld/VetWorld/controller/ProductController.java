package com.vetworld.VetWorld.controller;

import com.vetworld.VetWorld.dto.ProductDto;
import com.vetworld.VetWorld.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAll(
            @RequestParam(required = false) Boolean topSelling,
            @RequestParam(required = false) Boolean recent) {
        if (Boolean.TRUE.equals(topSelling))
            return ResponseEntity.ok(productService.getTopSelling());
        if (Boolean.TRUE.equals(recent))
            return ResponseEntity.ok(productService.getRecentProducts());
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }
}
