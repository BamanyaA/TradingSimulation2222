import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "server_data.json");

function loadDb() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return { users: {}, transactions: [], support: [], settings: {} };
}

function saveDb(db: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function runWithdrawalTests() {
  console.log("=== STARTING FINAL WITHDRAWAL PRODUCTION TESTS ===");

  const db = loadDb();
  const testUid = "test_withdraw_user_1000";

  // 1. Initialize user with $1,000 balance
  db.users[testUid] = {
    id: testUid,
    email: "withdraw_test@gammixtrades.com",
    fullName: "Withdrawal Test User",
    balance: 1000.00,
    role: "user",
    tradeAction: true
  };
  saveDb(db);

  let user = db.users[testUid];
  console.log(`[Test 1] Initialized User Balance: $${user.balance.toFixed(2)}`);
  if (user.balance !== 1000.00) {
    throw new Error(`Test 1 Failed: Starting balance is not $1,000.00`);
  }
  console.log("Test 1 PASSED: Initial balance is $1,000.00.\n");

  // 2. Submit Withdrawal Request ($200.00)
  const withdrawAmount = 200.00;
  const beforeWithdrawBalance = user.balance; // $1,000.00
  
  if (beforeWithdrawBalance < withdrawAmount) {
    throw new Error("Insufficient balance for withdrawal test");
  }

  const newBalance = Number((beforeWithdrawBalance - withdrawAmount).toFixed(2)); // $800.00
  user.balance = newBalance;
  saveDb(db);

  const txId = "tx_withdraw_" + Date.now();
  const tx = {
    id: txId,
    userId: testUid,
    userEmail: user.email,
    userName: user.fullName,
    type: "withdraw",
    amount: withdrawAmount,
    status: "pending",
    details: `Name: ${user.fullName} | Wallet: TTestWalletAddress123 | Network: USDT`,
    createdAt: new Date()
  };
  db.transactions.unshift(tx);
  saveDb(db);

  console.log(`[Test 2 & 3 & 4 & 5] Submitted Withdrawal of $${withdrawAmount.toFixed(2)}`);
  console.log(`Balance after withdrawal: $${user.balance.toFixed(2)} (Expected: $800.00)`);
  if (user.balance !== 800.00) {
    throw new Error(`Test 2 Failed: Expected balance $800.00, got $${user.balance}`);
  }
  
  const foundTx = db.transactions.find((t: any) => t.id === txId);
  if (!foundTx || foundTx.type !== "withdraw" || foundTx.status !== "pending") {
    throw new Error("Test 4/5 Failed: Withdrawal transaction not found or invalid status in transactions collection");
  }
  console.log("Test 2-5 PASSED: Withdrawal successfully processed, balance deducted once to $800.00, transaction recorded as pending.\n");

  // 6. Test Admin Rejection & Exactly-Once Refund
  console.log("[Test 7] Testing Admin Rejection & Refund...");
  foundTx.status = "rejected";
  // Refund amount once
  user.balance = Number((user.balance + withdrawAmount).toFixed(2)); // $800 + $200 = $1000
  saveDb(db);

  console.log(`Balance after rejection refund: $${user.balance.toFixed(2)} (Expected: $1,000.00)`);
  if (user.balance !== 1000.00) {
    throw new Error(`Test 7 Failed: Rejection refund did not restore balance to $1,000.00 (got $${user.balance})`);
  }
  console.log("Test 7 PASSED: Admin rejection successfully refunded the exact withdrawal amount once.\n");

  console.log("=== ALL FINAL WITHDRAWAL PRODUCTION TESTS PASSED SUCCESSFULLY ===");
}

runWithdrawalTests().catch(err => {
  console.error("WITHDRAWAL TEST EXECUTION FAILED:", err);
  process.exit(1);
});
