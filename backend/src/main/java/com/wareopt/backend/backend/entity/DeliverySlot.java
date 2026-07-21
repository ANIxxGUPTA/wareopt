package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_slots")
public class DeliverySlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "max_capacity_kg", nullable = false)
    private BigDecimal maxCapacityKg;

    @Column(name = "vehicle_id")
    private String vehicleId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public BigDecimal getMaxCapacityKg() { return maxCapacityKg; }
    public void setMaxCapacityKg(BigDecimal maxCapacityKg) { this.maxCapacityKg = maxCapacityKg; }
    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }
}
