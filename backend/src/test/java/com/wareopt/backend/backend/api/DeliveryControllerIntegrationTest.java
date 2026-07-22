package com.wareopt.backend.backend.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliverySlot;
import com.wareopt.backend.backend.exception.GlobalExceptionHandler;
import com.wareopt.backend.backend.optimization.DeliverySlotOptimizer;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.DeliverySlotRepository;
import com.wareopt.backend.backend.repository.SlotAssignmentRepository;
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
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(deliveryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testCreateOrderSuccess() throws Exception {
        DeliveryOrder order = new DeliveryOrder();
        order.setDestinationLat(BigDecimal.valueOf(40.0));
        order.setDestinationLng(BigDecimal.valueOf(-74.0));
        order.setDeadline(LocalDateTime.now().plusDays(1));
        order.setWeightKg(BigDecimal.valueOf(10.5));
        
        when(deliveryOrderRepository.save(any())).thenReturn(order);

        mockMvc.perform(post("/api/delivery-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(order)))
                .andExpect(status().isCreated());
    }

    @Test
    void testCreateSlotInvalidTime() throws Exception {
        DeliverySlot slot = new DeliverySlot();
        slot.setStartTime(LocalDateTime.now().plusDays(1));
        slot.setEndTime(LocalDateTime.now()); // End before start
        slot.setMaxCapacityKg(BigDecimal.valueOf(100.0));

        mockMvc.perform(post("/api/delivery-slots")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(slot)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateOrderNotFound() throws Exception {
        DeliveryOrder order = new DeliveryOrder();
        order.setDestinationLat(BigDecimal.valueOf(40.0));
        order.setDestinationLng(BigDecimal.valueOf(-74.0));
        order.setDeadline(LocalDateTime.now().plusDays(1));
        order.setWeightKg(BigDecimal.valueOf(10.5));

        when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/delivery-orders/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(order)))
                .andExpect(status().isNotFound());
    }
}
