package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByInventoryItem_IdOrderByTimestampDesc(Long inventoryItemId);
}
