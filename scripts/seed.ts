import admin from "firebase-admin";
import fs from "fs";
import path from "path";

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : { projectId: "gammixtrades" };

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId || "gammixtrades"
    });
  }

  const db = admin.firestore();

  async function runSeed() {
    console.log("Seeding Firestore database...");

    // 1. Seed settings
    await db.collection("settings").doc("addresses").set({
      btc_address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      eth_address: "0x71C_Gammixtrades_Institutional_Vault",
      sol_address: "GammixtradesSolVault1111111111111111111111",
      bnb_address: "0x71C_Gammixtrades_Institutional_Vault",
      xrp_address: "rGammixtradesVaultXRP1111111111111111",
      usdt_address: "0x71C_Gammixtrades_Institutional_Vault"
    }, { merge: true });

    // 2. Seed test users matching user's exact screenshot schema
    const testUsers = [
      {
        uid: "H9DV3iLZdMm2O2G1ANlrAlVQW5v1",
        email: "tomtom47a@gmail.com",
        fullName: "Tom",
        phoneNumber: "+251900835070",
        role: "user",
        balance: 1000,
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        uid: "admin_girma_uid_37",
        email: "girmaeden37@gmail.com",
        fullName: "Girma Eden",
        phoneNumber: "+251911223344",
        role: "admin",
        balance: 31050,
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const u of testUsers) {
      await db.collection("users").doc(u.uid).set(u, { merge: true });
      console.log(`Seeded user: ${u.email} (${u.uid})`);
    }

    console.log("Firestore seeding completed successfully!");
    process.exit(0);
  }

  runSeed();
} catch (err) {
  console.error("Seeding error:", err);
  process.exit(1);
}
