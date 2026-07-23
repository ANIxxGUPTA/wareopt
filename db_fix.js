const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://wareopt_db_user:mN3n4nJ9dsRKPGCzJ7YozV3mlklyi2wZ@dpg-d9fpde8k1i2s73b9ucr0-a.oregon-postgres.render.com/wareopt_db?sslmode=require"
});

async function run() {
  await client.connect();
  console.log("Connected to Render DB for cleanup...");

  try {
    // 1. Delete orphaned rows
    console.log("Deleting orphaned stock_movements...");
    const delRes = await client.query(`
      DELETE FROM stock_movements 
      WHERE inventory_item_id NOT IN (SELECT id FROM inventory_items);
    `);
    console.log("Deleted rows count:", delRes.rowCount);

    // 2. Add foreign key constraint
    console.log("Adding foreign key constraint with ON DELETE CASCADE...");
    await client.query(`
      ALTER TABLE stock_movements 
      ADD CONSTRAINT fk_stock_movements_inventory_items 
      FOREIGN KEY (inventory_item_id) 
      REFERENCES inventory_items(id) 
      ON DELETE CASCADE;
    `);
    console.log("Constraint added successfully.");

    // 3. Verify it exists
    console.log("Verifying constraints on stock_movements...");
    const res = await client.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints AS rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'stock_movements';
    `);
    console.log("Verification:", res.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
