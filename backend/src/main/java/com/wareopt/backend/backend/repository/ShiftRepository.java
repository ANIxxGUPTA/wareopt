package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    List<Shift> findByDayOfWeek(Integer day);
}
