package com.wareopt.backend.backend.entity;

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
