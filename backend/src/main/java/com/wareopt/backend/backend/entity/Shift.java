package com.wareopt.backend.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

@Entity
@Table(name = "shifts")
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Day of week is required")
    @Min(value = 1, message = "Day of week must be between 1 and 7")
    @Max(value = 7, message = "Day of week must be between 1 and 7")
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @NotNull(message = "Start time is required")
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @NotNull(message = "Required worker count is required")
    @Min(value = 1, message = "Required worker count must be at least 1")
    @Column(name = "required_worker_count", nullable = false)
    private Integer requiredWorkerCount;

    @NotBlank(message = "Required skill cannot be blank")
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
