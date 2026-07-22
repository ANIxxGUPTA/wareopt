const axios = require('axios');

const BASE_URL = 'https://wareopt-backend.onrender.com/api';

async function runTest() {
    console.log("=== STARTING PHASE 4 LIVE VERIFICATION ===\\n");
    try {
        // 1. Create a new inventory item
        console.log("1. Creating a new inventory item (should trigger RESTOCK)...");
        const invRes = await axios.post(`${BASE_URL}/inventory`, {
            sku: `P4-${Date.now()}`,
            name: "Phase 4 Audit Item",
            quantityOnHand: 25,
            reorderThreshold: 5,
            costPerUnit: 10
        });
        const item = invRes.data;
        console.log(`Response: Created Item ID ${item.id} with qty ${item.quantityOnHand}\\n`);

        // 2. Edit the inventory item manually
        console.log("2. Editing the item manually to increase quantity to 30 (should trigger MANUAL_ADJUSTMENT)...");
        item.quantityOnHand = 30;
        await axios.put(`${BASE_URL}/inventory/${item.id}`, item);
        console.log(`Response: Item updated successfully.\\n`);

        // 3. Fulfill an order with this item
        console.log("3. Creating and fulfilling an order with 5 units of this item (should trigger ORDER_FULFILLMENT)...");
        let futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const orderRes = await axios.post(`${BASE_URL}/delivery-orders`, {
            destinationLat: 40.7128,
            destinationLng: -74.0060,
            deadline: futureDate.toISOString(),
            weightKg: 5,
            priority: 1,
            items: [
                {
                    inventoryItem: item,
                    quantity: 5
                }
            ]
        });
        const order = orderRes.data;
        await axios.post(`${BASE_URL}/delivery-orders/${order.id}/fulfill`);
        console.log(`Response: Order ID ${order.id} fulfilled.\\n`);

        // 4. Fetch the history and print it
        console.log("4. Fetching the movement history for this item...");
        const historyRes = await axios.get(`${BASE_URL}/inventory/${item.id}/history`);
        const history = historyRes.data;
        
        console.log("History Records (Descending Order):");
        history.forEach((record, index) => {
            console.log(`[Record ${index + 1}] ID: ${record.id} | Amount: ${record.changeAmount > 0 ? '+' : ''}${record.changeAmount} | Reason: ${record.reason} | Note: ${record.note} | Time: ${record.timestamp}`);
        });

        console.log("\\n=== VERIFICATION COMPLETE ===");
    } catch (e) {
        console.error("Test script failed unexpectedly:");
        if (e.response) {
            console.error(e.response.status, JSON.stringify(e.response.data));
        } else {
            console.error(e.message);
        }
    }
}

runTest();
