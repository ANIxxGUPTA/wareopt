const API_URL = 'https://wareopt-backend.onrender.com/api';

async function seedAndTest() {
    console.log('Seeding data...');
    // Create a worker
    await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Worker ' + Date.now(), maxHoursPerWeek: 40, hourlyCost: 15, skills: ['FORKLIFT'] })
    });
    
    // Create multiple shifts
    for (let i = 0; i < 5; i++) {
        await fetch(`${API_URL}/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dayOfWeek: i % 7 + 1,
                startTime: '09:00',
                endTime: '17:00',
                requiredWorkerCount: 1,
                requiredSkill: 'FORKLIFT'
            })
        });
    }

    console.log('Data seeded. Firing concurrent optimization requests...');
    // Now optimization will take longer than 1ms
    
    const req1 = fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    const req2 = fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    
    const results = await Promise.allSettled([req1, req2]);
    let statuses = [];
    let conflicts = 0;
    
    for (const res of results) {
        if (res.status === 'fulfilled') {
            statuses.push(res.value.status);
            if (res.value.status === 409) conflicts++;
        }
    }
    
    console.log(`Results: ${statuses.join(', ')}`);
    if (conflicts >= 1) {
        console.log('SUCCESS: Got expected 409 Conflict!');
    } else {
        console.log('FAILED to get 409 Conflict. They might still not overlap, or lock is broken.');
    }
}

seedAndTest();
