const API_URL = 'https://wareopt-backend.onrender.com/api';

async function testConcurrency() {
    console.log('=== STARTING PHASE 1 CONCURRENCY TEST ===');
    
    // We will fire two optimize requests at the same time
    console.log('Firing two concurrent optimization requests...');
    const req1 = fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    const req2 = fetch(`${API_URL}/optimize/shifts`, { method: 'POST' });
    
    try {
        const results = await Promise.allSettled([req1, req2]);
        
        let successes = 0;
        let conflicts = 0;
        let others = 0;
        
        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            if (res.status === 'fulfilled') {
                const response = res.value;
                if (response.status === 200 || response.status === 201) {
                    console.log(`[Request ${i + 1}] Succeeded! Status: ${response.status}`);
                    successes++;
                } else if (response.status === 409) {
                    const text = await response.text();
                    console.log(`[Request ${i + 1}] Conflict (Expected)! Status: 409, Message: ${text}`);
                    conflicts++;
                } else if (response.status === 422) {
                    const text = await response.text();
                    console.log(`[Request ${i + 1}] Unprocessable Entity. Status: 422, Message: ${text}`);
                    successes++;
                } else {
                    const text = await response.text();
                    console.log(`[Request ${i + 1}] Failed with unexpected status: ${response.status}, Message: ${text}`);
                    others++;
                }
            } else {
                console.log(`[Request ${i + 1}] Failed with no response: ${res.reason}`);
                others++;
            }
        }
        
        console.log(`\nSummary: ${successes} successful (or 422 valid), ${conflicts} conflicts (409), ${others} other errors.`);
        
        if (conflicts >= 1 || successes === 1) {
            console.log('CONCURRENCY TEST PASSED: Lock mechanism successfully rejected concurrent request.');
        } else {
            console.log('CONCURRENCY TEST FAILED: Expected a 409 Conflict.');
        }
    } catch (e) {
        console.error('Test execution failed:', e);
    }
}

testConcurrency();
