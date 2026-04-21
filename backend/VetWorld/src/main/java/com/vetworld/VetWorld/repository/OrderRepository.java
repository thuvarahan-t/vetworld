package com.vetworld.VetWorld.repository;

import com.vetworld.VetWorld.model.Order;
import com.vetworld.VetWorld.model.OrderStatus;
import com.vetworld.VetWorld.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByOrderNumber(String orderNumber);
    long countByStatus(OrderStatus status);
    long countByStatusIn(List<OrderStatus> statuses);
}
