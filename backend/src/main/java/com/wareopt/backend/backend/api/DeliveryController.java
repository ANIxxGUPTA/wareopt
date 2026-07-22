package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.DeliveryOptimizationResponse;
import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliverySlot;
import com.wareopt.backend.backend.entity.SlotAssignment;
import com.wareopt.backend.backend.optimization.DeliverySlotOptimizer;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.DeliverySlotRepository;
import com.wareopt.backend.backend.repository.SlotAssignmentRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

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
    private DeliverySlotOptimizer deliverySlotOptimizer;

    // ----- ORDERS -----

    @GetMapping("/delivery-orders")
    public List<DeliveryOrder> getAllOrders() {
        return deliveryOrderRepository.findAll();
    }

    @PostMapping("/delivery-orders")
    public ResponseEntity<DeliveryOrder> createOrder(@Valid @RequestBody DeliveryOrder order) {
        order.setId(null);
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

        DeliveryOrder updatedOrder = deliveryOrderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }

    @DeleteMapping("/delivery-orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        if (!deliveryOrderRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        slotAssignmentRepository.deleteByOrderId(id);
        deliveryOrderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ----- SLOTS -----

    @GetMapping("/delivery-slots")
    public List<DeliverySlot> getAllSlots() {
        return deliverySlotRepository.findAll();
    }

    @PostMapping("/delivery-slots")
    public ResponseEntity<DeliverySlot> createSlot(@Valid @RequestBody DeliverySlot slot) {
        if (!slot.getEndTime().isAfter(slot.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        slot.setId(null);
        DeliverySlot savedSlot = deliverySlotRepository.save(slot);
        return new ResponseEntity<>(savedSlot, HttpStatus.CREATED);
    }

    @PutMapping("/delivery-slots/{id}")
    public ResponseEntity<DeliverySlot> updateSlot(@PathVariable Long id, @Valid @RequestBody DeliverySlot slotDetails) {
        DeliverySlot slot = deliverySlotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Slot not found"));

        if (!slotDetails.getEndTime().isAfter(slotDetails.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
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
        slotAssignmentRepository.deleteBySlotId(id);
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
        List<DeliveryOrder> orders = deliveryOrderRepository.findAll();
        List<DeliverySlot> slots = deliverySlotRepository.findAll();

        long startTime = System.currentTimeMillis();
        List<SlotAssignment> assignments = deliverySlotOptimizer.optimize(orders, slots);
        long solveTime = System.currentTimeMillis() - startTime;

        slotAssignmentRepository.deleteAll();
        slotAssignmentRepository.saveAll(assignments);

        BigDecimal totalDistance = BigDecimal.ZERO;
        for (SlotAssignment assignment : assignments) {
            if (assignment.getEstimatedDistanceKm() != null) {
                totalDistance = totalDistance.add(assignment.getEstimatedDistanceKm());
            }
        }

        return new DeliveryOptimizationResponse(assignments, totalDistance, solveTime);
    }
}
