const API_URL = 'http://localhost:8080/api';

async function seedAndTestOverlap() {
    console.log('Seeding data for Overlap Test...');
    
    // Reset DB
    console.log('Resetting DB...');
    await fetch(`${API_URL}/debug/reset`, { method: 'POST' });

    // Create a worker (Worker 1) who works up to 40 hours
    await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Worker 1', maxHoursPerWeek: 40, hourlyCost: 15, skills: ['FORKLIFT'] })
    });
    
    // Create Shift 1: Monday 09:00 - 17:00 (8h)
    await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            requiredWorkerCount: 1,
            requiredSkill: 'FORKLIFT'
        })
    });

    // Create Shift 2: Monday 12:00 - 20:00 (8h) - Overlaps with Shift 1
    await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dayOfWeek: 1,
            startTime: '12:00',
            endTime: '20:00',
            requiredWorkerCount: 1,
            requiredSkill: 'FORKLIFT'
        })
    });

    console.log('Running optimization...');
    const res = await fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    if (res.status === 422) {
        console.log('SUCCESS: Optimization returned 422 Infeasible. The optimizer correctly refused to assign the single worker to overlapping shifts!');
    } else if (res.status === 200) {
        const body = await res.json();
        const assignments = body.assignments || [];
        if (assignments.length === 2) {
            console.log('FAILED: Worker was assigned to BOTH overlapping shifts!');
        } else {
            console.log(`FAILED: Unexpected success with ${assignments.length} assignments.`);
        }
    } else {
        console.log('FAILED with unexpected status: ' + res.status);
    }
}

seedAndTestOverlap();
