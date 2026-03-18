package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.dto.CategoryDto;
import com.vetworld.VetWorld.dto.CategoryRequest;
import com.vetworld.VetWorld.model.Category;
import com.vetworld.VetWorld.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public CategoryDto getById(Long id) {
        return categoryRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    @Transactional
    public CategoryDto createCategory(CategoryRequest request) {
        String normalizedName = request.getName().trim();

        if (categoryRepository.existsByName(normalizedName)) {
            throw new RuntimeException("Category with name '" + normalizedName + "' already exists");
        }
        Category category = new Category();
        category.setName(normalizedName);
        category.setImageUrl(request.getImageUrl());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        String normalizedName = request.getName().trim();

        // Only check name existence if name is changed
        if (!category.getName().equals(normalizedName) && categoryRepository.existsByName(normalizedName)) {
            throw new RuntimeException("Category with name '" + normalizedName + "' already exists");
        }

        category.setName(normalizedName);
        category.setImageUrl(request.getImageUrl());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with id: " + id);
        }
        try {
            categoryRepository.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException("Cannot delete category with existing products. Remove products first.");
        }
    }

    public CategoryDto toDto(Category c) {
        CategoryDto dto = new CategoryDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setImageUrl(c.getImageUrl());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
