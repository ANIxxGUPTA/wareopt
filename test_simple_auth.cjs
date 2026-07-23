const { chromium, webkit } = require('playwright');

const FRONTEND_URL = 'https://wareopt-frontend.onrender.com';
const BACKEND_URL = 'https://wareopt-backend.onrender.com';

// Read credentials from environment variables
const ADMIN_USER = process.env.TEST_APP_USERNAME;
const ADMIN_PASS = process.env.TEST_APP_PASSWORD;

if (!ADMIN_USER || !ADMIN_PASS) {
    console.error("❌ ERROR: TEST_APP_USERNAME and TEST_APP_PASSWORD must be set in the environment.");
    console.error("Example: TEST_APP_USERNAME=myuser TEST_APP_PASSWORD=mypass node test_simple_auth.cjs");
    process.exit(1);
}

async function testEngine(engineName, browserType) {
  console.log(`\n=== Testing in ${engineName} ===`);
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Logged out redirects to login
    console.log(`[Step 1] Navigating to protected dashboard while logged out...`);
    await page.goto(FRONTEND_URL);
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log(`✅ SUCCESS: Redirected to /login`);

    // 2. Incorrect credentials are rejected
    console.log(`[Step 2] Testing incorrect credentials...`);
    await page.fill('input[type="text"]', 'wrong');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Invalid username or password', { timeout: 5000 });
    console.log(`✅ SUCCESS: Incorrect credentials rejected`);

    // 3. Correct credentials grant access
    console.log(`[Step 3] Testing correct credentials...`);
    
    // Setup response interceptor to check cookie
    let setCookieHeader = null;
    page.on('response', response => {
      if (response.url().includes('/api/auth/login') && response.request().method() === 'POST') {
        const headers = response.headers();
        setCookieHeader = headers['set-cookie'];
      }
    });

    await page.fill('input[type="text"]', ADMIN_USER);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/', { timeout: 15000 });
    console.log(`✅ SUCCESS: Navigated to dashboard.`);
    
    if (setCookieHeader) {
        console.log(`   Set-Cookie: ${setCookieHeader}`);
    } else {
        console.log(`   WARNING: No Set-Cookie header intercepted.`);
    }

    // 4. Everything works (e.g. check Inventory is accessible)
    console.log(`[Step 4] Checking if inventory is accessible...`);
    await page.click('text=Inventory');
    await page.waitForURL('**/inventory', { timeout: 10000 });
    console.log(`✅ SUCCESS: Reached Inventory.`);

    // 5. Logout redirects to login
    console.log(`[Step 5] Testing logout...`);
    await page.click('text=Logout');
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log(`✅ SUCCESS: Logged out successfully.`);

  } catch (error) {
    console.error(`❌ ERROR in ${engineName} test: ${error.message}`);
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Saved screenshot to screenshot.png');
  } finally {
    await browser.close();
  }
}

async function run() {
  console.log('=== STARTING SIMPLE AUTH VERIFICATION ===\n');
  await testEngine('Chromium', chromium);
  console.log('\n=== ALL TESTS COMPLETE ===\n');
}

run();
