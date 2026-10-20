/**
 * Production Issues Verification Script
 * 
 * Tests the two critical production issues against the live backend:
 * 1. GET /meal-log/history?limit=30&offset=0 (checks missing meal_schedules.recurrence error)
 * 2. GET /mood-log/today (checks HTTP 400 when no mood log exists)
 * 
 * Usage:
 *   node scripts/test-prod-issues.js
 */

const BASE_URL = process.env.BASE_URL || 'https://velvet.api.softvence.app';
const TEST_USER = process.env.TEST_USER || 'boxeta6793@dreameg.com';
const TEST_PASS = process.env.TEST_PASS || 'boxeta6793@dreameg.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function pass(testName, details = '') {
  console.log(`${colors.green}✔ PASS:${colors.reset} ${colors.bold}${testName}${colors.reset} ${details}`);
}

function fail(testName, error) {
  console.error(`${colors.red}✖ FAIL:${colors.reset} ${colors.bold}${testName}${colors.reset}`);
  console.error(`  ${colors.red}Error:${colors.reset}`, error);
}

async function run() {
  console.log(`\n${colors.cyan}${colors.bold}====================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  VELVET & IRON: LIVE PRODUCTION ISSUES AUDIT SUITE ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Test Account:    ${TEST_USER}\n`);

  let failures = 0;
  let accessToken = null;
  let refreshToken = null;

  // ========================================================
  // Step 1: Authenticate with Production Server
  // ========================================================
  console.log(`${colors.bold}--- 1. Authenticating with Production Backend ---${colors.reset}`);
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: TEST_USER,
        password: TEST_PASS,
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.access_token) {
      throw new Error(`Login failed with HTTP ${loginRes.status}: ${JSON.stringify(loginData)}`);
    }

    accessToken = loginData.access_token;
    refreshToken = loginData.refresh_token;
    pass('User Login', `Successfully logged in as ${loginData.user?.email || TEST_USER}`);
  } catch (err) {
    fail('User Login', err.message);
    failures++;
    console.error('\nCannot continue without authentication.');
    process.exit(1);
  }

  const authHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'x-refresh-token': refreshToken,
    'Accept': 'application/json',
  };

  // ========================================================
  // Step 2: Test Issue 1 - GET /meal-log/history (meal_schedules.recurrence)
  // ========================================================
  console.log(`\n${colors.bold}--- 2. Testing Issue 1: GET /meal-log/history?limit=30&offset=0 ---${colors.reset}`);
  try {
    const res = await fetch(`${BASE_URL}/meal-log/history?limit=30&offset=0`, {
      method: 'GET',
      headers: authHeaders,
    });

    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    if (res.status === 400 && typeof body === 'object' && body.message?.includes('meal_schedules.recurrence')) {
      throw new Error(`CRITICAL BUG: Column meal_schedules.recurrence is missing in DB! Message: ${body.message}`);
    }

    if (!res.ok) {
      throw new Error(`Unexpected HTTP ${res.status}: ${JSON.stringify(body)}`);
    }

    if (typeof body !== 'object' || body === null) {
      throw new Error(`Invalid response structure, expected JSON object`);
    }

    pass(
      'Issue 1: GET /meal-log/history',
      `HTTP 200 OK | Retrieved ${body.logs?.length ?? 0} logs, ${body.totalCount ?? 0} total count (No recurrence column error)`
    );
  } catch (err) {
    fail('Issue 1: GET /meal-log/history', err.message);
    failures++;
  }

  // ========================================================
  // Step 3: Test Issue 2A - GET /mood-log/today for an unlogged date
  // ========================================================
  console.log(`\n${colors.bold}--- 3. Testing Issue 2A: GET /mood-log/today (Empty State / Unlogged Date) ---${colors.reset}`);
  const unloggedDate = '2026-01-01'; // Safe date in past with no user mood logged
  try {
    const res = await fetch(`${BASE_URL}/mood-log/today?date=${unloggedDate}`, {
      method: 'GET',
      headers: authHeaders,
    });

    const text = await res.text();
    let body = null;
    if (text && text.trim().length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    // Check if the old 400 Bad Request is returned
    if (res.status === 400) {
      throw new Error(`REGRESSION: Returned HTTP 400 Bad Request for unlogged date! Message: ${JSON.stringify(body)}`);
    }

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 OK for empty mood state, but received HTTP ${res.status}`);
    }

    pass(
      'Issue 2A: Empty Mood State Handling',
      `HTTP 200 OK | Received ${body === null ? 'null (clean empty state)' : JSON.stringify(body)} for date=${unloggedDate}`
    );
  } catch (err) {
    fail('Issue 2A: Empty Mood State Handling', err.message);
    failures++;
  }

  // ========================================================
  // Step 4: Test Issue 2B - GET /mood-log/today (Current Date)
  // ========================================================
  console.log(`\n${colors.bold}--- 4. Testing Issue 2B: GET /mood-log/today (Current Date) ---${colors.reset}`);
  try {
    const res = await fetch(`${BASE_URL}/mood-log/today`, {
      method: 'GET',
      headers: authHeaders,
    });

    const text = await res.text();
    let body = null;
    if (text && text.trim().length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (res.status === 400) {
      throw new Error(`REGRESSION: Returned HTTP 400 for today: ${JSON.stringify(body)}`);
    }

    if (!res.ok) {
      throw new Error(`Expected HTTP 200, received HTTP ${res.status}`);
    }

    pass(
      'Issue 2B: GET /mood-log/today (Today)',
      `HTTP 200 OK | Result: ${body ? `Mood: ${body.mood}, Energy: ${body.energyLevel}` : 'null (no mood logged yet today)'}`
    );
  } catch (err) {
    fail('Issue 2B: GET /mood-log/today (Today)', err.message);
    failures++;
  }

  // ========================================================
  // Step 5: Test Issue 2C - GET /mood-log/history
  // ========================================================
  console.log(`\n${colors.bold}--- 5. Testing Mood Log History: GET /mood-log/history?limit=5 ---${colors.reset}`);
  try {
    const res = await fetch(`${BASE_URL}/mood-log/history?limit=5&offset=0`, {
      method: 'GET',
      headers: authHeaders,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    }

    pass(
      'Mood Log History',
      `HTTP 200 OK | Total logs: ${data.totalCount}, Current mood: ${data.currentMood || 'N/A'}`
    );
  } catch (err) {
    fail('Mood Log History', err.message);
    failures++;
  }

  // ========================================================
  // Summary
  // ========================================================
  console.log(`\n${colors.cyan}${colors.bold}====================================================${colors.reset}`);
  if (failures === 0) {
    console.log(`${colors.green}${colors.bold}  ALL PRODUCTION AUDIT TESTS PASSED SUCCESSFULLY!  ${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}  AUDIT COMPLETED WITH ${failures} FAILURE(S).           ${colors.reset}`);
  }
  console.log(`${colors.cyan}${colors.bold}====================================================${colors.reset}\n`);

  process.exit(failures === 0 ? 0 : 1);
}

run();

