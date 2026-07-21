package com.wareopt.backend.backend.api.dto;

import com.wareopt.backend.backend.entity.ShiftAssignment;
import java.math.BigDecimal;
import java.util.List;

public class ShiftOptimizationResponse {
    private List<ShiftAssignment> assignments;
    private BigDecimal totalCost;
    private long solveTimeMs;

    public ShiftOptimizationResponse(List<ShiftAssignment> assignments, BigDecimal totalCost, long solveTimeMs) {
        this.assignments = assignments;
        this.totalCost = totalCost;
        this.solveTimeMs = solveTimeMs;
    }

    public List<ShiftAssignment> getAssignments() { return assignments; }
    public void setAssignments(List<ShiftAssignment> assignments) { this.assignments = assignments; }
    public BigDecimal getTotalCost() { return totalCost; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
    public long getSolveTimeMs() { return solveTimeMs; }
    public void setSolveTimeMs(long solveTimeMs) { this.solveTimeMs = solveTimeMs; }
}
