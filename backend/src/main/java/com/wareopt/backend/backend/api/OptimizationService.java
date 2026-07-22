package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.ShiftOptimizationResponse;
import com.wareopt.backend.backend.entity.*;
import com.wareopt.backend.backend.exception.OptimizationInProgressException;
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

    private static final long SHIFT_OPTIMIZATION_LOCK_ID = 1001L;

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
}
