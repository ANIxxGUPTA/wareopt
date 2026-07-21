package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.DeliverySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliverySlotRepository extends JpaRepository<DeliverySlot, Long> {
}
