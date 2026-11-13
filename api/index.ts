import express from "express";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Firebase Admin SDK if config exists
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath) && !admin.apps.length) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
} catch (err) {
  console.warn("Firebase Admin init warning on serverless:", err);
}

// Local robust JSON file store (using /tmp on Vercel for serverless persistence)
const DATA_FILE = process.env.VERCEL 
  ? path.join("/tmp", "server_data.json") 
  : path.join(process.cwd(), "server_data.json");

let localDb: {
  users: Record<string, any>;
  transactions: any[];
  support: any[];
  settings: any;
} = {
  users: {
    "uC4UmVowDjU7XIuWNBwVmfOMDyO2": {
      id: "uC4UmVowDjU7XIuWNBwVmfOMDyO2",
      email: "customer-uC4UmVowDjU@gmail.com",
      fullName: "Customer Operator uC4Um",
      phoneNumber: "+1 (555) 728-1902",
      address: "740 Main Street, Core Suite",
      verificationDoc: "",
      balance: 31050,
      role: "user",
      createdAt: new Date(),
      verificationStatus: "verified",
      isVerified: true,
      tradeAction: true
    }
  },
  transactions: [],
  support: [],
  settings: {
    btc_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    eth_address: "0x71C...392",
    usdt_address: "0x71C...392",
    sol_address: "So11111111111111111111111111111111111111112",
    bnb_address: "0x71C...392",
    xrp_address: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh"
  }
};

if (fs.existsSync(DATA_FILE)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (loaded.users) localDb.users = loaded.users;
    if (loaded.transactions) localDb.transactions = loaded.transactions;
    if (loaded.support) localDb.support = loaded.support;
    if (loaded.settings) localDb.settings = loaded.settings;
  } catch (e) {}
}

function saveLocalDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localDb, null, 2));
  } catch (e) {}
}

function decodeJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
}

// UPLOADS DIR
const UPLOADS_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/admin/delete-user", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing uid" });
    res.json({ success: true, authDeleted: true });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/admin/purge-non-admins", async (req, res) => {
  res.json({ success: true, deletedCount: 0 });
});

