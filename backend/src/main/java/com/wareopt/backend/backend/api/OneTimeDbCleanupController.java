package com.wareopt.backend.backend.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class OneTimeDbCleanupController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/check-deps")
    public ResponseEntity<List<Map<String, Object>>> checkDependencies() {
        String sql = "SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name " +
                     "FROM information_schema.table_constraints AS tc " +
                     "JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name " +
                     "JOIN information_schema.constraint_column_usage AS ccu ON tc.constraint_name = ccu.constraint_name " +
                     "WHERE tc.constraint_type = 'FOREIGN KEY' " +
                     "AND ccu.table_name IN ('delivery_orders', 'delivery_slots', 'slot_assignments')";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    @PostMapping("/drop-tables")
    public ResponseEntity<String> dropTables() {
        String sql = "DROP TABLE IF EXISTS delivery_orders, delivery_slots, slot_assignments CASCADE;";
        jdbcTemplate.execute(sql);
        return ResponseEntity.ok("Dropped");
    }

    @PostMapping("/check-tables")
    public ResponseEntity<List<Map<String, Object>>> checkTables() {
        String sql = "SELECT table_name FROM information_schema.tables WHERE table_name IN ('delivery_orders', 'delivery_slots', 'slot_assignments')";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }
}
