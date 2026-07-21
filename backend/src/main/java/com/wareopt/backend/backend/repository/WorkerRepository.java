package com.wareopt.backend.backend.repository;

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
