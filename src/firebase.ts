import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { OperationType, FirestoreErrorInfo } from "./types";

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with settings for optimal connection stability and fallback in sandbox environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth();

export { OperationType };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.warn('Firestore Error Handled Gracefully: ', JSON.stringify(errInfo));
  // Do not throw error so application continues functioning without interruption
}

// Validate Connection & Auto-Seed Collections
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "settings", "addresses"));
    console.log("Firestore connection test: SUCCESS");
  } catch (error) {
    console.log("Firestore initialized in local/offline mode.");
  }
}
testConnection();

async function seedDatabase() {
  try {
    const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
    
    // Seed default settings/addresses if not exists
    const settingsRef = doc(db, "settings", "addresses");
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        btc_address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        eth_address: "0x71C_Gammixtrades_Institutional_Vault",
        sol_address: "GammixtradesSolVault1111111111111111111111",
        bnb_address: "0x71C_Gammixtrades_Institutional_Vault",
        xrp_address: "rGammixtradesVaultXRP1111111111111111",
        usdt_address: "0x71C_Gammixtrades_Institutional_Vault"
      }, { merge: true });
    }

    // Seed default admin profile if not exists
    const adminRef = doc(db, "users", "admin_girmaeden37");
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        id: "admin_girmaeden37",
        email: "girmaeden37@gmail.com",
        fullName: "System Administrator",
        balance: 31050,
        role: "admin",
        verificationStatus: "verified",
        isVerified: true,
        tradeAction: true,
        createdAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (seedErr) {
    console.warn("Database seed warning:", seedErr);
  }
}
seedDatabase();

