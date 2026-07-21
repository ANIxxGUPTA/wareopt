package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.SlotAssignment;
import com.wareopt.backend.backend.exception.GlobalExceptionHandler;
import com.wareopt.backend.backend.optimization.DeliverySlotOptimizer;
import com.wareopt.backend.backend.optimization.InfeasibleSolutionException;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.DeliverySlotRepository;
import com.wareopt.backend.backend.repository.SlotAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DeliveryControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private DeliveryOrderRepository deliveryOrderRepository;

    @Mock
    private DeliverySlotRepository deliverySlotRepository;

    @Mock
    private SlotAssignmentRepository slotAssignmentRepository;

    @Mock
    private DeliverySlotOptimizer deliverySlotOptimizer;

    @InjectMocks
    private DeliveryController deliveryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(deliveryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testOptimizeDeliverySuccess() throws Exception {
        SlotAssignment sa = new SlotAssignment();
        sa.setEstimatedDistanceKm(BigDecimal.valueOf(10.5));

        when(deliveryOrderRepository.findAll()).thenReturn(List.of());
        when(deliverySlotRepository.findAll()).thenReturn(List.of());
        when(deliverySlotOptimizer.optimize(any(), any())).thenReturn(List.of(sa));

        mockMvc.perform(post("/api/optimize/delivery"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignments").isArray())
                .andExpect(jsonPath("$.totalDistanceKm").value(10.5));
    }

    @Test
    void testOptimizeDeliveryInfeasible() throws Exception {
        when(deliverySlotOptimizer.optimize(any(), any())).thenThrow(new InfeasibleSolutionException("Infeasible Delivery"));

        mockMvc.perform(post("/api/optimize/delivery"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Infeasible Delivery"));
    }
}
