const API_URL = 'https://wareopt-backend.onrender.com/api';

async function run() {
    console.log('=== STARTING NON-OVERLAP TEST ===');
    
    // 1. Reset DB
    await fetch(`${API_URL}/reset`, { method: 'DELETE' });

    // 2. Create Worker
    const uniqueSkill = 'SKILL_' + Date.now();
    let res = await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Worker ' + Date.now(), maxHoursPerWeek: 40, hourlyCost: 15, skills: [uniqueSkill] })
    });
    
    // 3. Create Shift 1 (09:00 - 13:00)
    await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 1, startTime: '09:00', endTime: '13:00', requiredWorkerCount: 1, requiredSkill: uniqueSkill })
    });

    // 4. Create Shift 2 (14:00 - 18:00)
    await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 1, startTime: '14:00', endTime: '18:00', requiredWorkerCount: 1, requiredSkill: uniqueSkill })
    });

    // 5. Optimize
    console.log('Running optimization...');
    res = await fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    if (res.status === 200) {
        const body = await res.json();
        const assignments = body.assignments || [];
        const ourAssignments = assignments.filter(a => a.shift && a.shift.requiredSkill === uniqueSkill);
        console.log(`SUCCESS: Got 200 OK. Assignments for our skill: ${ourAssignments.length}`);
        console.log(JSON.stringify(ourAssignments, null, 2));
    } else {
        const text = await res.text();
        console.log(`FAILED: Unexpected status ${res.status}. Message: ${text}`);
    }
}

run();
