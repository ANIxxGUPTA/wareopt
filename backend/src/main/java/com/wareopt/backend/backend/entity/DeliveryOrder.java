package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_orders")
public class DeliveryOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "destination_lat", nullable = false)
    private BigDecimal destinationLat;

    @Column(name = "destination_lng", nullable = false)
    private BigDecimal destinationLng;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Column(name = "weight_kg", nullable = false)
    private BigDecimal weightKg;

    @Column
    private Integer priority;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getDestinationLat() { return destinationLat; }
    public void setDestinationLat(BigDecimal destinationLat) { this.destinationLat = destinationLat; }
    public BigDecimal getDestinationLng() { return destinationLng; }
    public void setDestinationLng(BigDecimal destinationLng) { this.destinationLng = destinationLng; }
    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
}
