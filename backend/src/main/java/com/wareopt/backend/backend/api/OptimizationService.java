package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.DeliveryOptimizationResponse;
import com.wareopt.backend.backend.api.dto.ShiftOptimizationResponse;
import com.wareopt.backend.backend.entity.*;
import com.wareopt.backend.backend.exception.OptimizationInProgressException;
import com.wareopt.backend.backend.optimization.DeliverySlotOptimizer;
import com.wareopt.backend.backend.optimization.ShiftOptimizer;
import com.wareopt.backend.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OptimizationService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private ShiftOptimizer shiftOptimizer;

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    @Autowired
    private DeliverySlotRepository deliverySlotRepository;

    @Autowired
    private SlotAssignmentRepository slotAssignmentRepository;

    @Autowired
    private DeliverySlotOptimizer deliverySlotOptimizer;

    private static final long SHIFT_OPTIMIZATION_LOCK_ID = 1001L;
    private static final long DELIVERY_OPTIMIZATION_LOCK_ID = 1002L;

    private boolean tryAcquireLock(long lockId) {
        Boolean acquired = (Boolean) entityManager
                .createNativeQuery("SELECT pg_try_advisory_xact_lock(:lockId)")
                .setParameter("lockId", lockId)
                .getSingleResult();
        return Boolean.TRUE.equals(acquired);
    }

    @Transactional
    public ShiftOptimizationResponse optimizeShifts() {
        if (!tryAcquireLock(SHIFT_OPTIMIZATION_LOCK_ID)) {
            throw new OptimizationInProgressException("Shift optimization is already in progress.");
        }

        List<Worker> workers = workerRepository.findAll();
        List<Shift> shifts = shiftRepository.findAll();

        long startTime = System.currentTimeMillis();
        List<ShiftAssignment> assignments = shiftOptimizer.optimize(workers, shifts);
        long solveTime = System.currentTimeMillis() - startTime;

        shiftAssignmentRepository.deleteAll();
        shiftAssignmentRepository.saveAll(assignments);

        BigDecimal totalCost = BigDecimal.ZERO;
        for (ShiftAssignment assignment : assignments) {
            BigDecimal hourlyRate = assignment.getWorker().getHourlyCost() == null ? BigDecimal.ZERO : assignment.getWorker().getHourlyCost();
            long hours = Duration.between(assignment.getShift().getStartTime(), assignment.getShift().getEndTime()).toHours();
            if (hours <= 0) hours += 24; // Handled overnight shifts
            totalCost = totalCost.add(hourlyRate.multiply(BigDecimal.valueOf(hours)));
        }

        return new ShiftOptimizationResponse(assignments, totalCost, solveTime);
    }

    @Transactional
    public DeliveryOptimizationResponse optimizeDelivery() {
        if (!tryAcquireLock(DELIVERY_OPTIMIZATION_LOCK_ID)) {
            throw new OptimizationInProgressException("Delivery optimization is already in progress.");
        }

        List<DeliveryOrder> allOrders = deliveryOrderRepository.findAll();
        List<DeliveryOrder> pendingOrders = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING)
                .collect(Collectors.toList());

        List<DeliverySlot> slots = deliverySlotRepository.findAll();

        List<SlotAssignment> fulfilledAssignments = slotAssignmentRepository.findAll().stream()
                .filter(a -> a.getOrder().getStatus() == OrderStatus.FULFILLED)
                .collect(Collectors.toList());

        java.util.Map<Long, Long> fulfilledWeightBySlot = new java.util.HashMap<>();
        for (SlotAssignment a : fulfilledAssignments) {
            fulfilledWeightBySlot.merge(a.getSlot().getId(), 
                (long)(a.getOrder().getWeightKg().doubleValue() * 1000), Long::sum);
        }

        long startTime = System.currentTimeMillis();
        List<SlotAssignment> assignments = deliverySlotOptimizer.optimize(pendingOrders, slots, fulfilledWeightBySlot);
        long solveTime = System.currentTimeMillis() - startTime;

        slotAssignmentRepository.deleteByOrderStatus(OrderStatus.PENDING);
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
