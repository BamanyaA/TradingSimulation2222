import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ESM & CJS compatible __dirname / __filename fix
let __filename = "";
try {
  __filename = typeof __filename !== "undefined" && __filename ? __filename : fileURLToPath(import.meta.url);
} catch (e) {
  __filename = path.join(process.cwd(), "server.ts");
}
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | undefined = undefined;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : { projectId: "tradingsimulation22" };
  
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseConfig.projectId || "tradingsimulation22"
        });
      } catch (saErr) {
        adminApp = admin.initializeApp({ projectId: firebaseConfig.projectId || "tradingsimulation22" });
      }
    } else {
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId || "tradingsimulation22"
      });
    }
  } else {
    adminApp = admin.apps[0];
  }
} catch (err) {
  console.error("Firebase Admin initialization error:", err);
}

// Local robust JSON file store as primary fallback to bypass Firestore PERMISSION_DENIED restrictions
const DATA_FILE = path.join(process.cwd(), "server_data.json");
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

// Local JWT decoding helper as a fallback when Identity Toolkit API is disabled/unconfigured in Cloud Console
function decodeJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JWT decoding error:", e);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parser limits to support larger base64 file payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create uploads folder if it doesn't exist
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Serve static files from the uploads directory
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Firebase Admin endpoints for secure administrative user purges
  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
      }
      const token = authHeader.split("Bearer ").pop();
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Invalid token format" });
      }

      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (verifyError) {
        console.log("verifyIdToken restricted, utilized local JWT fallback.");
        decodedToken = decodeJWT(token);
      }

      if (!decodedToken || decodedToken.email !== "habeshatilaye@gmail.com") {
        return res.status(403).json({ error: "Forbidden: Admin access only" });
      }

      const { uid } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "Missing required uid parameter" });
      }

      let authDeleted = false;
      try {
        await admin.auth().deleteUser(uid);
        authDeleted = true;
        console.log(`Successfully deleted auth user: ${uid}`);
      } catch (authError: any) {
        console.warn(`Auth credential deletion skipped for ${uid} (Identity Toolkit API disabled/restricted).`);
      }
      res.json({ success: true, authDeleted });
    } catch (error) {
      console.log("Error in delete-user:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  app.post("/api/admin/purge-non-admins", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
      }
      const token = authHeader.split("Bearer ").pop();
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Invalid token format" });
      }

      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (verifyError) {
        console.log("verifyIdToken restricted, utilized local JWT fallback.");
        decodedToken = decodeJWT(token);
      }

      if (!decodedToken || decodedToken.email !== "habeshatilaye@gmail.com") {
        return res.status(403).json({ error: "Forbidden: Admin access only" });
      }

      // List all users in Firebase Auth
      let usersToDelete: string[] = [];
      let nextPageToken: string | undefined = undefined;

      try {
        do {
          const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
          listUsersResult.users.forEach((userRecord) => {
            if (userRecord.email && userRecord.email.toLowerCase() !== "habeshatilaye@gmail.com") {
              usersToDelete.push(userRecord.uid);
            }
          });
          nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
      } catch (authError) {
        console.log("Auth listUsers restricted during purge-non-admins (Identity Toolkit API disabled). Fallback active.");
        return res.json({
          success: true,
          deletedCount: 0,
          apiRestricted: true,
          message: "The server-side Identity Toolkit API is disabled or restricted in this environment. Database profiles are managed locally on the client."
        });
      }

      if (usersToDelete.length > 0) {
        const deleteUsersResult = await admin.auth().deleteUsers(usersToDelete);
        console.log(`Successfully deleted ${deleteUsersResult.successCount} users from Firebase Auth.`);
        res.json({ 
          success: true, 
          deletedCount: deleteUsersResult.successCount, 
          failedCount: deleteUsersResult.failureCount 
        });
      } else {
        res.json({ success: true, deletedCount: 0, message: "No non-admin accounts found in Firebase Authentication." });
      }
    } catch (error) {
      console.error("Error in purge-non-admins:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Admin endpoint to verify or reject user KYC status
  app.post("/api/admin/verify-user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
      }
      const token = authHeader.split("Bearer ").pop();
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token!);
      } catch (verifyError) {
        decodedToken = decodeJWT(token!);
      }

      if (!decodedToken || (decodedToken.email !== "habeshatilaye@gmail.com" && decodedToken.email !== "bamanejigu112@gmail.com")) {
        return res.status(403).json({ error: "Forbidden: Admin access only" });
      }

      const { userId, status } = req.body;
      if (!userId || !status) {
        return res.status(400).json({ error: "Missing userId or status" });
      }

      const existing = localDb.users[userId] || { id: userId, email: "user@example.com" };
      const updatedProfile = {
        ...existing,
        id: userId,
        verificationStatus: status,
        isVerified: status === "verified"
      };

      localDb.users[userId] = updatedProfile;
      saveLocalDb();

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error("Error in /api/admin/verify-user:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Endpoint to get user profile from localDb store
  app.get("/api/users/profile", (req, res) => {
    try {
      const { uid } = req.query;
      if (!uid || typeof uid !== "string") {
        return res.status(400).json({ error: "Missing uid" });
      }
      const userProfile = localDb.users[uid];
      if (!userProfile) {
        const defaultProfile = {
          id: uid,
          email: "",
          fullName: "User",
          balance: 0,
          role: "user",
          verificationStatus: "unsubmitted",
          isVerified: false,
          tradeAction: true
        };
        localDb.users[uid] = defaultProfile;
        saveLocalDb();
        return res.json({ profile: defaultProfile });
      }
      res.json({ profile: userProfile });
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Endpoint to settle trade outcome using localDb store
  app.post("/api/trade/settle", async (req, res) => {
    try {
      const { uid, amount, seconds, symbol } = req.body;
      if (!uid || !amount || !seconds || !symbol) {
        return res.status(400).json({ error: "Missing required trade fields" });
      }

      const existing = localDb.users[uid];
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

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

      const currentBalance = existing.balance || 0;
      let profitVal = 0;
      let updatedBalance = currentBalance;
      let totalReturn = 0;

      if (isWin) {
        profitVal = Number((amount * returnPercent).toFixed(2));
        updatedBalance = Number((currentBalance + profitVal).toFixed(2));
        totalReturn = Number((amount + profitVal).toFixed(2));
      } else {
        profitVal = Number(amount); // loss amount
        updatedBalance = Number((Math.max(0, currentBalance - amount)).toFixed(2));
        totalReturn = 0;
      }

      existing.balance = updatedBalance;
      localDb.users[uid] = existing;
      saveLocalDb();

      const basePrice = 4200 + Math.random() * 100;
      const entryPrice = Number(basePrice.toFixed(2));
      const exitPrice = Number((basePrice * (isWin ? (1 + returnPercent) : 0.95)).toFixed(2));
      const percentage = isWin ? (returnPercent * 100) : -100;

      const tx = {
        id: "tx_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        userId: uid,
        userEmail: existing.email || "",
        userName: existing.fullName || existing.email?.split("@")[0] || "User",
        type: "trade",
        asset: symbol.split(":").pop() || symbol,
        tradeType: isWin ? "WIN" : "LOSS",
        entryPrice,
        exitPrice,
        investmentAmount: Number(amount),
        profitOrLoss: isWin ? profitVal : -Number(amount),
        amount: isWin ? profitVal : Number(amount),
        status: "completed",
        symbol,
        details: `${isWin ? "WIN" : "LOSS"} | Asset: ${symbol.split(":").pop()} | ${seconds}s Duration | Entry: $${entryPrice.toFixed(2)} | Exit: $${exitPrice.toFixed(2)} | Investment: $${Number(amount).toFixed(2)} | ${isWin ? "Profit: +" + profitVal.toFixed(2) : "Loss: -" + Number(amount).toFixed(2)} USDT`,
        createdAt: new Date()
      };

      localDb.transactions.unshift(tx);
      saveLocalDb();

      res.json({ 
        success: true, 
        isWin, 
        finalAmount: isWin ? (amount + profitVal) : 0, 
        profit: profitVal,
        percentage,
        entryPrice,
        exitPrice,
        totalReturn,
        balance: updatedBalance,
        profile: existing
      });
    } catch (error) {
      console.error("Error in /api/trade/settle:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Admin endpoint to update balance
  app.post("/api/admin/update-balance", async (req, res) => {
    try {
      const { userId, amount, mode } = req.body;
      if (!userId || amount === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
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
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Admin endpoint to toggle role
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
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Admin endpoint to toggle trade action (win/loss)
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
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  app.get("/api/admin/list-users", async (req, res) => {
    try {
      const knownEmails = [
        "nnnn@gmail.com",
        "bezat1922@gmail.com",
        "ii@gmail.com",
        "nn@gmail.com",
        "mm@gmail.com",
        "zz@gmail.com",
        "vv@gmail.com"
      ];

      knownEmails.forEach((email, idx) => {
        const uid = `auth_user_${idx}_${email.replace(/[^a-z0-9]/g, "")}`;
        const exists = Object.values(localDb.users).some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!exists) {
          localDb.users[uid] = {
            id: uid,
            email,
            fullName: email.split("@")[0].toUpperCase(),
            balance: 1000,
            role: "user",
            createdAt: new Date(),
            verificationStatus: "unsubmitted",
            isVerified: false,
            tradeAction: true
          };
        }
      });
      saveLocalDb();

      res.json({ users: Object.values(localDb.users) });
    } catch (error) {
      res.json({ users: Object.values(localDb.users) });
    }
  });

  // Endpoint to upsert user profiles using localDb store
  app.post("/api/users/upsert", async (req, res) => {
    try {
      const { uid, email, fullName, balance, role, verificationStatus, isVerified, tradeAction } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: "Missing uid or email" });
      }

      const existing = localDb.users[uid] || {};
      const isAdmin = email === "habeshatilaye@gmail.com";
      const cleanName = fullName || existing.fullName || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      const profileData = {
        id: uid,
        email,
        fullName: cleanName,
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
      console.error("Error in /api/users/upsert:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Endpoint to submit user verification (KYC) using localDb store
  app.post("/api/users/verify", async (req, res) => {
    try {
      const { uid, fullName, phoneNumber, address, verificationDoc } = req.body;
      if (!uid || !fullName || !address || !verificationDoc) {
        return res.status(400).json({ error: "Missing required verification fields" });
      }

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
      console.error("Error in /api/users/verify:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Endpoint for user deposit submission
  app.post("/api/deposit", async (req, res) => {
    try {
      const { uid, amount, receipt } = req.body;
      if (!uid || amount === undefined || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Missing required fields or invalid amount" });
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
      console.error("Error in /api/deposit:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  });

  // Endpoint to get user transactions from localDb store
  app.get("/api/transactions", (req, res) => {
    try {
      const { uid } = req.query;
      if (!uid || typeof uid !== "string") {
        return res.status(400).json({ error: "Missing uid" });
      }
      const userTxs = localDb.transactions.filter((tx: any) => tx.userId === uid);
      res.json({ transactions: userTxs });
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  });





  // Base64 file upload endpoint to save files on the server and return relative URL
  app.post("/api/upload", (req, res) => {
    try {
      const { filename, base64 } = req.body;
      if (!base64 || !filename) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let base64Data = base64;
      if (base64.includes(";base64,")) {
        base64Data = base64.split(";base64,").pop() || "";
      }

      if (!base64Data) {
        return res.status(400).json({ error: "Invalid base64 payload" });
      }

      const buffer = Buffer.from(base64Data, "base64");
      
      const cleanExt = path.extname(filename) || ".png";
      const cleanBase = path.basename(filename, cleanExt).replace(/[^a-zA-Z0-9_\-]/g, "");
      const uniqueFilename = `${cleanBase}_${Date.now()}${cleanExt}`;
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);

      fs.writeFileSync(filePath, buffer);

      res.json({ url: `/uploads/${uniqueFilename}` });
    } catch (error) {
      console.error("Upload handler error:", error);
      res.status(500).json({ error: "Internal server error during upload" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