app.post("/api/admin/verify-user", async (req, res) => {
  try {
    const { userId, status } = req.body;
    const existing = localDb.users[userId] || { id: userId, email: "user@example.com" };
    existing.verificationStatus = status;
    existing.isVerified = status === "verified";
    localDb.users[userId] = existing;
    saveLocalDb();
    res.json({ success: true, profile: existing });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/users/profile", (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid || typeof uid !== "string") return res.status(400).json({ error: "Missing uid" });
    let profile = localDb.users[uid];
    if (!profile) {
      profile = {
        id: uid,
        email: "",
        fullName: "User",
        balance: 0,
        role: "user",
        verificationStatus: "unsubmitted",
        isVerified: false,
        tradeAction: true
      };
      localDb.users[uid] = profile;
      saveLocalDb();
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/trade/settle", async (req, res) => {
  try {
    const { uid, amount, seconds, symbol } = req.body;
    if (!uid || !amount || !seconds || !symbol) {
      return res.status(400).json({ error: "Missing required trade fields" });
    }
    const existing = localDb.users[uid];
    if (!existing) return res.status(404).json({ error: "User not found" });

    const isWin = existing.tradeAction !== undefined ? existing.tradeAction : Math.random() > 0.5;
    const durationObj = [
      { s: 30, r: 5 },
      { s: 60, r: 12 },
      { s: 90, r: 15 },
      { s: 120, r: 22 },
      { s: 180, r: 30 },
      { s: 300, r: 40 }
    ].find((d: any) => d.s === seconds);
    const returnPercent = durationObj ? durationObj.r / 100 : 0.05;
    const lossPercent = (seconds / 30) * 0.05;

    const finalAmount = isWin ? (amount * (1 + returnPercent)) : (amount * (1 - lossPercent));
    const profitVal = isWin ? (amount * returnPercent) : (amount * lossPercent);
    const basePrice = 4200 + Math.random() * 100;
    const entryPrice = Number(basePrice.toFixed(2));
    const exitPrice = Number((basePrice * (isWin ? (1 + returnPercent) : (1 - lossPercent))).toFixed(2));
    const percentage = (isWin ? returnPercent : -lossPercent) * 100;
    const totalReturn = isWin ? (amount + profitVal) : Math.max(0, amount - profitVal);

    existing.balance = Math.max(0, (existing.balance || 0) - amount + finalAmount);
    localDb.users[uid] = existing;

    const tx = {
      id: "tx_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      userId: uid,
      userEmail: existing.email || "",
      type: "trade",
      amount: isWin ? finalAmount : amount * lossPercent,
      status: isWin ? "completed" : "failed",
      symbol,
      details: `${isWin ? "WIN" : "LOSS"} | Asset: ${symbol.split(":").pop()} | ${seconds}s Duration | ${isWin ? "Profit: " + (returnPercent * 100).toFixed(0) + "%" : "Loss: " + (lossPercent * 100).toFixed(0) + "%"}`,
      createdAt: new Date()
    };
    localDb.transactions.unshift(tx);
    saveLocalDb();

    res.json({
      success: true,
      isWin,
      finalAmount,
      profit: profitVal,
      percentage,
      entryPrice,
      exitPrice,
      totalReturn,
      balance: existing.balance,
      profile: existing
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

app.post("/api/admin/update-balance", async (req, res) => {
  try {
    const { userId, amount, mode } = req.body;
    const existing = localDb.users[userId];
    if (!existing) return res.status(404).json({ error: "User not found" });

    let newBalance = existing.balance || 0;
    if (mode === 'add') newBalance += Number(amount);
    else if (mode === 'subtract') newBalance -= Number(amount);
    else if (mode === 'set') newBalance = Number(amount);

    existing.balance = Math.max(0, newBalance);
    localDb.users[userId] = existing;
    saveLocalDb();
    res.json({ success: true, balance: existing.balance });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/admin/toggle-role", async (req, res) => {
  try {
    const { userId } = req.body;
    const existing = localDb.users[userId];
    if (!existing) return res.status(404).json({ error: "User not found" });
    existing.role = existing.role === "admin" ? "user" : "admin";
    localDb.users[userId] = existing;
    saveLocalDb();
    res.json({ success: true, role: existing.role });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/admin/toggle-trade-action", async (req, res) => {
  try {
    const { userId } = req.body;
    const existing = localDb.users[userId];
    if (!existing) return res.status(404).json({ error: "User not found" });
    existing.tradeAction = existing.tradeAction === undefined ? false : !existing.tradeAction;
    localDb.users[userId] = existing;
    saveLocalDb();
    res.json({ success: true, tradeAction: existing.tradeAction });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/admin/list-users", async (req, res) => {
  try {
    res.json({ users: Object.values(localDb.users) });
  } catch (error) {
    res.json({ users: Object.values(localDb.users) });
  }
});

app.post("/api/users/upsert", async (req, res) => {
  try {
    const { uid, email, fullName, balance, role, verificationStatus, isVerified, tradeAction } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });

    const existing = localDb.users[uid] || {};
    const isAdmin = email === "habeshatilaye@gmail.com";
    const profileData = {
      id: uid,
      email,
      fullName: fullName || existing.fullName || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""),
      address: existing.address || "",
      phoneNumber: existing.phoneNumber || "",
      verificationDoc: existing.verificationDoc || null,
      balance: balance !== undefined ? balance : (existing.balance !== undefined ? existing.balance : 0),
      role: role || existing.role || (isAdmin ? "admin" : "user"),
      createdAt: existing.createdAt || new Date(),
      verificationStatus: verificationStatus || existing.verificationStatus || (isAdmin ? "verified" : "unsubmitted"),
      isVerified: isVerified !== undefined ? isVerified : (isAdmin ? true : (existing.isVerified !== undefined ? existing.isVerified : false)),
      tradeAction: tradeAction !== undefined ? tradeAction : (existing.tradeAction !== undefined ? existing.tradeAction : true)
    };
    localDb.users[uid] = profileData;
    saveLocalDb();
    res.json({ success: true, profile: profileData });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/users/verify", async (req, res) => {
  try {
    const { uid, fullName, phoneNumber, address, verificationDoc } = req.body;
    const existing = localDb.users[uid] || {};
    const profileData = {
      ...existing,
      id: uid,
      email: existing.email || "",
      fullName,
      phoneNumber: phoneNumber || existing.phoneNumber || "",
      address,
      verificationDoc,
      balance: existing.balance !== undefined ? existing.balance : 0,
      role: existing.role || "user",
      createdAt: existing.createdAt || new Date(),
      verificationStatus: "pending",
      isVerified: false,
      tradeAction: existing.tradeAction !== undefined ? existing.tradeAction : true
    };
    localDb.users[uid] = profileData;
    saveLocalDb();
    res.json({ success: true, profile: profileData });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/deposit", async (req, res) => {
  try {
    const { uid, amount, receipt } = req.body;
    if (!uid || amount === undefined || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    let existing = localDb.users[uid];
    if (!existing) {
      existing = {
        id: uid,
        email: "",
        fullName: "User",
        balance: 0,
        role: "user",
        verificationStatus: "unsubmitted",
        isVerified: false,
        tradeAction: true
      };
    }
    existing.balance = (existing.balance || 0) + Number(amount);
    existing.isVerified = true;
    existing.verificationStatus = "verified";
    existing.tradeAction = true;
    localDb.users[uid] = existing;

    const tx = {
      id: "tx_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      userId: uid,
      userEmail: existing.email || "",
      type: "deposit",
      amount: Number(amount),
      status: "completed",
      receipt: receipt || "deposit_payment",
      details: "Deposit / Upgrade payment verified successfully",
      createdAt: new Date()
    };
    localDb.transactions.unshift(tx);
    saveLocalDb();
    res.json({ success: true, balance: existing.balance, profile: existing });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/transactions", (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid || typeof uid !== "string") return res.status(400).json({ error: "Missing uid" });
    const userTxs = localDb.transactions.filter((tx: any) => tx.userId === uid);
    res.json({ transactions: userTxs });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/upload", (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!base64) return res.status(400).json({ error: "Missing base64" });
    if (process.env.VERCEL) {
      return res.json({ url: base64 });
    }
    res.json({ url: base64 });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
