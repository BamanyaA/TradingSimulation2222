export type UserRole = "user" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  address: string;
  phoneNumber: string;
  verificationDoc?: string; // Base64 or URL
  balance: number;
  role: UserRole;
  createdAt: any; // Firestore Timestamp
  isVerified?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected" | "unsubmitted";
  tradeAction?: boolean; // true = profit (ON), false = lose (OFF)
}

export type TransactionType = "deposit" | "trade" | "withdraw";
export type TransactionStatus = "pending" | "completed" | "failed";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  createdAt: any;
  details?: string;
  symbol?: string;
  receipt?: string; // Base64 or URL
  userEmail?: string;
  userName?: string;
}

export interface PlatformSettings {
  btc_address: string;
  eth_address: string;
  sol_address: string;
  bnb_address: string;
  xrp_address: string;
  usdt_address: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  senderId: string;
  senderEmail?: string;
  text: string;
  isAdmin: boolean;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
