import express from "express";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";

const app = express();

app.use((req, res, next) => {
  if (req.url && !req.url.startsWith("/api") && req.url.startsWith("/")) {
    req.url = "/api" + req.url;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Firebase Admin SDK with optional Service Account or Project ID
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : { projectId: "tradingsimulation22" };
  
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseConfig.projectId || "tradingsimulation22"
        });
        console.log("Firebase Admin initialized with service account credentials.");
      } catch (saErr) {
        console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to projectId init:", saErr);
        admin.initializeApp({ projectId: firebaseConfig.projectId || "tradingsimulation22" });
      }
    } else {
      admin.initializeApp({
        projectId: firebaseConfig.projectId || "tradingsimulation22"
      });
    }
  }
} catch (err) {
  console.warn("Firebase Admin init warning on serverless:", err);
}

const db = admin.apps.length ? admin.firestore() : null;

// UPLOADS DIR
const UPLOADS_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// List users from Firestore with guaranteed default seeds
app.get("/api/admin/list-users", async (req, res) => {
  try {
    let users: any[] = [];
    if (db) {
      try {
        const snapshot = await db.collection("users").get();
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn("Firestore getUsers error:", e);
      }
    }

    const defaultSeedUsers = [
      {
        id: "uC4UmVowDjU7XIuWNBwVmfOMDyO2",
        email: "customer-uC4UmVowDjU@gmail.com",
        fullName: "Customer Operator uC4Um",
        phoneNumber: "+1 (555) 728-1902",
        address: "740 Main Street, Core Suite",
        balance: 31050,
        role: "user",
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true
      },
      {
        id: "hQ1Q5rrJZfRGJKF1JawYLHQzMid2",
        email: "yyyyyggggg@gmail.com",
        fullName: "Yyyyyggggg",
        balance: 0,
        role: "user",
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true
      },
      {
        id: "s8HZY5FL1lSAgYkfzQVDnc17iu1",
        email: "mm@gmail.com",
        fullName: "Mm",
        balance: 1000,
        role: "user",
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true
      },
      {
        id: "user_nnnn_1",
        email: "nnnn@gmail.com",
        fullName: "Nnnn",
        balance: 500,
        role: "user",
        verificationStatus: "pending",
        isVerified: false,
        tradeAction: true
      },
      {
        id: "user_bezat_2",
        email: "bezat1922@gmail.com",
        fullName: "Bezat",
        balance: 2500,
        role: "user",
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true
      },
      {
        id: "user_ii_3",
        email: "ii@gmail.com",
        fullName: "Ii",
        balance: 150,
        role: "user",
        verificationStatus: "unsubmitted",
        isVerified: false,
        tradeAction: true
      },
      {
        id: "user_nn_4",
        email: "nn@gmail.com",
        fullName: "Nn",
        balance: 0,
        role: "user",
        verificationStatus: "unsubmitted",
        isVerified: false,
        tradeAction: true
      },
      {
        id: "user_zz_5",
        email: "zz@gmail.com",
        fullName: "Zz",
        balance: 0,
        role: "user",
        verificationStatus: "unsubmitted",
        isVerified: false,
        tradeAction: true
      },
      {
        id: "user_vv_6",
        email: "vv@gmail.com",
        fullName: "Vv",
        balance: 0,
        role: "user",
        verificationStatus: "unsubmitted",
        isVerified: false,
        tradeAction: true
      }
    ];

    const map = new Map();
    users.forEach(u => map.set(u.email?.toLowerCase() || u.id, u));
    defaultSeedUsers.forEach(u => {
      if (!map.has(u.email.toLowerCase())) {
        map.set(u.email.toLowerCase(), u);
      }
    });

    res.json({ users: Array.from(map.values()) });
  } catch (error) {
    res.json({ users: [] });
  }
});

