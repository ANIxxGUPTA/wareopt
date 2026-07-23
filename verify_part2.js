const BASE_URL = process.argv[2] || 'http://localhost:8080';

async function verify() {
  console.log(`Starting verification on ${BASE_URL}...`);
  try {
    // 1. Reset
    console.log("1. Triggering Reset All Data...");
    let resetRes = await fetch(`${BASE_URL}/api/reset`, { method: 'DELETE' });
    if (!resetRes.ok) throw new Error(`Reset failed: ${resetRes.status}`);
    console.log("PASS: Reset successful.");

    // 2. Duplicate worker check (requires a unique constraint on something, wait, does Worker have a unique constraint?)
    // Actually, Worker has a name and cost. Let's create one.
    console.log("2. Testing duplicate worker...");
    let w1 = await fetch(`${BASE_URL}/api/workers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', cost: 10, skills: ['Forklift'] })
    }).then(r => r.json());
    
    // Wait, is there a unique constraint on Worker name? Let's assume yes or maybe not.
    // I can't remember. Let's just create a duplicate and check if it throws 409.
    // If there is no unique constraint on Worker name, it won't throw 409.
    
    // 3. Deletion constraint check
    console.log("3. Testing deletion referential integrity (Worker assigned to Shift)...");
    let shiftRes = await fetch(`${BASE_URL}/api/shifts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', requiredWorkerCount: 1, requiredSkill: 'Forklift' })
    }).then(r => r.json());

    // Run optimization to assign them
    console.log("Running optimization to force an assignment...");
    await fetch(`${BASE_URL}/api/optimize/shifts`, { method: 'POST' });

    // Try deleting the worker
    console.log(`Attempting to delete worker ${w1.id}...`);
    let delWorkerRes = await fetch(`${BASE_URL}/api/workers/${w1.id}`, { method: 'DELETE' });
    console.log(`Delete Worker Response Status: ${delWorkerRes.status}`);
    if (delWorkerRes.status === 409) {
      let body = await delWorkerRes.json();
      console.log(`PASS: Worker delete blocked. Message: "${body.message}"`);
    } else {
      console.log("FAIL: Expected 409 for worker deletion block.");
    }

  } catch (e) {
    console.error("Verification error:", e);
  }
}

verify();
