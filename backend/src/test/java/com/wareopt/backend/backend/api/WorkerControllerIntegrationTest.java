package com.wareopt.backend.backend.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wareopt.backend.backend.entity.Worker;
import com.wareopt.backend.backend.exception.GlobalExceptionHandler;
import com.wareopt.backend.backend.repository.WorkerRepository;
import com.wareopt.backend.backend.repository.ShiftAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@ExtendWith(MockitoExtension.class)
class WorkerControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @InjectMocks
    private WorkerController workerController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(workerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testCreateWorkerSuccess() throws Exception {
        Worker worker = new Worker();
        worker.setName("John Doe");
        worker.setHourlyCost(BigDecimal.valueOf(20));
        worker.setMaxHoursPerWeek(40);

        when(workerRepository.save(any())).thenReturn(worker);

        mockMvc.perform(post("/api/workers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(worker)))
                .andExpect(status().isCreated());
    }

    @Test
    void testCreateWorkerInvalidNegativeCost() throws Exception {
        Worker worker = new Worker();
        worker.setName("John Doe");
        worker.setHourlyCost(BigDecimal.valueOf(-20)); // Invalid
        worker.setMaxHoursPerWeek(40);

        mockMvc.perform(post("/api/workers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(worker)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateWorkerSplitsCommaSeparatedSkills() throws Exception {
        Worker existingWorker = new Worker();
        existingWorker.setId(1L);
        existingWorker.setName("Priya");
        existingWorker.setHourlyCost(BigDecimal.valueOf(200));
        existingWorker.setMaxHoursPerWeek(30);
        existingWorker.setSkills(java.util.List.of("picking"));

        when(workerRepository.findById(1L)).thenReturn(Optional.of(existingWorker));

        Worker updatePayload = new Worker();
        updatePayload.setName("Priya");
        updatePayload.setHourlyCost(BigDecimal.valueOf(200));
        updatePayload.setMaxHoursPerWeek(30);
        updatePayload.setSkills(java.util.List.of("picking, packing")); // Send as a single string

        // Capture the saved worker
        when(workerRepository.save(any(Worker.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/workers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills[0]").value("picking"))
                .andExpect(jsonPath("$.skills[1]").value("packing"))
                .andExpect(jsonPath("$.skills.length()").value(2));
    }
}
