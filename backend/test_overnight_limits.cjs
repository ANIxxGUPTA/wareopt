const API_URL = 'https://wareopt-backend.onrender.com/api';

async function run() {
    console.log('=== STARTING OVERNIGHT VALIDATION SCOPE TEST ===');

    // 1. startTime == endTime
    console.log('\n1. Testing startTime == endTime (e.g. 10:00 to 10:00)');
    let res = await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 1, startTime: '10:00', endTime: '10:00', requiredWorkerCount: 1, requiredSkill: 'TEST' })
    });
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${await res.text()}`);

    // 2. Extreme case (23 hours: 10:00 to 09:00)
    console.log('\n2. Testing extreme case 23 hours (e.g. 10:00 to 09:00)');
    res = await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 1, startTime: '10:00', endTime: '09:00', requiredWorkerCount: 1, requiredSkill: 'TEST_' + Date.now() })
    });
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${await res.text()}`);

    // 3. Normal overnight (e.g. 22:00 to 06:00, which is 8 hours)
    console.log('\n3. Testing valid normal overnight (e.g. 22:00 to 06:00)');
    res = await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 1, startTime: '22:00', endTime: '06:00', requiredWorkerCount: 1, requiredSkill: 'TEST_' + Date.now() })
    });
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${await res.text()}`);
}

run();
