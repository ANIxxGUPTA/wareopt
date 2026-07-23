package com.wareopt.backend.backend.util;

public final class DatabaseConstants {
    private DatabaseConstants() {}

    public static final String TRUNCATE_ALL_TABLES_SQL = 
        "TRUNCATE TABLE inventory_items, workers, shifts, shift_assignments, stock_movements RESTART IDENTITY CASCADE;";
}
