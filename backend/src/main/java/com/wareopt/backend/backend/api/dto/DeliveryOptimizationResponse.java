package com.wareopt.backend.backend.api.dto;

import com.wareopt.backend.backend.entity.SlotAssignment;
import java.math.BigDecimal;
import java.util.List;

public class DeliveryOptimizationResponse {
    private List<SlotAssignment> assignments;
    private BigDecimal totalDistanceKm;
    private long solveTimeMs;

    public DeliveryOptimizationResponse(List<SlotAssignment> assignments, BigDecimal totalDistanceKm, long solveTimeMs) {
        this.assignments = assignments;
        this.totalDistanceKm = totalDistanceKm;
        this.solveTimeMs = solveTimeMs;
    }

    public List<SlotAssignment> getAssignments() { return assignments; }
    public void setAssignments(List<SlotAssignment> assignments) { this.assignments = assignments; }
    public BigDecimal getTotalDistanceKm() { return totalDistanceKm; }
    public void setTotalDistanceKm(BigDecimal totalDistanceKm) { this.totalDistanceKm = totalDistanceKm; }
    public long getSolveTimeMs() { return solveTimeMs; }
    public void setSolveTimeMs(long solveTimeMs) { this.solveTimeMs = solveTimeMs; }
}
