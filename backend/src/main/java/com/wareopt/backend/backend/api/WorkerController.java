package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.Worker;
import com.wareopt.backend.backend.repository.WorkerRepository;
import com.wareopt.backend.backend.repository.ShiftAssignmentRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workers")
public class WorkerController {

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @GetMapping
    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    private List<String> normalizeSkills(List<String> rawSkills) {
        if (rawSkills == null) return null;
        return rawSkills.stream()
                .flatMap(s -> Arrays.stream(s.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<Worker> createWorker(@Valid @RequestBody Worker worker) {
        worker.setId(null); // Ensure a new entity is created
        worker.setSkills(normalizeSkills(worker.getSkills()));
        Worker savedWorker = workerRepository.save(worker);
        return new ResponseEntity<>(savedWorker, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Worker> updateWorker(@PathVariable Long id, @Valid @RequestBody Worker workerDetails) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found"));

        worker.setName(workerDetails.getName());
        worker.setHourlyCost(workerDetails.getHourlyCost());
        worker.setMaxHoursPerWeek(workerDetails.getMaxHoursPerWeek());
        worker.setSkills(normalizeSkills(workerDetails.getSkills()));

        Worker updatedWorker = workerRepository.save(worker);
        return ResponseEntity.ok(updatedWorker);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorker(@PathVariable Long id) {
        if (!workerRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found");
        }
        shiftAssignmentRepository.deleteByWorkerId(id);
        workerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
