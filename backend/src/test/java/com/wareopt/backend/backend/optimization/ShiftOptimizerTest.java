package com.wareopt.backend.backend.optimization;

import com.wareopt.backend.backend.entity.Shift;
import com.wareopt.backend.backend.entity.ShiftAssignment;
import com.wareopt.backend.backend.entity.Worker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ShiftOptimizerTest {

    private ShiftOptimizer optimizer;

    @BeforeEach
    void setUp() {
        optimizer = new ShiftOptimizer();
    }

    @Test
    void testFeasibleCase() {
        Worker w1 = new Worker();
        w1.setId(1L);
        w1.setHourlyCost(BigDecimal.valueOf(15));
        w1.setMaxHoursPerWeek(40);
        w1.setSkills(List.of("picking"));

        Worker w2 = new Worker();
        w2.setId(2L);
        w2.setHourlyCost(BigDecimal.valueOf(20));
        w2.setMaxHoursPerWeek(40);
        w2.setSkills(List.of("picking"));

        Shift s1 = new Shift();
        s1.setId(1L);
        s1.setStartTime(LocalTime.of(8, 0));
        s1.setEndTime(LocalTime.of(16, 0));
        s1.setRequiredWorkerCount(1);
        s1.setRequiredSkill("picking");

        List<ShiftAssignment> assignments = optimizer.optimize(List.of(w1, w2), List.of(s1));
        
        assertFalse(assignments.isEmpty());
        // Since w1 is cheaper, it should be assigned
        assertEquals(1, assignments.size());
        assertEquals(1L, assignments.get(0).getWorker().getId());
    }

    @Test
    void testInfeasibleCase() {
        Worker w1 = new Worker();
        w1.setId(1L);
        w1.setHourlyCost(BigDecimal.valueOf(15));
        w1.setMaxHoursPerWeek(40);
        w1.setSkills(List.of("packing")); // Wrong skill

        Shift s1 = new Shift();
        s1.setId(1L);
        s1.setStartTime(LocalTime.of(8, 0));
        s1.setEndTime(LocalTime.of(16, 0));
        s1.setRequiredWorkerCount(1);
        s1.setRequiredSkill("picking");

        assertThrows(InfeasibleSolutionException.class, () -> {
            optimizer.optimize(List.of(w1), List.of(s1));
        });
    }

    @Test
    void testEdgeCaseZeroWorkers() {
        List<ShiftAssignment> assignments = optimizer.optimize(new ArrayList<>(), new ArrayList<>());
        assertTrue(assignments.isEmpty());
    }

    @Test
    void testMultipleSkillsSubsetMatching() {
        // Worker with both picking and packing
        Worker w1 = new Worker();
        w1.setId(1L);
        w1.setHourlyCost(BigDecimal.valueOf(15));
        w1.setMaxHoursPerWeek(40);
        w1.setSkills(List.of("picking", "packing"));

        // Worker with only picking
        Worker w2 = new Worker();
        w2.setId(2L);
        w2.setHourlyCost(BigDecimal.valueOf(15));
        w2.setMaxHoursPerWeek(40);
        w2.setSkills(List.of("picking"));

        // Shift requires BOTH picking and packing
        Shift s1 = new Shift();
        s1.setId(1L);
        s1.setStartTime(LocalTime.of(8, 0));
        s1.setEndTime(LocalTime.of(16, 0));
        s1.setRequiredWorkerCount(1);
        s1.setRequiredSkill("picking, packing");

        // w1 should be feasible, w2 should fail
        List<ShiftAssignment> assignments = optimizer.optimize(List.of(w1), List.of(s1));
        assertFalse(assignments.isEmpty());
        assertEquals(1, assignments.size());
        assertEquals(1L, assignments.get(0).getWorker().getId());

        // w2 lacks 'packing', should fail
        assertThrows(InfeasibleSolutionException.class, () -> {
            optimizer.optimize(List.of(w2), List.of(s1));
        });
    }

    @Test
    void testCommaSeparatedStringInArrayMatching() {
        // Worker with single string "picking, packing" in array
        Worker w1 = new Worker();
        w1.setId(1L);
        w1.setHourlyCost(BigDecimal.valueOf(15));
        w1.setMaxHoursPerWeek(40);
        w1.setSkills(List.of("picking, packing")); // Note: single string

        // Shift requires BOTH picking and packing
        Shift s1 = new Shift();
        s1.setId(1L);
        s1.setStartTime(LocalTime.of(8, 0));
        s1.setEndTime(LocalTime.of(16, 0));
        s1.setRequiredWorkerCount(1);
        s1.setRequiredSkill("picking, packing");

        // w1 should be feasible
        List<ShiftAssignment> assignments = optimizer.optimize(List.of(w1), List.of(s1));
        assertFalse(assignments.isEmpty());
        assertEquals(1, assignments.size());
        assertEquals(1L, assignments.get(0).getWorker().getId());
    }
}
