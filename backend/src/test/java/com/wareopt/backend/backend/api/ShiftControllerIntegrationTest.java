package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.Shift;
import com.wareopt.backend.backend.entity.ShiftAssignment;
import com.wareopt.backend.backend.entity.Worker;
import com.wareopt.backend.backend.exception.GlobalExceptionHandler;
import com.wareopt.backend.backend.optimization.InfeasibleSolutionException;
import com.wareopt.backend.backend.optimization.ShiftOptimizer;
import com.wareopt.backend.backend.repository.ShiftAssignmentRepository;
import com.wareopt.backend.backend.repository.ShiftRepository;
import com.wareopt.backend.backend.repository.WorkerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ShiftControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Mock
    private ShiftOptimizer shiftOptimizer;

    @InjectMocks
    private ShiftController shiftController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(shiftController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testOptimizeShiftsSuccess() throws Exception {
        Worker w = new Worker();
        w.setId(1L);
        w.setHourlyCost(BigDecimal.valueOf(20));

        Shift s = new Shift();
        s.setId(1L);
        s.setStartTime(LocalTime.of(8, 0));
        s.setEndTime(LocalTime.of(16, 0));

        ShiftAssignment sa = new ShiftAssignment();
        sa.setWorker(w);
        sa.setShift(s);

        when(workerRepository.findAll()).thenReturn(List.of(w));
        when(shiftRepository.findAll()).thenReturn(List.of(s));
        when(shiftOptimizer.optimize(any(), any())).thenReturn(List.of(sa));

        mockMvc.perform(post("/api/optimize/shifts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignments").isArray())
                .andExpect(jsonPath("$.totalCost").value(160));
    }

    @Test
    void testOptimizeShiftsInfeasible() throws Exception {
        when(workerRepository.findAll()).thenReturn(List.of());
        when(shiftRepository.findAll()).thenReturn(List.of());
        when(shiftOptimizer.optimize(any(), any())).thenThrow(new InfeasibleSolutionException("Infeasible"));

        mockMvc.perform(post("/api/optimize/shifts"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Infeasible"));
    }
}
