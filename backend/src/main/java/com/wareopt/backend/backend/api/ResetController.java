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
        String sql = "TRUNCATE TABLE inventory_items, workers, shifts, shift_assignments RESTART IDENTITY CASCADE";
        jdbcTemplate.execute(sql);
        return ResponseEntity.noContent().build();
    }
}
