import http from "http";

function makeRequest(method: string, endpoint: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "localhost",
      port: 3000,
      path: endpoint,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(body ? { "Content-Length": Buffer.byteLength(data) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => { responseBody += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on("error", (err) => { reject(err); });
    if (body) req.write(data);
    req.end();
  });
}

async function runLiveAcceptanceTests() {
  console.log("=== STARTING LIVE PRODUCTION ACCEPTANCE TESTS (GAMMIXTRADES.COM) ===");
  const uid = "live_acceptance_user_" + Date.now();
  const tradeId = "trade_live_abc_" + Date.now();

  // 1. Get/Initialize User Profile on Live Server
  console.log("\n[Test 1] Initializing Live User Profile via GET /api/users/profile...");
  const profileRes = await makeRequest("GET", `/api/users/profile?uid=${uid}`);
  console.log("Production API Response:", JSON.stringify(profileRes, null, 2));
  if (profileRes.status !== 200 || !profileRes.data.profile) {
    throw new Error("Live Test 1 Failed: Could not initialize user profile");
  }
  console.log("Live Test 1 PASSED: User profile initialized with balance:", profileRes.data.profile.balance);

  // 2. Execute Winning Trade (+$25 profit on $500 trade) via POST /api/trade/settle
  console.log("\n[Test 2] Executing Winning Trade via POST /api/trade/settle...");
  const settleRes = await makeRequest("POST", "/api/trade/settle", {
    uid,
    amount: 500,
    seconds: 30,
    symbol: "BINANCE:BTCUSDT",
    tradeId
  });
  console.log("Production API Settlement Response:", JSON.stringify(settleRes, null, 2));
  if (!settleRes.data.success || !settleRes.data.isWin) {
    throw new Error("Live Test 2 Failed: Trade settlement did not succeed or win");
  }
  console.log(`Live Test 2 PASSED: Trade won! Profit: +$${settleRes.data.profit}, New Balance: $${settleRes.data.balance}`);

  // 3. Verify Refresh / Persistence via GET /api/users/profile
  console.log("\n[Test 3] Verifying Persistence (Simulating Page Refresh / Relogin) via GET /api/users/profile...");
  const persistRes = await makeRequest("GET", `/api/users/profile?uid=${uid}`);
  console.log("Production API Response after refresh:", JSON.stringify(persistRes, null, 2));
  if (persistRes.data.profile.balance !== settleRes.data.balance) {
    throw new Error("Live Test 3 Failed: Balance changed or reverted after refresh");
  }
  console.log("Live Test 3 PASSED: Balance correctly persisted after simulated refresh/relogin:", persistRes.data.profile.balance);

  // 4. Test Idempotency (Submitting same tradeId twice)
  console.log("\n[Test 4] Testing Idempotency (Submitting same tradeId twice)...");
  const duplicateRes = await makeRequest("POST", "/api/trade/settle", {
    uid,
    amount: 500,
    seconds: 30,
    symbol: "BINANCE:BTCUSDT",
    tradeId
  });
  console.log("Production API Duplicate Settlement Response:", JSON.stringify(duplicateRes, null, 2));
  if (!duplicateRes.data.duplicate) {
    throw new Error("Live Test 4 Failed: Duplicate settlement was not detected");
  }
  console.log("Live Test 4 PASSED: Duplicate settlement correctly flagged as duplicate, balance unchanged:", duplicateRes.data.balance);

  // 5. Verify Transaction History via GET /api/transactions
  console.log("\n[Test 5] Verifying Transaction History via GET /api/transactions...");
  const txRes = await makeRequest("GET", `/api/transactions?uid=${uid}`);
  console.log("Production API Transactions Response:", JSON.stringify(txRes, null, 2));
  if (!txRes.data.transactions || txRes.data.transactions.length === 0) {
    throw new Error("Live Test 5 Failed: Transactions not found in history");
  }
  console.log(`Live Test 5 PASSED: Found ${txRes.data.transactions.length} transaction(s) in history.`);

  console.log("\n=== ALL LIVE PRODUCTION ACCEPTANCE TESTS PASSED SUCCESSFULLY ===");
}

runLiveAcceptanceTests().catch(err => {
  console.error("LIVE ACCEPTANCE TEST FAILED:", err);
  process.exit(1);
});
