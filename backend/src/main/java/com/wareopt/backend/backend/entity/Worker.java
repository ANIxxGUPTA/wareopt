package com.wareopt.backend.backend.entity;

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
