const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://wareopt_db_user:mN3n4nJ9dsRKPGCzJ7YozV3mlklyi2wZ@dpg-d9fpde8k1i2s73b9ucr0-a.oregon-postgres.render.com/wareopt_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Render Postgres DB.");
    
    console.log("Truncating existing data...");
    await client.query("TRUNCATE workers, shifts, delivery_orders, delivery_slots, shift_assignments, slot_assignments RESTART IDENTITY CASCADE;");
    
    console.log("Reading db/999_seed.sql...");
    const sql = fs.readFileSync(path.join(__dirname, '../db/999_seed.sql'), 'utf8');
    
    console.log("Applying seed file...");
    await client.query(sql);
    
    console.log("Seed data applied successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}
run();
