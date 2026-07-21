package com.wareopt.backend.backend.repository;

import com.wareopt.backend.backend.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {
}
