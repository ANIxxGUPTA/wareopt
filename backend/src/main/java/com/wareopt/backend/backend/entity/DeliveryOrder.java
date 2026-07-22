package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "delivery_orders")
public class DeliveryOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Destination latitude is required")
    @Column(name = "destination_lat", nullable = false)
    private BigDecimal destinationLat;

    @NotNull(message = "Destination longitude is required")
    @Column(name = "destination_lng", nullable = false)
    private BigDecimal destinationLng;

    @NotNull(message = "Deadline is required")
    @Column(nullable = false)
    private LocalDateTime deadline;

    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be positive")
    @Column(name = "weight_kg", nullable = false)
    private BigDecimal weightKg;

    @Column
    private Integer priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true, columnDefinition = "varchar(255) default 'PENDING'")
    private OrderStatus status = OrderStatus.PENDING;

    @Version
    @Column(nullable = true, columnDefinition = "bigint default 0")
    private Long version = 0L;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeliveryOrderItem> items = new ArrayList<>();

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
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public List<DeliveryOrderItem> getItems() { return items; }
    public void setItems(List<DeliveryOrderItem> items) {
        this.items.clear();
        if (items != null) {
            this.items.addAll(items);
            for (DeliveryOrderItem item : this.items) {
                item.setOrder(this);
            }
        }
    }
}
