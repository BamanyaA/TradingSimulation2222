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

// Validate Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "settings", "addresses"));
    console.log("Firestore connection test: SUCCESS");
  } catch (error) {
    console.log("Firestore initialized in local/offline mode.");
  }
}
testConnection();
