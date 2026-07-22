const API_URL = 'https://wareopt-backend.onrender.com/api';

async function testUniqueConstraints() {
    console.log('=== STARTING PHASE 3 UNIQUE CONSTRAINTS TEST ===');
    
    // 1. Worker Name Unique Constraint
    console.log('Testing Worker Name Unique Constraint...');
    const workerName = 'Unique Worker ' + Date.now();
    await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workerName, maxHoursPerWeek: 40, hourlyCost: 15, skills: ['SKILL'] })
    });
    
    let res = await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workerName, maxHoursPerWeek: 40, hourlyCost: 15, skills: ['SKILL'] })
    });
    
    if (res.status === 409) {
        console.log('SUCCESS: Worker duplicate rejected with 409 Conflict.');
    } else {
        console.log(`FAILED: Expected 409 Conflict for duplicate worker, got ${res.status}. Message: ${await res.text()}`);
    }
    
    // 2. DeliverySlot Unique Constraint
    console.log('Testing DeliverySlot Unique Constraint...');
    await fetch(`${API_URL}/delivery-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: '2026-07-22T10:00:00', endTime: '2026-07-22T12:00:00', maxCapacityKg: 50 })
    });
    
    res = await fetch(`${API_URL}/delivery-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: '2026-07-22T10:00:00', endTime: '2026-07-22T12:00:00', maxCapacityKg: 100 })
    });
    
    if (res.status === 409) {
        console.log('SUCCESS: DeliverySlot duplicate rejected with 409 Conflict.');
    } else {
        console.log(`FAILED: Expected 409 Conflict for duplicate delivery slot, got ${res.status}. Message: ${await res.text()}`);
    }
}

testUniqueConstraints();
