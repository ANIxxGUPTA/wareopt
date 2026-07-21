package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.ShiftOptimizationResponse;
import com.wareopt.backend.backend.entity.Shift;
import com.wareopt.backend.backend.entity.ShiftAssignment;
import com.wareopt.backend.backend.entity.Worker;
import com.wareopt.backend.backend.optimization.ShiftOptimizer;
import com.wareopt.backend.backend.repository.ShiftAssignmentRepository;
import com.wareopt.backend.backend.repository.ShiftRepository;
import com.wareopt.backend.backend.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ShiftController {

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private ShiftOptimizer shiftOptimizer;

    @GetMapping("/shifts")
    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    @GetMapping("/workers")
    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    @GetMapping("/shifts/{id}/assignments")
    public List<ShiftAssignment> getAssignmentsForShift(@PathVariable Long id) {
        return shiftAssignmentRepository.findAll().stream()
                .filter(a -> a.getShift().getId().equals(id))
                .collect(Collectors.toList());
    }

    @PostMapping("/optimize/shifts")
    public ShiftOptimizationResponse optimizeShifts() {
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
            if (hours < 0) hours += 24;
            totalCost = totalCost.add(hourlyRate.multiply(BigDecimal.valueOf(hours)));
        }

        return new ShiftOptimizationResponse(assignments, totalCost, solveTime);
    }
}
