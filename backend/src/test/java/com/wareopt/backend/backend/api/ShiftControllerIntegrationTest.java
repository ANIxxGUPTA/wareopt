package com.wareopt.backend.backend.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wareopt.backend.backend.entity.Shift;
import com.wareopt.backend.backend.exception.GlobalExceptionHandler;
import com.wareopt.backend.backend.repository.ShiftRepository;
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

import java.time.LocalTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ShiftControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @InjectMocks
    private ShiftController shiftController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(shiftController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testCreateShiftSuccess() throws Exception {
        Shift shift = new Shift();
        shift.setDayOfWeek(1);
        shift.setStartTime(LocalTime.of(8, 0));
        shift.setEndTime(LocalTime.of(16, 0));
        shift.setRequiredWorkerCount(5);
        shift.setRequiredSkill("picking");

        when(shiftRepository.save(any())).thenReturn(shift);

        mockMvc.perform(post("/api/shifts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shift)))
                .andExpect(status().isCreated());
    }

    @Test
    void testCreateShiftInvalidTime() throws Exception {
        Shift shift = new Shift();
        shift.setDayOfWeek(1);
        shift.setStartTime(LocalTime.of(16, 0));
        shift.setEndTime(LocalTime.of(8, 0)); // End before start
        shift.setRequiredWorkerCount(5);
        shift.setRequiredSkill("picking");

        mockMvc.perform(post("/api/shifts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shift)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateShiftSuccess() throws Exception {
        Shift shift = new Shift();
        shift.setId(1L);
        shift.setDayOfWeek(1);
        shift.setStartTime(LocalTime.of(8, 0));
        shift.setEndTime(LocalTime.of(16, 0));
        shift.setRequiredWorkerCount(5);
        shift.setRequiredSkill("picking");

        when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));
        when(shiftRepository.save(any())).thenReturn(shift);

        mockMvc.perform(put("/api/shifts/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shift)))
                .andExpect(status().isOk());
    }

    @Test
    void testDeleteShiftSuccess() throws Exception {
        when(shiftRepository.existsById(1L)).thenReturn(true);
        mockMvc.perform(delete("/api/shifts/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteShiftNotFound() throws Exception {
        when(shiftRepository.existsById(1L)).thenReturn(false);
        mockMvc.perform(delete("/api/shifts/1"))
                .andExpect(status().isNotFound());
    }
}
