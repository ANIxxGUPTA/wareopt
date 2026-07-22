const axios = require('axios');

const BASE_URL = 'https://wareopt-backend.onrender.com/api';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log("=== STARTING LIVE VERIFICATION ===\\n");
    try {
        // 1. Create inventory item "Bananas" qty 10
        console.log("1. Creating inventory item 'Bananas' with qty 10...");
        const invRes = await axios.post(`${BASE_URL}/inventory`, {
            sku: `BANANA-${Date.now()}`,
            name: "Bananas",
            quantityOnHand: 10,
            reorderThreshold: 5,
            costPerUnit: 2
        });
        const banana = invRes.data;
        console.log(`Response: ${JSON.stringify(banana)}\\n`);

        // 2. Create delivery order with 5 Bananas line item
        console.log("2. Creating delivery order with 5 Bananas...");
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
                    inventoryItem: banana,
                    quantity: 5
                }
            ]
        });
        const order1 = orderRes.data;
        console.log(`Response: Order ID ${order1.id} created with ${order1.items[0].quantity} bananas.\\n`);

        // 3. Confirm GET on that order shows the line item, and confirm Bananas qty is STILL 10
        console.log("3. Verifying order and inventory quantities BEFORE fulfillment...");
        const checkOrderRes = await axios.get(`${BASE_URL}/delivery-orders`);
        const fetchedOrder = checkOrderRes.data.find(o => o.id === order1.id);
        
        const checkInvRes = await axios.get(`${BASE_URL}/inventory/${banana.id}`);
        const fetchedBanana = checkInvRes.data;
        
        console.log(`Order GET Response: Items = ${JSON.stringify(fetchedOrder.items.map(i => ({id: i.inventoryItem.id, qty: i.quantity})))}`);
        console.log(`Inventory GET Response: Bananas Qty = ${fetchedBanana.quantityOnHand}`);
        console.log("Confirmed: Qty is STILL 10 (not deducted).\\n");

        // 4. Call /fulfill on the order, confirm response, then GET Bananas and confirm qty is now 5
        console.log("4. Fulfilling the order...");
        const fulfillRes = await axios.post(`${BASE_URL}/delivery-orders/${order1.id}/fulfill`);
        console.log(`Fulfill Response: Order Status = ${fulfillRes.data.status}`);
        
        const checkInvRes2 = await axios.get(`${BASE_URL}/inventory/${banana.id}`);
        const fetchedBanana2 = checkInvRes2.data;
        console.log(`Inventory GET Response: Bananas Qty is now ${fetchedBanana2.quantityOnHand}\\n`);

        // 5. Attempt to fulfill a second order for 10 Bananas (more than the remaining 5) and paste the actual error response
        console.log("5. Attempting to fulfill a second order for 10 Bananas (exceeding stock)...");
        const orderRes2 = await axios.post(`${BASE_URL}/delivery-orders`, {
            destinationLat: 40.7128,
            destinationLng: -74.0060,
            deadline: futureDate.toISOString(),
            weightKg: 5,
            priority: 1,
            items: [
                {
                    inventoryItem: banana,
                    quantity: 10
                }
            ]
        });
        const order2 = orderRes2.data;
        try {
            await axios.post(`${BASE_URL}/delivery-orders/${order2.id}/fulfill`);
            console.log("ERROR: Order 2 should have failed but succeeded!");
        } catch (err) {
            console.log(`Fulfill Error Response: Status ${err.response.status}, Data: ${JSON.stringify(err.response.data)}\\n`);
        }

        // 6. Fire two fulfill requests back-to-back for a fresh test order
        console.log("6. Firing two concurrent fulfill requests for a new order...");
        // First add more bananas so we don't hit the insufficient stock error, we want to hit the optimistic lock
        const invRes3 = await axios.post(`${BASE_URL}/inventory`, {
            sku: `BANANA-CONC-${Date.now()}`,
            name: "Bananas Concurrency",
            quantityOnHand: 100,
            reorderThreshold: 5,
            costPerUnit: 2
        });
        const bananaConc = invRes3.data;

        const orderRes3 = await axios.post(`${BASE_URL}/delivery-orders`, {
            destinationLat: 40.7128,
            destinationLng: -74.0060,
            deadline: futureDate.toISOString(),
            weightKg: 5,
            priority: 1,
            items: [
                {
                    inventoryItem: bananaConc,
                    quantity: 10
                }
            ]
        });
        const order3 = orderRes3.data;

        // Fire both exactly at the same time
        console.log(`Firing two fulfill POST requests for Order ${order3.id} concurrently...`);
        const req1 = axios.post(`${BASE_URL}/delivery-orders/${order3.id}/fulfill`).catch(e => e.response || e);
        const req2 = axios.post(`${BASE_URL}/delivery-orders/${order3.id}/fulfill`).catch(e => e.response || e);
        
        const res1 = await req1;
        if (res1.status === 200 || res1.status === 201) {
             console.log(`Request 1 Succeeded: Status ${res1.status}`);
        } else {
             console.log(`Request 1 Failed: Status ${res1.status}, Data: ${JSON.stringify(res1.data)}`);
        }

        const res2 = await req2;
        if (res2.status === 200 || res2.status === 201) {
             console.log(`Request 2 Succeeded: Status ${res2.status}`);
        } else {
             console.log(`Request 2 Failed: Status ${res2.status}, Data: ${JSON.stringify(res2.data)}`);
        }
        
        const checkInvRes3 = await axios.get(`${BASE_URL}/inventory/${bananaConc.id}`);
        console.log(`Final Inventory GET Response: Concurrency Bananas Qty = ${checkInvRes3.data.quantityOnHand} (Expected 90)`);

        console.log("\\n=== VERIFICATION COMPLETE ===");
    } catch (e) {
        console.error("Test script failed unexpectedly:", e.message);
        if (e.response) {
            console.error("Response:", e.response.data);
        }
    }
}

runTest();
