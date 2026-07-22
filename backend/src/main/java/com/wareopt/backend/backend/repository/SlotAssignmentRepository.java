package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.SlotAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.wareopt.backend.backend.entity.OrderStatus;

@Repository
public interface SlotAssignmentRepository extends JpaRepository<SlotAssignment, Long> {
    
    @Transactional
    void deleteByOrderId(Long orderId);

    @Transactional
    void deleteBySlotId(Long slotId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SlotAssignment sa WHERE sa.order.status = :status")
    void deleteByOrderStatus(@Param("status") OrderStatus status);
}
