package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.dto.*;
import com.vetworld.VetWorld.model.*;
import com.vetworld.VetWorld.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getTopSelling() {
        return productRepository.findByIsTopSellingTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductDto> getRecentProducts() {
        return productRepository.findTop8ByOrderByCreatedAtDesc().stream().map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> getByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProductDto getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return toDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);
        product.setTopSelling(request.isTopSelling());

        if (request.getTypes() != null) {
            List<ProductType> types = request.getTypes().stream().map(t -> {
                ProductType pt = new ProductType();
                pt.setTypeName(t.getTypeName());
                pt.setPrice(t.getPrice());
                pt.setProduct(product);
                return pt;
            }).collect(Collectors.toList());
            product.setTypes(types);
        }

        return toDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        if (request.getImageUrl() != null)
            product.setImageUrl(request.getImageUrl());
        product.setCategory(category);
        product.setTopSelling(request.isTopSelling());

        if (request.getTypes() != null) {
            product.getTypes().clear();
            request.getTypes().forEach(t -> {
                ProductType pt = new ProductType();
                pt.setTypeName(t.getTypeName());
                pt.setPrice(t.getPrice());
                pt.setProduct(product);
                product.getTypes().add(pt);
            });
        }

        return toDto(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Transactional
    public ProductDto toggleTopSelling(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setTopSelling(!product.isTopSelling());
        return toDto(productRepository.save(product));
    }

    public ProductDto toDto(Product p) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setImageUrl(p.getImageUrl());
        dto.setTopSelling(p.isTopSelling());
        dto.setCreatedAt(p.getCreatedAt());

        if (p.getCategory() != null) {
            CategoryDto catDto = new CategoryDto();
            catDto.setId(p.getCategory().getId());
            catDto.setName(p.getCategory().getName());
            catDto.setImageUrl(p.getCategory().getImageUrl());
            dto.setCategory(catDto);
        }

        if (p.getTypes() != null) {
            dto.setTypes(p.getTypes().stream().map(t -> {
                ProductTypeDto td = new ProductTypeDto();
                td.setId(t.getId());
                td.setTypeName(t.getTypeName());
                td.setPrice(t.getPrice());
                return td;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
