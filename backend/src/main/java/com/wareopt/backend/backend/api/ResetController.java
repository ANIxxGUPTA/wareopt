package com.wareopt.backend.backend.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wareopt.backend.backend.util.DatabaseConstants;

@RestController
@RequestMapping("/api/reset")
public class ResetController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DeleteMapping
    public ResponseEntity<Void> resetDatabase() {
        jdbcTemplate.execute(DatabaseConstants.TRUNCATE_ALL_TABLES_SQL);
        return ResponseEntity.noContent().build();
    }
}
