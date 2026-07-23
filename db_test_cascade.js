const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://wareopt_db_user:mN3n4nJ9dsRKPGCzJ7YozV3mlklyi2wZ@dpg-d9fpde8k1i2s73b9ucr0-a.oregon-postgres.render.com/wareopt_db?sslmode=require"
});

const BASE_URL = 'https://wareopt-backend.onrender.com';

async function run() {
  await client.connect();
  console.log("Connected to Render DB.");

  try {
    // 1. Create a new InventoryItem with quantity > 0 to trigger a movement
    console.log("1. Creating inventory item with quantity 10...");
    let createRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'CASCADE-TEST-1', name: 'Cascade Test', quantityOnHand: 10 })
    });
    if (!createRes.ok) throw new Error("Create failed");
    let item = await createRes.json();
    console.log(`Created item ID: ${item.id}`);

    // 2. Verify stock movement exists in DB directly
    console.log("2. Querying DB directly for stock_movements...");
    let dbCheck1 = await client.query(`SELECT COUNT(*) as count FROM stock_movements WHERE inventory_item_id = $1`, [item.id]);
    console.log(`Stock movements found for ID ${item.id}:`, dbCheck1.rows[0].count);

    // 3. Delete the item via API
    console.log(`3. Deleting item ${item.id} via API...`);
    let delRes = await fetch(`${BASE_URL}/api/inventory/${item.id}`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error("Delete failed");
    console.log(`Deleted item ID: ${item.id}`);

    // 4. Verify stock movement is GONE from DB directly
    console.log("4. Querying DB directly for stock_movements to confirm cascade delete...");
    let dbCheck2 = await client.query(`SELECT COUNT(*) as count FROM stock_movements WHERE inventory_item_id = $1`, [item.id]);
    console.log(`Stock movements remaining for ID ${item.id}:`, dbCheck2.rows[0].count);
    
    if (dbCheck2.rows[0].count == 0) {
      console.log("PASS: Cascade delete is fully enforced.");
    } else {
      console.error("FAIL: Orphaned records still exist!");
    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
