package com.wareopt.backend.backend.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reset")
public class ResetController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DeleteMapping
    public ResponseEntity<Void> resetDatabase() {
        String sql = "TRUNCATE TABLE inventory_items, workers, shifts, delivery_orders, delivery_slots, shift_assignments, slot_assignments RESTART IDENTITY CASCADE";
        jdbcTemplate.execute(sql);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.web.bind.annotation.PostMapping("/constraints")
    public ResponseEntity<String> addConstraints() {
        try { jdbcTemplate.execute("ALTER TABLE workers ADD CONSTRAINT unique_worker_name UNIQUE (name);"); } catch (Exception e) {}
        try { jdbcTemplate.execute("ALTER TABLE shifts ADD CONSTRAINT unique_shift UNIQUE (day_of_week, start_time, end_time, required_skill);"); } catch (Exception e) {}
        try { jdbcTemplate.execute("ALTER TABLE delivery_slots ADD CONSTRAINT unique_slot UNIQUE (start_time, end_time);"); } catch (Exception e) {}
        return ResponseEntity.ok("Constraints check complete.");
    }
}
