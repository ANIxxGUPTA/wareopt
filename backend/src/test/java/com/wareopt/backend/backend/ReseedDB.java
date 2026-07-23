package com.wareopt.backend.backend;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.nio.file.Files;
import java.nio.file.Paths;

public class ReseedDB {
    @Test
    public void runReseed() throws Exception {
        String url = "jdbc:postgresql://dpg-d9fpde8k1i2s73b9ucr0-a.oregon-postgres.render.com/wareopt_db";
        String user = "wareopt_db_user";
        String password = "mN3n4nJ9dsRKPGCzJ7YozV3mlklyi2wZ";
        
        System.out.println("Connecting to Render DB for reseeding...");
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Truncating all tables...");
            stmt.execute("TRUNCATE TABLE workers, shifts, shift_assignments RESTART IDENTITY CASCADE;");
            
            System.out.println("Reading new SQL file...");
            String sql = new String(Files.readAllBytes(Paths.get("../db/999_seed.sql")));
            
            System.out.println("Executing seed SQL...");
            stmt.execute(sql);
            System.out.println("Successfully reseeded the remote database!");
        }
    }
}
