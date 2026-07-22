package com.wareopt.backend.backend.optimization;

import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliverySlot;
import com.wareopt.backend.backend.entity.SlotAssignment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DeliverySlotOptimizerTest {

    private DeliverySlotOptimizer optimizer;

    @BeforeEach
    void setUp() {
        optimizer = new DeliverySlotOptimizer();
    }

    @Test
    void testFeasibleCase() {
        DeliveryOrder o1 = new DeliveryOrder();
        o1.setId(1L);
        o1.setWeightKg(BigDecimal.valueOf(10));
        o1.setDeadline(LocalDateTime.now().plusDays(2));
        o1.setDestinationLat(BigDecimal.valueOf(40.7128));
        o1.setDestinationLng(BigDecimal.valueOf(-74.0060));

        DeliverySlot s1 = new DeliverySlot();
        s1.setId(1L);
        s1.setMaxCapacityKg(BigDecimal.valueOf(100));
        s1.setStartTime(LocalDateTime.now());
        s1.setEndTime(LocalDateTime.now().plusHours(4));

        List<SlotAssignment> assignments = optimizer.optimize(List.of(o1), List.of(s1), java.util.Collections.emptyMap());
        assertFalse(assignments.isEmpty());
        assertEquals(1, assignments.size());
        assertEquals(1L, assignments.get(0).getOrder().getId());
        assertEquals(1L, assignments.get(0).getSlot().getId());
    }

    @Test
    void testInfeasibleCaseCapacity() {
        DeliveryOrder o1 = new DeliveryOrder();
        o1.setId(1L);
        o1.setWeightKg(BigDecimal.valueOf(200)); // Too heavy
        o1.setDeadline(LocalDateTime.now().plusDays(2));
        o1.setDestinationLat(BigDecimal.valueOf(40.7128));
        o1.setDestinationLng(BigDecimal.valueOf(-74.0060));

        DeliverySlot s1 = new DeliverySlot();
        s1.setId(1L);
        s1.setMaxCapacityKg(BigDecimal.valueOf(100));
        s1.setStartTime(LocalDateTime.now());
        s1.setEndTime(LocalDateTime.now().plusHours(4));

        assertThrows(InfeasibleSolutionException.class, () -> {
            optimizer.optimize(List.of(o1), List.of(s1), java.util.Collections.emptyMap());
        });
    }

    @Test
    void testInfeasibleCaseDeadline() {
        DeliveryOrder o1 = new DeliveryOrder();
        o1.setId(1L);
        o1.setWeightKg(BigDecimal.valueOf(10));
        // Deadline is in the past compared to slot end time
        o1.setDeadline(LocalDateTime.now().minusDays(1));
        o1.setDestinationLat(BigDecimal.valueOf(40.7128));
        o1.setDestinationLng(BigDecimal.valueOf(-74.0060));

        DeliverySlot s1 = new DeliverySlot();
        s1.setId(1L);
        s1.setMaxCapacityKg(BigDecimal.valueOf(100));
        s1.setStartTime(LocalDateTime.now());
        s1.setEndTime(LocalDateTime.now().plusHours(4));

        assertThrows(InfeasibleSolutionException.class, () -> {
            optimizer.optimize(List.of(o1), List.of(s1), java.util.Collections.emptyMap());
        });
    }

    @Test
    void testEdgeCaseZeroOrders() {
        List<SlotAssignment> assignments = optimizer.optimize(new ArrayList<>(), new ArrayList<>(), java.util.Collections.emptyMap());
        assertTrue(assignments.isEmpty());
    }
}
