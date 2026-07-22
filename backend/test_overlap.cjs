const API_URL = 'https://wareopt-backend.onrender.com/api';

async function seedAndTestOverlap() {
    console.log('Seeding data for Overlap Test...');
    
    // We will use a unique skill so that ONLY our new worker is eligible
    const uniqueSkill = 'SKILL_' + Date.now();

    // Create a worker (Worker 1) who works up to 40 hours
    await fetch(`${API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Worker ' + Date.now(), maxHoursPerWeek: 40, hourlyCost: 15, skills: [uniqueSkill] })
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
            requiredSkill: uniqueSkill
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
            requiredSkill: uniqueSkill
        })
    });

    console.log('Running optimization...');
    const res = await fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    if (res.status === 422) {
        console.log('SUCCESS: Optimization returned 422 Infeasible. The optimizer correctly refused to assign the single worker to overlapping shifts!');
    } else if (res.status === 200) {
        const body = await res.json();
        const assignments = body.assignments || [];
        
        // Find how many assignments were for our unique skill
        const ourAssignments = assignments.filter(a => a.shift && a.shift.requiredSkill === uniqueSkill);
        console.log(`Assignments for our skill: ${ourAssignments.length}`);
        console.log(JSON.stringify(ourAssignments, null, 2));
        
        if (ourAssignments.length === 2) {
            console.log('FAILED: Worker was assigned to BOTH overlapping shifts!');
        } else {
            console.log(`Wait... it succeeded but didn't assign both? ourAssignments.length = ${ourAssignments.length}`);
        }
    } else {
        const text = await res.text();
        console.log('FAILED with unexpected status: ' + res.status + ' ' + text);
    }
}

seedAndTestOverlap();
