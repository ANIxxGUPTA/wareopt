const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://wareopt_db_user:mN3n4nJ9dsRKPGCzJ7YozV3mlklyi2wZ@dpg-d9fpde8k1i2s73b9ucr0-a.oregon-postgres.render.com/wareopt_db?sslmode=require"
});

async function run() {
  await client.connect();
  console.log("Connected to Render DB.");

  try {
    // 1. Check for foreign key constraint on stock_movements
    console.log("Checking constraints on stock_movements...");
    const res = await client.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'stock_movements';
    `);
    console.log("Foreign Key Constraints found:", res.rows);

    // 2. Check for orphaned rows
    console.log("Checking for orphaned stock_movements...");
    const orphans = await client.query(`
      SELECT COUNT(*) as count FROM stock_movements 
      WHERE inventory_item_id NOT IN (SELECT id FROM inventory_items);
    `);
    console.log("Orphaned rows count:", orphans.rows[0].count);

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
