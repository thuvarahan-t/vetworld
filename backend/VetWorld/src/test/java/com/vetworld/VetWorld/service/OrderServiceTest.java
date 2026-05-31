package com.vetworld.VetWorld.service;

import com.vetworld.VetWorld.dto.OrderItemRequest;
import com.vetworld.VetWorld.dto.PlaceOrderRequest;
import com.vetworld.VetWorld.model.*;
import com.vetworld.VetWorld.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.hikari.maximum-pool-size=2"
})
public class OrderServiceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("vetworld_test")
            .withUsername("test_user")
            .withPassword("test_password");

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductTypeRepository productTypeRepository;

    private User testUser;
    private ProductType testProductType;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        productTypeRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        testUser = User.builder()
                .email("buyer@example.com")
                .password("hashed_password")
                .name("Test Buyer")
                .phone("+94771234567")
                .address("123 Main St")
                .build();
        testUser = userRepository.save(testUser);

        Category category = Category.builder()
                .name("Test Category")
                .build();
        category = categoryRepository.save(category);

        Product product = Product.builder()
                .name("Test Product")
                .description("A test product")
                .category(category)
                .build();
        product = productRepository.save(product);

        testProductType = ProductType.builder()
                .product(product)
                .typeName("Standard")
                .price(new BigDecimal("500.00"))
                .soldOut(false)
                .build();
        testProductType = productTypeRepository.save(testProductType);
    }

    @Test
    void testCreatePendingOrder_WithValidItems_Success() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(testProductType.getId());
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(2);
        req.setItems(List.of(item));

        Order order = orderService.createPendingOrder(testUser, req);

        assertNotNull(order.getId());
        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());
        assertEquals(1, order.getItems().size());
        assertEquals(new BigDecimal("1000.00"), order.getTotalAmount());
    }

    @Test
    void testCreatePendingOrder_ZeroItems_ThrowsException() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");
        req.setItems(new ArrayList<>());

        assertThrows(RuntimeException.class, () ->
            orderService.createPendingOrder(testUser, req),
            "Order must contain at least one item."
        );
    }

    @Test
    void testCreatePendingOrder_TooManyItems_ThrowsException() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        List<OrderItemRequest> items = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            OrderItemRequest item = new OrderItemRequest();
            item.setProductId(testProductType.getProduct().getId());
            item.setTypeId(testProductType.getId());
            item.setProductName("Test Product " + i);
            item.setTypeName("Standard");
            item.setQuantity(1);
            items.add(item);
        }
        req.setItems(items);

        assertThrows(RuntimeException.class, () ->
            orderService.createPendingOrder(testUser, req),
            "Too many items in one order."
        );
    }

    @Test
    void testCreatePendingOrder_InvalidQuantity_LessThanOne_ThrowsException() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(testProductType.getId());
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(0);
        req.setItems(List.of(item));

        assertThrows(RuntimeException.class, () ->
            orderService.createPendingOrder(testUser, req),
            "Invalid quantity for item"
        );
    }

    @Test
    void testCreatePendingOrder_InvalidQuantity_MoreThan100_ThrowsException() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(testProductType.getId());
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(101);
        req.setItems(List.of(item));

        assertThrows(RuntimeException.class, () ->
            orderService.createPendingOrder(testUser, req),
            "Invalid quantity for item"
        );
    }

    @Test
    void testCreatePendingOrder_PriceResolvedFromDatabase() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(testProductType.getId());
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(3);
        // Client sends wrong price — should be ignored
        item.setUnitPrice(new BigDecimal("9999.99"));
        req.setItems(List.of(item));

        Order order = orderService.createPendingOrder(testUser, req);

        // Price from database (500.00) should be used, not client's 9999.99
        assertEquals(new BigDecimal("1500.00"), order.getTotalAmount());
        assertEquals(new BigDecimal("500.00"), order.getItems().get(0).getUnitPrice());
    }

    @Test
    void testCreatePendingOrder_SoldOutItem_ThrowsException() {
        testProductType.setSoldOut(true);
        productTypeRepository.save(testProductType);

        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(testProductType.getId());
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(1);
        req.setItems(List.of(item));

        assertThrows(RuntimeException.class, () ->
            orderService.createPendingOrder(testUser, req),
            "Item is sold out"
        );
    }

    @Test
    void testCreatePendingOrder_MultiplePriceCalculation() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        // Item 1: 2 units × 500 = 1000
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(testProductType.getProduct().getId());
        item1.setTypeId(testProductType.getId());
        item1.setProductName("Test Product");
        item1.setTypeName("Standard");
        item1.setQuantity(2);
        req.setItems(new ArrayList<>(List.of(item1)));

        // Create another product type with different price
        ProductType productType2 = ProductType.builder()
                .product(testProductType.getProduct())
                .typeName("Premium")
                .price(new BigDecimal("1000.00"))
                .soldOut(false)
                .build();
        productType2 = productTypeRepository.save(productType2);

        // Item 2: 3 units × 1000 = 3000
        OrderItemRequest item2 = new OrderItemRequest();
        item2.setProductId(testProductType.getProduct().getId());
        item2.setTypeId(productType2.getId());
        item2.setProductName("Test Product");
        item2.setTypeName("Premium");
        item2.setQuantity(3);
        req.getItems().add(item2);

        Order order = orderService.createPendingOrder(testUser, req);

        // Total: 1000 + 3000 = 4000
        assertEquals(new BigDecimal("4000.00"), order.getTotalAmount());
        assertEquals(2, order.getItems().size());
    }

    @Test
    void testCreatePendingOrder_NonExistentProductType_ThrowsException() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(99999L); // Non-existent
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(1);
        req.setItems(List.of(item));

        assertThrows(RuntimeException.class, () ->
            orderService.createPendingOrder(testUser, req),
            "Product type not found"
        );
    }

    @Test
    void testCreatePendingOrder_GeneratesUniqueOrderNumber() {
        PlaceOrderRequest req = new PlaceOrderRequest();
        req.setCustomerName("John Doe");
        req.setCustomerPhone("+94771234567");
        req.setDeliveryAddress("456 Oak St");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(testProductType.getProduct().getId());
        item.setTypeId(testProductType.getId());
        item.setProductName("Test Product");
        item.setTypeName("Standard");
        item.setQuantity(1);
        req.setItems(List.of(item));

        Order order1 = orderService.createPendingOrder(testUser, req);
        Order order2 = orderService.createPendingOrder(testUser, req);

        assertNotEquals(order1.getOrderNumber(), order2.getOrderNumber());
        assertTrue(order1.getOrderNumber().startsWith("VW-"));
        assertTrue(order2.getOrderNumber().startsWith("VW-"));
    }
}
