package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.ShiftOptimizationResponse;
import com.wareopt.backend.backend.entity.Shift;
import com.wareopt.backend.backend.entity.ShiftAssignment;
import com.wareopt.backend.backend.entity.Worker;
import com.wareopt.backend.backend.optimization.ShiftOptimizer;
import com.wareopt.backend.backend.repository.ShiftAssignmentRepository;
import com.wareopt.backend.backend.repository.ShiftRepository;
import com.wareopt.backend.backend.repository.WorkerRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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

    @PostMapping("/shifts")
    public ResponseEntity<Shift> createShift(@Valid @RequestBody Shift shift) {
        if (!shift.getEndTime().isAfter(shift.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        shift.setId(null);
        Shift savedShift = shiftRepository.save(shift);
        return new ResponseEntity<>(savedShift, HttpStatus.CREATED);
    }

    @PutMapping("/shifts/{id}")
    public ResponseEntity<Shift> updateShift(@PathVariable Long id, @Valid @RequestBody Shift shiftDetails) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shift not found"));

        if (!shiftDetails.getEndTime().isAfter(shiftDetails.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        shift.setDayOfWeek(shiftDetails.getDayOfWeek());
        shift.setStartTime(shiftDetails.getStartTime());
        shift.setEndTime(shiftDetails.getEndTime());
        shift.setRequiredWorkerCount(shiftDetails.getRequiredWorkerCount());
        shift.setRequiredSkill(shiftDetails.getRequiredSkill());

        Shift updatedShift = shiftRepository.save(shift);
        return ResponseEntity.ok(updatedShift);
    }

    @DeleteMapping("/shifts/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        if (!shiftRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Shift not found");
        }
        shiftRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
