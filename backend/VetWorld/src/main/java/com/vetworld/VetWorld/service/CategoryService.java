package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.dto.CategoryDto;
import com.vetworld.VetWorld.dto.CategoryRequest;
import com.vetworld.VetWorld.model.Category;
import com.vetworld.VetWorld.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
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
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category with name '" + request.getName() + "' already exists");
        }
        Category category = new Category();
        category.setName(request.getName());
        category.setImageUrl(request.getImageUrl());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Only check name existence if name is changed
        if (!category.getName().equals(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category with name '" + request.getName() + "' already exists");
        }

        category.setName(request.getName());
        category.setImageUrl(request.getImageUrl());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
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
