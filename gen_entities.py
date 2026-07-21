import os

base_dir = r"C:\Users\user\Desktop\ANI\Projects\wareopt\backend\src\main\java\com\wareopt\backend\backend"
entity_dir = os.path.join(base_dir, "entity")
repo_dir = os.path.join(base_dir, "repository")
os.makedirs(entity_dir, exist_ok=True)
os.makedirs(repo_dir, exist_ok=True)

files = {}

files[f"{entity_dir}/Worker.java"] = """package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "workers")
public class Worker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "hourly_cost", nullable = false)
    private BigDecimal hourlyCost;

    @Column(name = "max_hours_per_week", nullable = false)
    private Integer maxHoursPerWeek;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> skills;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getHourlyCost() { return hourlyCost; }
    public void setHourlyCost(BigDecimal hourlyCost) { this.hourlyCost = hourlyCost; }
    public Integer getMaxHoursPerWeek() { return maxHoursPerWeek; }
    public void setMaxHoursPerWeek(Integer maxHoursPerWeek) { this.maxHoursPerWeek = maxHoursPerWeek; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
}
"""

files[f"{entity_dir}/Shift.java"] = """package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "shifts")
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "required_worker_count", nullable = false)
    private Integer requiredWorkerCount;

    @Column(name = "required_skill")
    private String requiredSkill;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public Integer getRequiredWorkerCount() { return requiredWorkerCount; }
    public void setRequiredWorkerCount(Integer requiredWorkerCount) { this.requiredWorkerCount = requiredWorkerCount; }
    public String getRequiredSkill() { return requiredSkill; }
    public void setRequiredSkill(String requiredSkill) { this.requiredSkill = requiredSkill; }
}
"""

files[f"{entity_dir}/ShiftAssignment.java"] = """package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_assignments")
public class ShiftAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @Column(name = "assigned_at", insertable = false, updatable = false)
    private LocalDateTime assignedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }
    public Shift getShift() { return shift; }
    public void setShift(Shift shift) { this.shift = shift; }
    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
"""

files[f"{entity_dir}/DeliveryOrder.java"] = """package com.wareopt.backend.backend.entity;

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
"""

files[f"{entity_dir}/DeliverySlot.java"] = """package com.wareopt.backend.backend.entity;

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
"""

files[f"{entity_dir}/SlotAssignment.java"] = """package com.wareopt.backend.backend.entity;

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
"""

files[f"{repo_dir}/WorkerRepository.java"] = """package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {
    @Query(value = "SELECT * FROM workers WHERE ?1 = ANY(skills)", nativeQuery = true)
    List<Worker> findBySkillsContaining(String skill);
}
"""

files[f"{repo_dir}/ShiftRepository.java"] = """package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    List<Shift> findByDayOfWeek(Integer day);
}
"""

files[f"{repo_dir}/ShiftAssignmentRepository.java"] = """package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {
}
"""

files[f"{repo_dir}/DeliveryOrderRepository.java"] = """package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    List<DeliveryOrder> findByDeadlineBefore(LocalDateTime deadline);
}
"""

files[f"{repo_dir}/DeliverySlotRepository.java"] = """package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.DeliverySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliverySlotRepository extends JpaRepository<DeliverySlot, Long> {
}
"""

files[f"{repo_dir}/SlotAssignmentRepository.java"] = """package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.SlotAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SlotAssignmentRepository extends JpaRepository<SlotAssignment, Long> {
}
"""

for path, content in files.items():
    with open(path, "w") as f:
        f.write(content)

print("Files generated successfully.")
