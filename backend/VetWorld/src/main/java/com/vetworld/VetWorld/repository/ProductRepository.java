package com.vetworld.VetWorld.repository;

import com.vetworld.VetWorld.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByTopSellingTrue();

    List<Product> findTop8ByOrderByCreatedAtDesc();

    List<Product> findByCategoryIdAndNameContainingIgnoreCase(Long categoryId, String name);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Product> searchProducts(@org.springframework.data.repository.query.Param("keyword") String keyword);
}
