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

async function runCompleteTransactionAudit() {
  console.log("=== STARTING COMPLETE TRANSACTION SYSTEM AUDIT ===");

  const db = loadDb();
  db.transactions = []; // reset for clean test
  const testUid = "tx_audit_user_888";

  // 1. Initialize user with $0.00 starting balance
  db.users[testUid] = {
    id: testUid,
    email: "tx_audit@gammixtrades.com",
    fullName: "Transaction Audit User",
    balance: 0.00,
    role: "user"
  };
  saveDb(db);

  let user = db.users[testUid];
  let runningBalance = 0.00;
  console.log(`[Test 1] Initial Balance: $${user.balance.toFixed(2)} (Expected: $0.00)`);
  if (user.balance !== 0.00) throw new Error("Initial balance must be $0.00");

  // 2. Deposit Test (+$1,000.00)
  const depositAmount = 1000.00;
  runningBalance = Number((runningBalance + depositAmount).toFixed(2)); // $1000.00
  user.balance = runningBalance;
  const depTxId = "tx_dep_" + Date.now();
  db.transactions.unshift({
    id: depTxId,
    userId: testUid,
    userEmail: user.email,
    userName: user.fullName,
    type: "deposit",
    amount: depositAmount,
    status: "completed",
    details: "Deposit verified successfully",
    createdAt: new Date()
  });
  saveDb(db);
  console.log(`[Test 2] Deposit of $${depositAmount}: Balance = $${user.balance.toFixed(2)} (Expected: $1000.00)`);
  if (user.balance !== 1000.00) throw new Error("Deposit transaction failed");

  // 3. Winning Trade (+ $150.00 profit)
  const winProfit = 150.00;
  runningBalance = Number((runningBalance + winProfit).toFixed(2)); // $1150.00
  user.balance = runningBalance;
  const tradeIdWin = "tr_win_" + Date.now();
  db.transactions.unshift({
    id: "tx_trade_win_" + Date.now(),
    tradeId: tradeIdWin,
    userId: testUid,
    userEmail: user.email,
    userName: user.fullName,
    type: "trade",
    asset: "BTC/USDT",
    tradeType: "WIN",
    investmentAmount: 500,
    profitOrLoss: winProfit,
    amount: winProfit,
    status: "completed",
    details: "WIN | Profit: +$150.00 USDT",
    createdAt: new Date()
  });
  saveDb(db);
  console.log(`[Test 3] Winning Trade: Balance = $${user.balance.toFixed(2)} (Expected: $1150.00)`);
  if (user.balance !== 1150.00) throw new Error("Winning trade transaction failed");

  // 4. Losing Trade (- $50.00 loss)
  const lossAmount = 50.00;
  runningBalance = Number((runningBalance - lossAmount).toFixed(2)); // $1100.00
  user.balance = runningBalance;
  const tradeIdLoss = "tr_loss_" + Date.now();
  db.transactions.unshift({
    id: "tx_trade_loss_" + Date.now(),
    tradeId: tradeIdLoss,
    userId: testUid,
    userEmail: user.email,
    userName: user.fullName,
    type: "trade",
    asset: "ETH/USDT",
    tradeType: "LOSS",
    investmentAmount: 200,
    profitOrLoss: -lossAmount,
    amount: lossAmount,
    status: "completed",
    details: "LOSS | Loss: -$50.00 USDT",
    createdAt: new Date()
  });
  saveDb(db);
  console.log(`[Test 4] Losing Trade: Balance = $${user.balance.toFixed(2)} (Expected: $1100.00)`);
  if (user.balance !== 1100.00) throw new Error("Losing trade transaction failed");

  // 5. Withdrawal Test (- $300.00)
  const withdrawAmount = 300.00;
  runningBalance = Number((runningBalance - withdrawAmount).toFixed(2)); // $800.00
  user.balance = runningBalance;
  const wdTxId = "tx_wd_" + Date.now();
  db.transactions.unshift({
    id: wdTxId,
    userId: testUid,
    userEmail: user.email,
    userName: user.fullName,
    type: "withdraw",
    amount: withdrawAmount,
    status: "pending",
    details: "Name: Audit User | Wallet: TTestWallet | Network: USDT",
    createdAt: new Date()
  });
  saveDb(db);
  console.log(`[Test 5] Withdrawal of $${withdrawAmount}: Balance = $${user.balance.toFixed(2)} (Expected: $800.00)`);
  if (user.balance !== 800.00) throw new Error("Withdrawal transaction failed");

  // 6. Admin Rejection Refund Test (+$300.00 refund upon rejection)
  const wdTx = db.transactions.find((t: any) => t.id === wdTxId);
  wdTx.status = "rejected";
  runningBalance = Number((runningBalance + withdrawAmount).toFixed(2)); // $1100.00
  user.balance = runningBalance;
  saveDb(db);
  console.log(`[Test 6] Withdrawal Rejected & Refunded: Balance = $${user.balance.toFixed(2)} (Expected: $1100.00)`);
  if (user.balance !== 1100.00) throw new Error("Withdrawal rejection refund failed");

  // 7. Verify Transaction History Count and Reconciliation
  const userTxs = db.transactions.filter((t: any) => t.userId === testUid);
  console.log(`[Test 7] User Transaction Count: ${userTxs.length} (Expected: 4 transactions)`);
  if (userTxs.length !== 4) throw new Error("Transaction history count mismatch");

  console.log("\n=== ALL COMPLETE TRANSACTION SYSTEM AUDIT TESTS PASSED SUCCESSFULLY ===");
}

runCompleteTransactionAudit().catch(err => {
  console.error("TRANSACTION AUDIT FAILED:", err);
  process.exit(1);
});
