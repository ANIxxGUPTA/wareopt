package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    List<DeliveryOrder> findByDeadlineBefore(LocalDateTime deadline);
}
