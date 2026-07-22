package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.DeliveryOptimizationResponse;
import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.OrderStatus;
import com.wareopt.backend.backend.entity.DeliverySlot;
import com.wareopt.backend.backend.entity.SlotAssignment;
import com.wareopt.backend.backend.optimization.DeliverySlotOptimizer;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.DeliverySlotRepository;
import com.wareopt.backend.backend.repository.SlotAssignmentRepository;
import com.wareopt.backend.backend.api.OptimizationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import com.wareopt.backend.backend.entity.DeliveryOrderItem;
import com.wareopt.backend.backend.repository.InventoryItemRepository;

@RestController
@RequestMapping("/api")
public class DeliveryController {

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    @Autowired
    private DeliverySlotRepository deliverySlotRepository;

    @Autowired
    private SlotAssignmentRepository slotAssignmentRepository;

    @Autowired
    private OptimizationService optimizationService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private InventoryItemRepository InventoryItemRepository;

    // ----- ORDERS -----

    @GetMapping("/delivery-orders")
    public List<DeliveryOrder> getAllOrders() {
        return deliveryOrderRepository.findAll();
    }

    @PostMapping("/delivery-orders")
    public ResponseEntity<DeliveryOrder> createOrder(@Valid @RequestBody DeliveryOrder order) {
        order.setId(null);
        if (order.getItems() != null) {
            for (DeliveryOrderItem item : order.getItems()) {
                item.setOrder(order);
                if (item.getInventoryItem() != null && item.getInventoryItem().getId() != null) {
                    item.setInventoryItem(InventoryItemRepository.findById(item.getInventoryItem().getId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found")));
                }
            }
        }
        DeliveryOrder savedOrder = deliveryOrderRepository.save(order);
        return new ResponseEntity<>(savedOrder, HttpStatus.CREATED);
    }

    @PutMapping("/delivery-orders/{id}")
    public ResponseEntity<DeliveryOrder> updateOrder(@PathVariable Long id, @Valid @RequestBody DeliveryOrder orderDetails) {
        DeliveryOrder order = deliveryOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        order.setDestinationLat(orderDetails.getDestinationLat());
        order.setDestinationLng(orderDetails.getDestinationLng());
        order.setDeadline(orderDetails.getDeadline());
        order.setWeightKg(orderDetails.getWeightKg());
        order.setPriority(orderDetails.getPriority());

        if (orderDetails.getItems() != null) {
            for (DeliveryOrderItem item : orderDetails.getItems()) {
                item.setOrder(order);
                if (item.getInventoryItem() != null && item.getInventoryItem().getId() != null) {
                    item.setInventoryItem(InventoryItemRepository.findById(item.getInventoryItem().getId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found")));
                }
            }
            order.getItems().clear();
            order.getItems().addAll(orderDetails.getItems());
        }

        DeliveryOrder updatedOrder = deliveryOrderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }

    @DeleteMapping("/delivery-orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        if (!deliveryOrderRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        deliveryOrderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ----- FULFILLMENT -----
    
    @PostMapping("/delivery-orders/{id}/fulfill")
    public ResponseEntity<DeliveryOrder> fulfillOrder(@PathVariable Long id) {
        try {
            DeliveryOrder fulfilledOrder = deliveryService.fulfillOrder(id);
            return ResponseEntity.ok(fulfilledOrder);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order was modified concurrently. Please try again.");
        }
    }

    // ----- SLOTS -----

    @GetMapping("/delivery-slots")
    public List<DeliverySlot> getAllSlots() {
        return deliverySlotRepository.findAll();
    }

    @PostMapping("/delivery-slots")
    public ResponseEntity<DeliverySlot> createSlot(@Valid @RequestBody DeliverySlot slot) {
        if (slot.getEndTime().equals(slot.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time cannot be the same as start time");
        }
        slot.setId(null);
        DeliverySlot savedSlot = deliverySlotRepository.save(slot);
        return new ResponseEntity<>(savedSlot, HttpStatus.CREATED);
    }

    @PutMapping("/delivery-slots/{id}")
    public ResponseEntity<DeliverySlot> updateSlot(@PathVariable Long id, @Valid @RequestBody DeliverySlot slotDetails) {
        DeliverySlot slot = deliverySlotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Slot not found"));

        if (slotDetails.getEndTime().equals(slotDetails.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time cannot be the same as start time");
        }

        slot.setStartTime(slotDetails.getStartTime());
        slot.setEndTime(slotDetails.getEndTime());
        slot.setMaxCapacityKg(slotDetails.getMaxCapacityKg());
        slot.setVehicleId(slotDetails.getVehicleId());

        DeliverySlot updatedSlot = deliverySlotRepository.save(slot);
        return ResponseEntity.ok(updatedSlot);
    }

    @DeleteMapping("/delivery-slots/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        if (!deliverySlotRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Slot not found");
        }
        deliverySlotRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ----- ASSIGNMENTS & OPTIMIZE -----

    @GetMapping("/delivery-slots/{id}/assignments")
    public List<SlotAssignment> getAssignmentsForSlot(@PathVariable Long id) {
        return slotAssignmentRepository.findAll().stream()
                .filter(a -> a.getSlot().getId().equals(id))
                .collect(Collectors.toList());
    }

    @PostMapping("/optimize/delivery")
    public DeliveryOptimizationResponse optimizeDelivery() {
        return optimizationService.optimizeDelivery();
    }
}
