package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.SlotAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.transaction.annotation.Transactional;

@Repository
public interface SlotAssignmentRepository extends JpaRepository<SlotAssignment, Long> {
    
    @Transactional
    void deleteByOrderId(Long orderId);

    @Transactional
    void deleteBySlotId(Long slotId);
}
