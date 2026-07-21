package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "slot_assignments")
public class SlotAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private DeliveryOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private DeliverySlot slot;

    @Column(name = "estimated_distance_km")
    private BigDecimal estimatedDistanceKm;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DeliveryOrder getOrder() { return order; }
    public void setOrder(DeliveryOrder order) { this.order = order; }
    public DeliverySlot getSlot() { return slot; }
    public void setSlot(DeliverySlot slot) { this.slot = slot; }
    public BigDecimal getEstimatedDistanceKm() { return estimatedDistanceKm; }
    public void setEstimatedDistanceKm(BigDecimal estimatedDistanceKm) { this.estimatedDistanceKm = estimatedDistanceKm; }
}
