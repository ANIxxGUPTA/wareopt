package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.DeliveryOptimizationResponse;
import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliverySlot;
import com.wareopt.backend.backend.entity.SlotAssignment;
import com.wareopt.backend.backend.optimization.DeliverySlotOptimizer;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.DeliverySlotRepository;
import com.wareopt.backend.backend.repository.SlotAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/delivery-orders")
    public List<DeliveryOrder> getAllOrders() {
        return deliveryOrderRepository.findAll();
    }

    @GetMapping("/delivery-slots")
    public List<DeliverySlot> getAllSlots() {
        return deliverySlotRepository.findAll();
    }

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
