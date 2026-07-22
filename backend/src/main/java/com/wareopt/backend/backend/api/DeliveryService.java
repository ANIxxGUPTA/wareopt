package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliveryOrderItem;
import com.wareopt.backend.backend.entity.InventoryItem;
import com.wareopt.backend.backend.entity.OrderStatus;
import com.wareopt.backend.backend.entity.StockMovement;
import com.wareopt.backend.backend.entity.MovementReason;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.InventoryItemRepository;
import com.wareopt.backend.backend.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    @Autowired
    private InventoryItemRepository InventoryItemRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Transactional
    public DeliveryOrder fulfillOrder(Long orderId) {
        DeliveryOrder order = deliveryOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.FULFILLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is already fulfilled");
        }

        // Deduct inventory
        for (DeliveryOrderItem item : order.getItems()) {
            InventoryItem inventoryItem = item.getInventoryItem();
            int newQuantity = inventoryItem.getQuantityOnHand() - item.getQuantity();
            if (newQuantity < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Insufficient stock for inventory item ID " + inventoryItem.getId());
            }
            inventoryItem.setQuantityOnHand(newQuantity);
            InventoryItemRepository.save(inventoryItem);

            StockMovement movement = new StockMovement();
            movement.setInventoryItemId(inventoryItem.getId());
            movement.setChangeAmount(-item.getQuantity());
            movement.setReason(MovementReason.ORDER_FULFILLMENT);
            movement.setNote("Order ID " + order.getId() + " fulfilled");
            stockMovementRepository.save(movement);
        }

        order.setStatus(OrderStatus.FULFILLED);
        // The @Version field on DeliveryOrder will automatically handle optimistic locking.
        // If a concurrent thread tries to fulfill the same order at the exact same time, 
        // the version increment will fail on one of the transactions, throwing an ObjectOptimisticLockingFailureException.
        return deliveryOrderRepository.save(order);
    }
}