app.get("/api/users/profile", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid || typeof uid !== "string") return res.status(400).json({ error: "Missing uid" });
    if (db) {
      const docRef = db.collection("users").doc(uid);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return res.json({ profile: { id: docSnap.id, ...docSnap.data() } });
      } else {
        const defaultProfile = {
          id: uid,
          email: "",
          fullName: "User",
          balance: 0,
          role: "user",
          verificationStatus: "unsubmitted",
          isVerified: false,
          tradeAction: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await docRef.set(defaultProfile);
        return res.json({ profile: defaultProfile });
      }
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/users/upsert", async (req, res) => {
  try {
    const { uid, email, fullName, balance, role, verificationStatus, isVerified, tradeAction } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });
    if (db) {
      const docRef = db.collection("users").doc(uid);
      const docSnap = await docRef.get();
      const existing = docSnap.exists ? docSnap.data() : {};
      const isAdmin = email === "habeshatilaye@gmail.com";

      const profileData = {
        id: uid,
        email,
        fullName: fullName || existing?.fullName || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""),
        address: existing?.address || "",
        phoneNumber: existing?.phoneNumber || "",
        verificationDoc: existing?.verificationDoc || null,
        balance: balance !== undefined ? balance : (existing?.balance !== undefined ? existing?.balance : (isAdmin ? 31050 : 0)),
        role: role || existing?.role || (isAdmin ? "admin" : "user"),
        createdAt: existing?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        verificationStatus: verificationStatus || existing?.verificationStatus || (isAdmin ? "verified" : "unsubmitted"),
        isVerified: isVerified !== undefined ? isVerified : (isAdmin ? true : (existing?.isVerified !== undefined ? existing.isVerified : false)),
        tradeAction: tradeAction !== undefined ? tradeAction : (existing?.tradeAction !== undefined ? existing.tradeAction : true)
      };

      await docRef.set(profileData, { merge: true });
      return res.json({ success: true, profile: profileData });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

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
      decodedToken = decodeJWT(token);
    }

    if (!decodedToken || (decodedToken.email !== "habeshatilaye@gmail.com" && decodedToken.email !== "bamanejigu112@gmail.com")) {
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
    } catch (authError: any) {
      console.warn(`Auth credential deletion skipped for ${uid}:`, authError?.message);
    }
    res.json({ success: true, authDeleted });
  } catch (error) {
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
      decodedToken = decodeJWT(token);
    }

    if (!decodedToken || (decodedToken.email !== "habeshatilaye@gmail.com" && decodedToken.email !== "bamanejigu112@gmail.com")) {
      return res.status(403).json({ error: "Forbidden: Admin access only" });
    }

    let usersToDelete: string[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
      do {
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
        listUsersResult.users.forEach((userRecord) => {
          if (userRecord.email && userRecord.email.toLowerCase() !== "habeshatilaye@gmail.com" && userRecord.email.toLowerCase() !== "bamanejigu112@gmail.com") {
            usersToDelete.push(userRecord.uid);
          }
        });
        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken);
    } catch (authError) {
      return res.json({
        success: true,
        deletedCount: 0,
        apiRestricted: true,
        message: "Identity Toolkit API restricted or disabled."
      });
    }

    if (usersToDelete.length > 0) {
      const deleteUsersResult = await admin.auth().deleteUsers(usersToDelete);
      res.json({ 
        success: true, 
        deletedCount: deleteUsersResult.successCount, 
        failedCount: deleteUsersResult.failureCount 
      });
    } else {
      res.json({ success: true, deletedCount: 0, message: "No non-admin accounts found." });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

app.post("/api/admin/update-balance", async (req, res) => {
  try {
    const { userId, amount, mode } = req.body;
    if (!userId || amount === undefined) return res.status(400).json({ error: "Missing fields" });
    if (db) {
      const docRef = db.collection("users").doc(userId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.status(404).json({ error: "User not found" });
      const current = docSnap.data()?.balance || 0;
      let newBalance = current;
      if (mode === 'add') newBalance += Number(amount);
      else if (mode === 'subtract') newBalance -= Number(amount);
      else if (mode === 'set') newBalance = Number(amount);

      newBalance = Math.max(0, newBalance);
      await docRef.update({ balance: newBalance });
      return res.json({ success: true, balance: newBalance });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/trade/settle", async (req, res) => {
  try {
    const { uid, amount, seconds, symbol } = req.body;
    if (!uid || !amount || !seconds || !symbol) return res.status(400).json({ error: "Missing fields" });
    if (db) {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return res.status(404).json({ error: "User not found" });
      const userData = userSnap.data()!;

      const isWin = userData.tradeAction !== undefined ? userData.tradeAction : Math.random() > 0.5;
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

      const currentBalance = userData.balance || 0;
      const updatedBalance = Math.max(0, currentBalance - amount + finalAmount);
      await userRef.update({ balance: updatedBalance });

      const txRef = db.collection("transactions").doc();
      const txData = {
        id: txRef.id,
        userId: uid,
        userEmail: userData.email || "",
        type: "trade",
        amount: isWin ? finalAmount : amount * lossPercent,
        status: "completed",
        symbol,
        details: `${isWin ? "WIN" : "LOSS"} | Asset: ${symbol.split(":").pop()} | ${seconds}s Duration | ${isWin ? "Profit: " + (returnPercent * 100).toFixed(0) + "%" : "Loss: " + (lossPercent * 100).toFixed(0) + "%"}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await txRef.set(txData);

      return res.json({
        success: true,
        isWin,
        finalAmount,
        profit: profitVal,
        percentage,
        entryPrice,
        exitPrice,
        totalReturn,
        balance: updatedBalance,
        profile: { ...userData, balance: updatedBalance }
      });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/deposit", async (req, res) => {
  try {
    const { uid, amount, receipt } = req.body;
    if (!uid || amount === undefined || isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
    if (db) {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data()! : { balance: 0, email: "" };

      const newBalance = (userData.balance || 0) + Number(amount);
      await userRef.set({
        balance: newBalance,
        isVerified: true,
        verificationStatus: "verified",
        tradeAction: true
      }, { merge: true });

      const txRef = db.collection("transactions").doc();
      const txData = {
        id: txRef.id,
        userId: uid,
        userEmail: userData.email || "",
        type: "deposit",
        amount: Number(amount),
        status: "completed",
        receipt: receipt || "deposit_payment",
        details: "Deposit / Upgrade payment verified successfully",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await txRef.set(txData);

      return res.json({ success: true, balance: newBalance });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid || typeof uid !== "string") return res.status(400).json({ error: "Missing uid" });
    if (db) {
      const snap = await db.collection("transactions").where("userId", "==", uid).get();
      const transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ transactions });
    }
    res.json({ transactions: [] });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/users/verify", async (req, res) => {
  try {
    const { uid, fullName, phoneNumber, address, verificationDoc } = req.body;
    if (!uid || !fullName || !address) {
      return res.status(400).json({ error: "Missing required verification fields" });
    }
    if (db) {
      const docRef = db.collection("users").doc(uid);
      const docSnap = await docRef.get();
      const existing = docSnap.exists ? docSnap.data() : {};
      
      const profileData = {
        ...existing,
        id: uid,
        email: existing?.email || "",
        fullName,
        phoneNumber: phoneNumber || existing?.phoneNumber || "",
        address,
        verificationDoc: verificationDoc || existing?.verificationDoc || null,
        balance: existing?.balance !== undefined ? existing.balance : 0,
        role: existing?.role || "user",
        createdAt: existing?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        verificationStatus: "pending",
        isVerified: false,
        tradeAction: existing?.tradeAction !== undefined ? existing.tradeAction : true
      };

      await docRef.set(profileData, { merge: true });
      return res.json({ success: true, profile: profileData });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

function decodeJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

app.post("/api/admin/verify-user", async (req, res) => {
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
      decodedToken = decodeJWT(token);
    }

    if (!decodedToken || (decodedToken.email !== "habeshatilaye@gmail.com" && decodedToken.email !== "bamanejigu112@gmail.com")) {
      return res.status(403).json({ error: "Forbidden: Admin access only" });
    }

    const { userId, status } = req.body;
    if (!userId || !status || (status !== "verified" && status !== "rejected")) {
      return res.status(400).json({ error: "Missing or invalid userId or status" });
    }

    if (db) {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      await userRef.update({
        verificationStatus: status,
        isVerified: status === "verified"
      });
      return res.json({ success: true, status });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    console.error("Error in /api/admin/verify-user:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

app.post("/api/admin/toggle-role", async (req, res) => {
  try {
    const { userId } = req.body;
    if (db) {
      const ref = db.collection("users").doc(userId);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "User not found" });
      const currentRole = snap.data()?.role || "user";
      const newRole = currentRole === "admin" ? "user" : "admin";
      await ref.update({ role: newRole });
      return res.json({ success: true, role: newRole });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/admin/toggle-trade-action", async (req, res) => {
  try {
    const { userId } = req.body;
    if (db) {
      const ref = db.collection("users").doc(userId);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "User non-existent" });
      const current = snap.data()?.tradeAction;
      const nextVal = current === undefined ? false : !current;
      await ref.update({ tradeAction: nextVal });
      return res.json({ success: true, tradeAction: nextVal });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/upload", (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: "Missing base64" });
    res.json({ url: base64 });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/withdraw", async (req, res) => {
  try {
    const { uid, email, amount, withdrawName, withdrawAddress, withdrawType } = req.body;
    if (!uid || amount === undefined || isNaN(amount) || amount <= 0 || !withdrawName || !withdrawAddress) {
      return res.status(400).json({ error: "Missing required withdrawal fields or invalid amount" });
    }

    if (db) {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data()! : { balance: 0, email: email || "" };
      const currentBalance = userData.balance !== undefined ? Number(userData.balance) : 0;

      if (currentBalance < Number(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const newBalance = Number((currentBalance - Number(amount)).toFixed(2));
      const fullName = withdrawName.trim() || userData.fullName || "User";

      await userRef.set({ balance: newBalance, fullName }, { merge: true });

      const txRef = db.collection("transactions").doc();
      const tx = {
        id: txRef.id,
        userId: uid,
        userEmail: email || userData.email || "",
        userName: fullName,
        type: "withdraw",
        amount: Number(amount),
        status: "pending",
        details: `Name: ${fullName} | Wallet: ${withdrawAddress.trim()} | Network: ${withdrawType || "USDT"}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await txRef.set(tx);

      return res.json({ success: true, balance: newBalance, transaction: tx, profile: { ...userData, balance: newBalance, fullName } });
    }
    res.status(500).json({ error: "Database unavailable" });
  } catch (error) {
    console.error("Error in /api/withdraw:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal error" });
  }
});

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default function handler(req: any, res: any) {
  return app(req, res);
}
