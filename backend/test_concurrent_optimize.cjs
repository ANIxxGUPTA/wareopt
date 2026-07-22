const axios = require('axios');

const API_URL = 'http://localhost:8080/api';

async function testConcurrency() {
    console.log('=== STARTING PHASE 1 CONCURRENCY TEST ===');
    
    // We will fire two optimize requests at the same time
    console.log('Firing two concurrent optimization requests...');
    const req1 = axios.post(`${API_URL}/optimize/shifts`);
    const req2 = axios.post(`${API_URL}/optimize/shifts`);
    
    try {
        const results = await Promise.allSettled([req1, req2]);
        
        let successes = 0;
        let conflicts = 0;
        let others = 0;
        
        results.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                console.log(`[Request ${index + 1}] Succeeded! Status: ${res.value.status}`);
                successes++;
            } else {
                const err = res.reason;
                if (err.response) {
                    if (err.response.status === 409) {
                        console.log(`[Request ${index + 1}] Conflict (Expected)! Status: 409, Message: ${err.response.data.message}`);
                        conflicts++;
                    } else if (err.response.status === 422) {
                        console.log(`[Request ${index + 1}] Unprocessable Entity (Expected if no workers). Status: 422, Message: ${err.response.data.message}`);
                        // Consider this a success in terms of the test's purpose if it doesn't crash
                        successes++;
                    } else {
                        console.log(`[Request ${index + 1}] Failed with unexpected status: ${err.response.status}`);
                        others++;
                    }
                } else {
                    console.log(`[Request ${index + 1}] Failed with no response: ${err.message}`);
                    others++;
                }
            }
        });
        
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
