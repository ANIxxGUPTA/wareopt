const BASE_URL = 'https://wareopt-backend.onrender.com';

async function verify() {
  console.log("Starting live verification on Render...");
  
  try {
    // 1. Reset All Data
    console.log("1. Triggering Reset All Data...");
    let resetRes = await fetch(`${BASE_URL}/api/reset`, { method: 'DELETE' });
    if (!resetRes.ok) throw new Error(`Reset failed: ${resetRes.status}`);
    console.log("Reset successful.");

    // 2. Check stock movements is empty
    console.log("2. Checking stock movements...");
    // Create an item to check history length
    let createRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'TEST-SKU-123', name: 'Test', quantityOnHand: 0 })
    });
    let createdItem = await createRes.json();
    let historyRes = await fetch(`${BASE_URL}/api/inventory/${createdItem.id}/history`);
    let history = await historyRes.json();
    if (history.length !== 0) {
       console.error(`FAIL: expected 0 history items for new sku, found ${history.length}. History wasn't wiped by reset?`);
    } else {
       console.log("PASS: Stock history is clean.");
    }
    
    // 3. Trigger Infeasible Optimization
    console.log("3. Triggering infeasible optimization...");
    // Create an impossible shift
    let shiftRes = await fetch(`${BASE_URL}/api/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         dayOfWeek: 1, startTime: '09:00:00', endTime: '17:00:00', 
         requiredWorkerCount: 10, requiredSkill: 'Unicorn'
      })
    });
    let optRes = await fetch(`${BASE_URL}/api/optimization/run`, { method: 'POST' });
    console.log(`Optimization Response Status: ${optRes.status}`);
    if (optRes.status === 422) {
       let body = await optRes.json();
       console.log("PASS: Infeasible optimization returned 422 with message:", body.message);
    } else {
       console.error(`FAIL: Expected 422, got ${optRes.status}`);
    }

    console.log("Verification complete.");
  } catch (e) {
    console.error("Verification error:", e);
  }
}

verify();
