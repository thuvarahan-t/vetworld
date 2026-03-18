package com.vetworld.VetWorld.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "product_types")
@Data
@NoArgsConstructor
public class ProductType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "type_name", nullable = false)
    private String typeName;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "project_key", length = 120)
    private String projectKey;

    @Column(name = "is_sold_out", nullable = false)
    private boolean soldOut = false;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
