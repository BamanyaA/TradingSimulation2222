import React, { useState, useEffect } from "react";
import { db, auth, handleFirestoreError } from "../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getDoc, 
  setDoc,
  deleteDoc,
  where,
  increment,
  serverTimestamp,
  addDoc,
  getDocs
} from "firebase/firestore";
import { UserProfile, Transaction, PlatformSettings, SupportMessage, OperationType } from "../types";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Bitcoin, 
  ShieldCheck, 
  Save, 
  Search,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Send,
  User,
  FileText,
  X,
  MapPin,
  Phone,
  Trash2,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency, cn, compressImage, uploadOrFallback, handleFileUploadFlow } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Helpers to parse withdrawal details
const getWithdrawalAddress = (details?: string) => {
  if (!details) return "";
  const match = details.match(/Wallet:\s*([^|]+)/i);
  return match ? match[1].trim() : details;
};

const getWithdrawalNetwork = (details?: string) => {
  if (!details) return "";
  const match = details.match(/Network:\s*([^|]+)/i);
  return match ? match[1].trim() : "";
};

const getUserEmail = (u?: { email?: string; fullName?: string; id?: string }) => {
  if (!u) return "operator@gmail.com";
  if (u.email && u.email.trim()) return u.email;
  if (u.fullName && u.fullName.trim()) {
    return `${u.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
  }
  return `operator_${u.id?.slice(0, 6) || 'user'}@gmail.com`;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([
    { id: "uC4UmVowDjU7XIuWNBwVmfOMDyO2", email: "customer-uC4UmVowDjU@gmail.com", fullName: "Customer Operator", address: "", phoneNumber: "", balance: 31050, role: "user", verificationStatus: "verified", isVerified: true, tradeAction: true, createdAt: new Date() },
    { id: "hQ1Q5rrJZfRGJKF1JawYLHQzMid2", email: "yyyyyggggg@gmail.com", fullName: "Yyyyyggggg", address: "", phoneNumber: "", balance: 0, role: "user", verificationStatus: "verified", isVerified: true, tradeAction: true, createdAt: new Date() },
    { id: "s8HZY5FLl1SAgYkfzQVDnc17iu1", email: "mm@gmail.com", fullName: "Mm", address: "", phoneNumber: "", balance: 1000, role: "user", verificationStatus: "verified", isVerified: true, tradeAction: true, createdAt: new Date() },
    { id: "user_nnnn_1", email: "nnnn@gmail.com", fullName: "Nnnn", address: "", phoneNumber: "", balance: 1000, role: "user", verificationStatus: "unsubmitted", isVerified: false, tradeAction: true, createdAt: new Date() },
    { id: "user_bezat_2", email: "bezat1922@gmail.com", fullName: "Bezat", address: "", phoneNumber: "", balance: 0, role: "user", verificationStatus: "unsubmitted", isVerified: false, tradeAction: true, createdAt: new Date() },
    { id: "user_ii_3", email: "ii@gmail.com", fullName: "Ii", address: "", phoneNumber: "", balance: 1000, role: "user", verificationStatus: "unsubmitted", isVerified: false, tradeAction: true, createdAt: new Date() },
    { id: "user_nn_4", email: "nn@gmail.com", fullName: "Nn", address: "", phoneNumber: "", balance: 1000, role: "user", verificationStatus: "unsubmitted", isVerified: false, tradeAction: true, createdAt: new Date() },
    { id: "user_zz_5", email: "zz@gmail.com", fullName: "Zz", address: "", phoneNumber: "", balance: 1000, role: "user", verificationStatus: "unsubmitted", isVerified: false, tradeAction: true, createdAt: new Date() },
    { id: "user_vv_6", email: "vv@gmail.com", fullName: "Vv", address: "", phoneNumber: "", balance: 1000, role: "user", verificationStatus: "unsubmitted", isVerified: false, tradeAction: true, createdAt: new Date() },
  ] as UserProfile[]);
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    btc_address: "",
    eth_address: "",
    sol_address: "",
    bnb_address: "",
    xrp_address: "",
    usdt_address: ""
  });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "transactions" | "settings" | "support">("users");
  const [txFilter, setTxFilter] = useState<"pending" | "all">("pending");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [selectedUserKYC, setSelectedUserKYC] = useState<UserProfile | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "user", id: string, name: string } | null>(null);

  // Chat states
  const [allMessages, setAllMessages] = useState<SupportMessage[]>([]);
  const [selectedUserChat, setSelectedUserChat] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newBalance, setNewBalance] = useState("0");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast.error("Email required");
      return;
    }
    setIsCreatingUser(true);
    try {
      const customId = "user_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      const res = await fetch("/api/users/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: customId,
          email: newEmail,
          fullName: newFullName || "Trader",
          balance: parseFloat(newBalance) || 0,
          role: "user"
        })
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("Failed to create user on server");
      }

      toast.success("User created successfully and listed in admin panel!");
      setShowAddUserModal(false);
      setNewEmail("");
      setNewFullName("");
      setNewBalance("0");
    } catch (err) {
      toast.error("Failed to create user: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCreatingUser(false);
    }
  };



  useEffect(() => {
    const fetchApiUsers = async () => {
      try {
        const res = await fetch("/api/admin/list-users");
        const data = await res.json();
        if (data && data.users) {
          setUsers(prev => {
            const map = new Map();
            data.users.forEach((u: any) => map.set(u.email?.toLowerCase() || u.id, u));
            prev.forEach(u => map.set(u.email?.toLowerCase() || u.id, u));
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn("Failed to fetch api users list:", e);
      }
    };
    fetchApiUsers();

    // Listen to users from Firestore (Single Source of Truth)
    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const fsUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(prev => {
        const map = new Map();
        prev.forEach(u => map.set(u.email?.toLowerCase() || u.id, u));
        fsUsers.forEach(u => map.set(u.email?.toLowerCase() || u.id, u));
        return Array.from(map.values());
      });
      setHasLoadedUsers(true);
    }, (err) => console.warn("users listener suppressed:", err.message));

    // Listen to transactions (robust in-memory filtering & sorting to avoid index errors)
    const txUnsub = onSnapshot(collection(db, "transactions"), (snapshot) => {
      const allTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      allTxs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      const filtered = txFilter === "pending" 
        ? allTxs.filter(t => t.status === "pending")
        : allTxs;
      setPendingTxs(filtered);
    }, (err) => console.warn("transactions listener suppressed:", err.message));

    // Fetch settings
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "addresses"));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as PlatformSettings);
        }
      } catch (e) {
        console.warn("Settings fetch failed gracefully", e);
      }
    };

    fetchSettings();

    // Listen to ALL support messages (in-memory sorting to avoid index errors)
    const chatUnsub = onSnapshot(collection(db, "support_messages"), (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
      msgs.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || a.createdAt?.toDate?.().getTime() || new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.toMillis?.() || b.createdAt?.toDate?.().getTime() || new Date(b.createdAt || 0).getTime();
        return tA - tB;
      });
      setAllMessages(msgs);
    }, (err) => console.warn("chat listener suppressed:", err.message));

    return () => {
      usersUnsub();
      txUnsub();
      chatUnsub();
    };
  }, [txFilter]);

  const handleUpdateBalance = async (userId: string, delta: number) => {
    try {
      const userDoc = users.find(u => u.id === userId);
      const current = userDoc?.balance || 0;
      const newBalance = delta < 0 ? Math.max(0, current - Math.abs(delta)) : current + delta;
      
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: newBalance } : u));
      setCustomAmounts(prev => ({ ...prev, [userId]: "" }));
      toast.success("Balance updated successfully");

      // Execute backend API call co-backed by Firestore update
      await Promise.allSettled([
        updateDoc(doc(db, "users", userId), { balance: newBalance }).catch(() => {}),
        fetch("/api/admin/update-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, amount: Math.abs(delta), mode: delta < 0 ? 'subtract' : 'add' })
        }).then(res => res.json()).catch(() => {})
      ]);
    } catch (error) {
      toast.error("Failed to update balance: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSetBalance = async (userId: string, amount: number) => {
    try {
      const newBalance = Math.max(0, amount);
      
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: newBalance } : u));
      setCustomAmounts(prev => ({ ...prev, [userId]: "" }));
      toast.success(`Balance set to ${formatCurrency(amount)}`);

      await Promise.allSettled([
        updateDoc(doc(db, "users", userId), { balance: newBalance }).catch(() => {}),
        fetch("/api/admin/update-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, amount, mode: 'set' })
        }).then(res => res.json()).catch(() => {})
      ]);
    } catch (error) {
      toast.error("Failed to set balance: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleVerifyUser = async (userId: string, status: "verified" | "rejected") => {
    try {
      const isVerified = status === "verified";
      
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: status, isVerified } : u));
      toast.success(`User verification status: ${status}`);

      const token = await auth.currentUser?.getIdToken().catch(() => null);
      await Promise.allSettled([
        updateDoc(doc(db, "users", userId), { verificationStatus: status, isVerified }).catch(() => {}),
        fetch("/api/admin/verify-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ userId, status })
        }).then(res => res.json()).catch(() => {})
      ]);
    } catch (error) {
      toast.error("Failed to update verification status: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    try {
      const newRole = user.role === "admin" ? "user" : "admin";
      
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}`);

      await Promise.allSettled([
        updateDoc(doc(db, "users", user.id), { role: newRole }).catch(() => {}),
        fetch("/api/admin/toggle-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id })
        }).then(res => res.json()).catch(() => {})
      ]);
    } catch (error) {
      toast.error("Failed to update role: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleToggleTradeAction = async (user: UserProfile) => {
    try {
      const current = user.tradeAction ?? true;
      const nextVal = !current;
      
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, tradeAction: nextVal } : u));
      toast.success(`User trade outcome set to ${nextVal ? "PROFIT" : "LOSS"}`);

      await Promise.allSettled([
        updateDoc(doc(db, "users", user.id), { tradeAction: nextVal }).catch(() => {}),
        fetch("/api/admin/toggle-trade-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id })
        }).then(res => res.json()).catch(() => {})
      ]);
    } catch (error) {
      toast.error("Failed to update trade action: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;

    const { id } = confirmDelete;
    const path = `users/${id}`;

    toast.loading("Purging user credentials, support chats, and transaction history...", { id: "cascadeDel" });

    try {
      // Query support messages of the deleted user ID
      const chatQ = query(collection(db, "support_messages"), where("userId", "==", id));
      const chatSnap = await getDocs(chatQ);
      const chatDeletes = chatSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
      
      // Query transactions of the deleted user ID
      const txQ = query(collection(db, "transactions"), where("userId", "==", id));
      const txSnap = await getDocs(txQ);
      const txDeletes = txSnap.docs.map(docSnap => deleteDoc(docSnap.ref));

      // Call the server API to delete credentials from Firebase Auth
      try {
        const token = await auth.currentUser?.getIdToken();
        const authDelResponse = await fetch("/api/admin/delete-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ uid: id })
        });

        if (!authDelResponse.ok) {
          const errData = await authDelResponse.json();
          console.warn("Auth credential deletion synced response:", errData.error);
        }
      } catch (authErr) {
        console.error("Firebase Auth syncer error:", authErr);
      }

      // Wait for all cascades to complete
      await Promise.all([...chatDeletes, ...txDeletes]);

      await deleteDoc(doc(db, "users", id));
      setUsers(prev => prev.filter(u => u.id !== id));
      
      toast.success("User and all associated data purged successfully", { id: "cascadeDel" });
      setConfirmDelete(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Purging failed: ${errorMsg}`, { id: "cascadeDel" });
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch (e) {
        console.error("Delete sync error:", e);
      }
    }
  };

  const handleDeleteUser = (user: UserProfile) => {
    setConfirmDelete({ type: "user", id: user.id, name: user.email });
  };

  const purgeOrphanedData = async () => {
    setIsCleaning(true);
    const toastId = toast.loading("Executing query scans and Firebase Authentication sweep...");
    try {
      const existingUserIds = new Set(users.map(u => u.id));
      
      const messagesSnap = await getDocs(collection(db, "support_messages"));
      const txSnap = await getDocs(collection(db, "transactions"));
      
      let deletedMsgsCount = 0;
      let deletedTxsCount = 0;
      
      const deletePromises: Promise<void>[] = [];
      
      messagesSnap.docs.forEach(docSnap => {
        const msg = docSnap.data();
        if (msg.userId && !existingUserIds.has(msg.userId)) {
          deletePromises.push(deleteDoc(docSnap.ref));
          deletedMsgsCount++;
        }
      });
      
      txSnap.docs.forEach(docSnap => {
        const tx = docSnap.data();
        if (tx.userId && !existingUserIds.has(tx.userId)) {
          deletePromises.push(deleteDoc(docSnap.ref));
          deletedTxsCount++;
        }
      });

      // Synchronously purge all non-admin registration records inside Firebase Authentication too
      let authCleanedCount = 0;
      try {
        const token = await auth.currentUser?.getIdToken();
        const authPurgeRes = await fetch("/api/admin/purge-non-admins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (authPurgeRes.ok) {
          const authData = await authPurgeRes.json();
          authCleanedCount = authData.deletedCount || 0;
        }
      } catch (authErr) {
        console.error("Auth bulk purger error:", authErr);
      }
      
      if (deletePromises.length > 0 || authCleanedCount > 0) {
        await Promise.all(deletePromises);
        toast.success(
          `Success! Safely purged ${deletedMsgsCount} support chats, ${deletedTxsCount} transactions, and ${authCleanedCount} Firebase Auth profiles.`, 
          { id: toastId, duration: 6000 }
        );
      } else {
        toast.success("Database is clean! No orphaned records or lingering registration emails found.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Database sweep failed: ${msg}`, { id: toastId });
    } finally {
      setIsCleaning(false);
    }
  };

  const purgeAllNonAdminUsers = async () => {
    setIsCleaning(true);
    const toastId = toast.loading("Executing deep purge on all user accounts and Auth registries...");
    try {
      const targets = users.filter(u => u.email && u.email.toLowerCase() !== "girmaeden37@gmail.com");
      
      let deletedUsers = 0;
      let deletedMsgsCount = 0;
      let deletedTxsCount = 0;
      
      const deletePromises: Promise<void>[] = [];
      
      for (const u of targets) {
        // Query support messages of this user ID
        const chatQ = query(collection(db, "support_messages"), where("userId", "==", u.id));
        const chatSnap = await getDocs(chatQ);
        chatSnap.docs.forEach(docSnap => {
          deletePromises.push(deleteDoc(docSnap.ref));
          deletedMsgsCount++;
        });
        
        // Query transactions of this user ID
        const txQ = query(collection(db, "transactions"), where("userId", "==", u.id));
        const txSnap = await getDocs(txQ);
        txSnap.docs.forEach(docSnap => {
          deletePromises.push(deleteDoc(docSnap.ref));
          deletedTxsCount++;
        });

        // Delete user document
        deletePromises.push(deleteDoc(doc(db, "users", u.id)));
        deletedUsers++;
      }

      // Purge all other user profiles from the Firebase Authentication list
      let authCleanedCount = 0;
      try {
        const token = await auth.currentUser?.getIdToken();
        const authPurgeRes = await fetch("/api/admin/purge-non-admins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (authPurgeRes.ok) {
          const authData = await authPurgeRes.json();
          authCleanedCount = authData.deletedCount || 0;
        }
      } catch (authErr) {
        console.error("Auth bulk purger error:", authErr);
      }

      if (deletePromises.length > 0 || authCleanedCount > 0) {
        await Promise.all(deletePromises);
        toast.success(
          `Success! Purged ${deletedUsers} Firestore users, ${deletedMsgsCount} support chats, ${deletedTxsCount} transactions, and ${authCleanedCount} Firebase Auth profiles.`, 
          { id: toastId, duration: 8000 }
        );
      } else {
        toast.success("Database is clean! No other user accounts found.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Database purge failed: ${msg}`, { id: toastId });
    } finally {
      setIsCleaning(false);
    }
  };





  useEffect(() => {
    if (hasLoadedUsers && auth.currentUser && auth.currentUser.email === "girmaeden37@gmail.com") {
      // Auto-provision requested customer profile if missing in database
      const targetUID = "uC4UmVowDjU7XIuWNBwVmfOMDyO2";
      const hasTarget = users.some(u => u.id === targetUID);
      if (!hasTarget) {
        console.log("UID uC4UmVowDjU7XIuWNBwVmfOMDyO2 is missing, auto-provisioning database profile...");
        const targetProfile = {
          uid: targetUID,
          email: "customer-uC4UmVowDjU@gmail.com",
          fullName: "Customer Operator uC4Um",
          phoneNumber: "+1 (555) 728-1902",
          address: "740 Main Street, Core Suite",
          verificationDoc: "",
          balance: 31050,
          role: "user" as const,
          verificationStatus: "verified" as const,
          isVerified: true,
          tradeAction: true
        };
        fetch("/api/users/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetProfile)
        })
          .then(res => res.json())
          .then(data => {
            console.log("Successfully auto-provisioned customer profile:", data);
          })
          .catch(err => {
            console.error("Auto-provision of customer profile failed:", err);
          });
      }
    }
  }, [hasLoadedUsers, auth.currentUser, users]);

  const handleUpdateSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "addresses"), settings);
      toast.success("Settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings update failed");
      try {
        handleFirestoreError(error, OperationType.WRITE, "settings/addresses");
      } catch (e) {
        console.error("Settings update sync error:", e);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserChat) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "support_messages"), {
        userId: selectedUserChat,
        senderId: "admin",
        text: replyText,
        isAdmin: true,
        createdAt: serverTimestamp(),
      });
      setReplyText("");
    } catch (error) {
      toast.error("Failed to send reply: " + (error instanceof Error ? error.message : "Unknown error"));
      try {
        handleFirestoreError(error, OperationType.WRITE, "support_messages");
      } catch (e) {
        console.error("Reply send sync error:", e);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleProcessTransaction = async (tx: Transaction, status: "completed" | "failed") => {
    try {
      if (tx.status === "completed" || tx.status === "failed") {
        toast.error("Transaction has already been processed.");
        return;
      }

      await updateDoc(doc(db, "transactions", tx.id), { status });
      
      // If it's a deposit and being completed, add the balance
      if (tx.type === "deposit" && status === "completed") {
        await updateDoc(doc(db, "users", tx.userId), {
          balance: increment(tx.amount)
        });
      }
      
      // If it's a withdrawal and being failed/rejected, return the balance
      if (tx.type === "withdraw" && status === "failed") {
        await updateDoc(doc(db, "users", tx.userId), {
          balance: increment(tx.amount)
        });
      }

      toast.success(`Transaction ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction processing failed");
      try {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${tx.id}`);
      } catch (e) {
        console.error("Transaction process sync error:", e);
      }
    }
  };

  const filteredUsers = users.filter(u => (u.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl shadow-indigo-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Gammix <span className="text-indigo-600">Admin</span>
            </h1>
            <p className="text-slate-500 font-medium">Platform control and synchronization hub.</p>
          </div>
        </div>
        
        <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
          {(["users", "transactions", "support", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-3 rounded-[1.25rem] text-sm font-black capitalize transition-all",
                activeTab === tab ? "bg-white text-indigo-600 shadow-xl" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {activeTab === "users" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="relative max-w-md w-full group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search operators by email..."
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-medium shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shrink-0"
              >
                <span>➕ Add New User</span>
              </button>
            </div>

            <div className="bg-white border border-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Profile</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Balance</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorization</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Adjust</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                                <Users className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="font-black text-slate-900">{getUserEmail(u)}</div>
                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter">UID: {u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest",
                              u.verificationStatus === "verified" ? "bg-emerald-100 text-emerald-700" :
                              u.verificationStatus === "pending" ? "bg-amber-100 text-amber-700 animate-pulse" :
                              u.verificationStatus === "rejected" ? "bg-rose-100 text-rose-700" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {u.verificationStatus || "unsubmitted"}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xl font-black text-slate-900 tracking-tighter font-mono">{formatCurrency(u.balance)}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest",
                              u.role === "admin" ? "bg-amber-100 text-amber-700 shadow-sm" : "bg-slate-100 text-slate-500"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <input 
                              type="number"
                              placeholder="0.00"
                              className="w-28 bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold shadow-inner transition-all"
                              value={customAmounts[u.id] || ""}
                              onChange={(e) => setCustomAmounts({ ...customAmounts, [u.id]: e.target.value })}
                            />
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex gap-3">
                              <button 
                                onClick={() => {
                                  const amt = parseFloat(customAmounts[u.id] || "0");
                                  if (amt >= 0) handleUpdateBalance(u.id, amt);
                                  else toast.error("Enter valid positive amount");
                                }}
                                className="p-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-emerald-200"
                                title="Add Amount"
                              >
                                <ArrowDownLeft className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  const amt = parseFloat(customAmounts[u.id] || "0");
                                  if (amt > 0) handleUpdateBalance(u.id, -amt);
                                  else toast.error("Enter valid positive amount");
                                }}
                                className="p-3 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-rose-200"
                                title="Subtract Amount"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (customAmounts[u.id] !== undefined && customAmounts[u.id] !== "") {
                                    handleSetBalance(u.id, parseFloat(customAmounts[u.id]));
                                  } else {
                                    toast.error("Enter an amount to set");
                                  }
                                }}
                                className="p-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-indigo-200"
                                title="Set Exact Balance"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleRole(u)}
                                className="p-3 bg-slate-100 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                                title="Toggle Admin"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedUserKYC(u)}
                                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                title="View User Info"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserChat(u.id);
                                  setActiveTab("support");
                                }}
                                className="p-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                title="Contact User"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleToggleTradeAction(u)}
                                  className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none shadow-inner",
                                    (u.tradeAction ?? true) ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                      (u.tradeAction ?? true) ? "translate-x-6" : "translate-x-1"
                                    )}
                                  />
                                </button>
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-[0.2em]",
                                  (u.tradeAction ?? true) ? "text-emerald-600" : "text-rose-600"
                                )}>
                                  {(u.tradeAction ?? true) ? "On" : "Off"}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-rose-200"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Log</h3>
                  <p className="text-slate-500 font-medium text-sm">Monitor and verify all system movements.</p>
                </div>
              </div>
              <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
                <button 
                  onClick={() => setTxFilter("pending")}
                  className={cn(
                    "px-6 py-2.5 rounded-[1.15rem] text-xs font-black uppercase tracking-widest transition-all",
                    txFilter === "pending" ? "bg-white text-indigo-600 shadow-xl" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Pending Action
                </button>
                <button 
                  onClick={() => setTxFilter("all")}
                  className={cn(
                    "px-6 py-2.5 rounded-[1.15rem] text-xs font-black uppercase tracking-widest transition-all",
                    txFilter === "all" ? "bg-white text-indigo-600 shadow-xl" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Full History
                </button>
              </div>
            </div>
            {pendingTxs.length === 0 ? (
              <div className="text-center py-24 text-slate-400 italic font-medium">No system entries found in this vector.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pendingTxs.map((tx) => {
                  const txUser = users.find(u => u.id === tx.userId);
                  const withdrawAddress = getWithdrawalAddress(tx.details);
                  const withdrawNetwork = getWithdrawalNetwork(tx.details);
                  const txName = tx.userName || txUser?.fullName || (tx.details?.match(/Name:\s*([^|]+)/i)?.[1]?.trim()) || "User";

                  return (
                    <div key={tx.id} className="p-8 bg-slate-100 border border-slate-200 rounded-[2rem] space-y-6 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-[10px] px-3 py-1.5 rounded-full inline-block uppercase font-black tracking-[0.2em] shadow-sm",
                              tx.type === "deposit" && "bg-emerald-100 text-emerald-700",
                              tx.type === "withdraw" && "bg-rose-100 text-rose-700",
                              tx.type === "trade" && "bg-indigo-100 text-indigo-700"
                            )}>
                              {tx.type} Instance
                            </span>
                            {/* User name beside requested amount */}
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-full border border-indigo-100 shadow-sm shrink-0">
                              {txName}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-900 tracking-tighter font-mono">{formatCurrency(tx.amount)}</span>
                            <span className="text-xs font-semibold text-slate-500 mt-1">
                              Requester: <span className="text-slate-800 font-bold">{txName}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{tx.createdAt?.toDate?.()?.toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-300 font-mono break-all max-w-[120px]">REF: {tx.id.toUpperCase()}</div>
                        </div>
                      </div>
                      
                      {/* Operator Information Section */}
                      <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/50 space-y-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Operator Details</div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shrink-0" />
                            <span className="text-xs font-black text-slate-800 break-all">{txUser?.email || tx.userEmail || "Unknown Email"}</span>
                          </div>
                          {txName && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md shrink-0">
                              {txName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Withdrawal Destination Section */}
                      {tx.type === "withdraw" && (
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2">
                          <div className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Withdrawal Destination Address
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-rose-100/50 font-mono text-xs text-slate-800 break-all select-all flex items-center justify-between gap-2 shadow-sm">
                            <div className="flex flex-col gap-1 w-full">
                              <span className="font-semibold break-all selection:bg-rose-100">{withdrawAddress || "N/A"}</span>
                              <span className="text-[10px] text-slate-500 font-sans font-bold">Payee: <span className="text-indigo-600 uppercase font-black">{txName}</span></span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(withdrawAddress || "");
                                toast.success("Withdrawal address copied!");
                              }}
                              className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-sans font-bold uppercase transition-all shrink-0 border border-slate-200"
                            >
                              Copy
                            </button>
                          </div>
                          {withdrawNetwork && (
                            <div className="text-[10px] text-slate-500 font-bold">
                              Network: <span className="text-rose-600 uppercase font-black">{withdrawNetwork}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {tx.type === "trade" ? (
                        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3 font-mono text-xs">
                          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pb-1 border-b border-indigo-200/60 flex justify-between items-center">
                            <span>TRADE AUDIT RECORD</span>
                            <span className={cn("px-2.5 py-0.5 rounded-full font-black uppercase text-[10px]", tx.tradeType === "WIN" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                              {tx.tradeType || "CLOSED"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                            <div>Asset: <strong className="text-slate-900 font-bold">{tx.asset || tx.symbol}</strong></div>
                            <div>Investment: <strong className="text-slate-900 font-bold">${tx.investmentAmount?.toFixed(2) || tx.amount?.toFixed(2)}</strong></div>
                            <div>Entry Price: <strong className="text-slate-900 font-bold">${tx.entryPrice?.toFixed(2) || "N/A"}</strong></div>
                            <div>Exit Price: <strong className="text-slate-900 font-bold">${tx.exitPrice?.toFixed(2) || "N/A"}</strong></div>
                            <div className="col-span-2 pt-1 border-t border-indigo-100 flex justify-between">
                              <span>Net Profit / Loss:</span>
                              <strong className={cn("font-black", tx.profitOrLoss !== undefined ? (tx.profitOrLoss >= 0 ? "text-emerald-600" : "text-rose-600") : "text-slate-900")}>
                                {tx.profitOrLoss !== undefined ? (tx.profitOrLoss >= 0 ? `+$${tx.profitOrLoss.toFixed(2)}` : `-$${Math.abs(tx.profitOrLoss).toFixed(2)}`) : "N/A"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : tx.details && tx.type !== "withdraw" && (
                        <div className="text-sm text-slate-500 font-medium bg-white/50 p-4 rounded-2xl border border-slate-100">{tx.details}</div>
                      )}

                      {tx.receipt && (
                        <div className="mt-6 space-y-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Verification Object
                          </div>
                          <div 
                            onClick={() => setSelectedReceipt(tx.receipt!)}
                            className="rounded-[1.5rem] overflow-hidden border border-slate-200 bg-white group cursor-pointer relative h-32 shadow-sm"
                          >
                            <img src={tx.receipt} referrerPolicy="no-referrer" alt="Deposit Receipt" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/20 transition-all">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all">
                                <Search className="w-5 h-5 text-indigo-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {tx.status === "pending" && (
                        <div className="flex gap-4 pt-4">
                          <button 
                            onClick={() => handleProcessTransaction(tx, "completed")}
                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs"
                          >
                            Authorize
                          </button>
                          <button 
                            onClick={() => handleProcessTransaction(tx, "failed")}
                            className="flex-1 py-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {tx.status !== "pending" && (
                        <div className="pt-4">
                          <div className={cn(
                            "w-full py-3 text-center rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-inner",
                            tx.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            Transmission {tx.status}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "support" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[700px]">
            {/* User List */}
            <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl shadow-slate-200/50">
              <div className="p-8 border-b border-slate-100 bg-slate-100/30 space-y-4">
                <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  Terminal Chats
                </h3>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Start New Chat</label>
                  <select
                    value={selectedUserChat || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedUserChat(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  >
                    <option value="">-- Choose User --</option>
                    {users.filter(u => u.email !== "girmaeden37@gmail.com").map(u => (
                      <option key={u.id} value={u.id}>
                        {getUserEmail(u)} {u.fullName ? `(${u.fullName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const chatUserIds = Array.from(new Set(allMessages.map(m => m.userId)));
                  if (selectedUserChat && !chatUserIds.includes(selectedUserChat)) {
                    chatUserIds.unshift(selectedUserChat);
                  }

                  if (chatUserIds.length === 0) {
                    return (
                      <div className="p-12 text-center text-slate-400 italic">
                        No active support chats. Select a user above to begin.
                      </div>
                    );
                  }

                  return chatUserIds.map(uId => {
                    const userProfile = users.find(u => u.id === uId);
                    const lastMsg = allMessages.filter(m => m.userId === uId).pop();
                    return (
                      <button
                        key={uId}
                        onClick={() => setSelectedUserChat(uId)}
                        className={cn(
                          "w-full p-6 flex items-center gap-4 hover:bg-slate-100 transition-all text-left",
                          selectedUserChat === uId ? "bg-indigo-50/50 border-r-4 border-indigo-600" : "border-b border-slate-100"
                        )}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-slate-900 truncate">{getUserEmail(userProfile || { id: uId })}</div>
                          <div className="text-[10px] text-slate-500 truncate font-medium">{lastMsg?.text || "No transmissions yet"}</div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl shadow-slate-200/50">
              {selectedUserChat ? (
                <>
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 tracking-tight text-xl">{getUserEmail(users.find(u => u.id === selectedUserChat))}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Established Uplink</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-100/30">
                    {allMessages.filter(m => m.userId === selectedUserChat).map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[75%]",
                        msg.isAdmin ? "ml-auto items-end" : "mr-auto"
                      )}>
                        <div className={cn(
                          "p-5 rounded-3xl text-sm font-medium shadow-sm transition-all hover:shadow-md",
                          msg.isAdmin 
                            ? "bg-indigo-600 text-white rounded-br-none" 
                            : "bg-white text-slate-900 border border-slate-100 rounded-bl-none"
                        )}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-300 mt-3 mx-2 tracking-widest font-mono">
                          {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-10 bg-white border-t border-slate-50">
                    <form onSubmit={handleSendMessage} className="flex gap-4">
                      <input 
                        type="text"
                        placeholder="Transmit response..."
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-6 py-5 text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-medium shadow-inner"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button 
                        type="submit"
                        disabled={isSending || !replyText.trim()}
                        className="px-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 uppercase tracking-widest text-xs"
                      >
                        <Send className="w-5 h-5" />
                        Transmit
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-24 space-y-8 opacity-50">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-12 h-12 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Access Terminal</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mt-4 leading-relaxed">Select specialized vector to initiate secure direct communication protocols.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {activeTab === "settings" && (
          <div className="space-y-10 max-w-4xl">
            {/* Protocol Gateways Card */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-6 mb-12">
                <div className="p-4 bg-amber-50 rounded-[1.5rem]">
                  <Bitcoin className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Protocol Gateways</h3>
                  <p className="text-slate-500 font-medium">Update institutional receiving handles.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {(["usdt", "sol", "btc", "eth", "bnb", "xrp"] as const).map((coin) => {
                  const coinColors: Record<string, { badge: string, border: string, text: string }> = {
                    usdt: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", border: "focus:border-emerald-500 focus:ring-emerald-50", text: "text-emerald-700" },
                    sol: { badge: "bg-purple-100 text-purple-800 border-purple-200", border: "focus:border-purple-500 focus:ring-purple-50", text: "text-purple-700" },
                    btc: { badge: "bg-amber-100 text-amber-800 border-amber-200", border: "focus:border-amber-500 focus:ring-amber-50", text: "text-amber-700" },
                    eth: { badge: "bg-blue-100 text-blue-800 border-blue-200", border: "focus:border-blue-500 focus:ring-blue-50", text: "text-blue-700" },
                    bnb: { badge: "bg-yellow-100 text-yellow-800 border-yellow-200", border: "focus:border-yellow-500 focus:ring-yellow-50", text: "text-yellow-700" },
                    xrp: { badge: "bg-slate-200 text-slate-800 border-slate-300", border: "focus:border-slate-500 focus:ring-slate-50", text: "text-slate-700" },
                  };
                  const styling = coinColors[coin] || coinColors.usdt;
                  return (
                    <div key={coin} className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <label className={`block text-xs font-black uppercase tracking-[0.2em] ${styling.text}`}>
                          {coin.toUpperCase()} Secure Handle
                        </label>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styling.badge}`}>
                          {coin === "usdt" ? "Tether" : coin === "sol" ? "Solana" : coin === "btc" ? "Bitcoin" : coin === "eth" ? "Ethereum" : coin === "bnb" ? "BNB Chain" : "Ripple"}
                        </span>
                      </div>
                      <input 
                        type="text"
                        className={`w-full bg-slate-100 border border-slate-200 rounded-2xl py-5 px-6 text-slate-900 focus:bg-white focus:ring-4 ${styling.border} outline-none font-mono font-bold text-base shadow-inner transition-all`}
                        value={(settings as any)[`${coin}_address`] || ""}
                        onChange={(e) => setSettings({ ...settings, [`${coin}_address`]: e.target.value })}
                        placeholder={`Enter ${coin.toUpperCase()} institutional address...`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-12 pt-12 border-t border-slate-100">
                <button 
                  onClick={handleUpdateSettings}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-200 active:scale-95 uppercase tracking-widest"
                >
                  <Save className="w-6 h-6" /> Commit Protocol Changes
                </button>
              </div>
            </div>

            {/* Database Integrity & Privacy Sync Card */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-6 mb-12">
                <div className="p-4 bg-rose-50 rounded-[1.5rem]">
                  <ShieldCheck className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Data Integrity & Privacy</h3>
                  <p className="text-slate-500 font-medium">Synchronize database collections to enforce compliance and complete erasure requests.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-200/60">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 uppercase tracking-widest">Leftover Support Chats</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Chat documents containing deleted user emails or messages.</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                    allMessages.filter(m => m.userId && !new Set(users.map(u => u.id)).has(m.userId)).length > 0
                      ? "bg-amber-100 text-amber-800 animate-pulse" 
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {allMessages.filter(m => m.userId && !new Set(users.map(u => u.id)).has(m.userId)).length} Orphaned Messages
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 uppercase tracking-widest">Orphaned Transactions</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Transaction entries with credentials from deleted operator accounts.</p>
                  </div>
                  <div className="text-slate-400 text-xs font-black uppercase tracking-wider italic">
                    Requires Deep Scan
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col md:flex-row gap-6">
                <button 
                  onClick={purgeOrphanedData}
                  disabled={isCleaning}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-6 rounded-2xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-rose-200 active:scale-95 uppercase tracking-widest text-xs"
                >
                  <Trash2 className="w-5 h-5" /> 
                  {isCleaning ? "Deep Sweeping..." : "Purge Orphaned Chats & Trades"}
                </button>

                <button 
                  onClick={purgeAllNonAdminUsers}
                  disabled={isCleaning}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-6 rounded-2xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10 active:scale-95 uppercase tracking-widest text-xs border border-slate-800"
                >
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                  {isCleaning ? "Purging Registry..." : "Wipe All Non-Admin Accounts"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {selectedUserKYC && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserKYC(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Dossier</h3>
                    <p className="text-[10px] text-indigo-600 uppercase tracking-[0.3em] font-black">{selectedUserKYC.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserKYC(null)}
                  className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3 bg-slate-100 p-6 rounded-[2rem] border border-slate-200 shadow-inner">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Identity</label>
                    <p className="text-slate-900 font-black text-lg leading-tight">{selectedUserKYC.fullName || "UNREGISTERED"}</p>
                  </div>
                  <div className="space-y-3 bg-slate-100 p-6 rounded-[2rem] border border-slate-200 shadow-inner">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Comm Vector</label>
                    <div className="flex items-start gap-3">
                       <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                       <p className="text-slate-900 font-black tracking-tight">{selectedUserKYC.phoneNumber || "UNLINKED"}</p>
                    </div>
                  </div>
                  <div className="space-y-3 bg-slate-100 p-6 rounded-[2rem] border border-slate-200 shadow-inner">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Coordinates</label>
                    <div className="flex items-start gap-3">
                       <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                       <p className="text-slate-900 font-black tracking-tight leading-snug">{selectedUserKYC.address || "OFF-GRID"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    Proof of Identity Objective
                  </label>
                  {selectedUserKYC.verificationDoc ? (
                    <div className="rounded-[2.5rem] border-4 border-slate-100 bg-white overflow-hidden shadow-2xl relative group ring-1 ring-slate-100">
                      <img 
                        src={selectedUserKYC.verificationDoc} 
                        referrerPolicy="no-referrer"
                        alt="KYC Document" 
                        className="w-full h-auto object-contain cursor-zoom-in group-hover:scale-[1.03] transition-transform duration-700"
                        onClick={() => window.open(selectedUserKYC.verificationDoc, "_blank")}
                      />
                      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none" />
                    </div>
                  ) : (
                    <div className="p-24 text-center bg-slate-100 rounded-[2.5rem] border border-slate-200 text-slate-400 font-black italic uppercase tracking-widest text-xs">
                      No visual confirmation object available.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-8 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                <div className="flex gap-4">
                  {selectedUserKYC.verificationStatus === "pending" && (
                    <>
                      <button 
                        onClick={() => {
                          handleVerifyUser(selectedUserKYC.id, "verified");
                          setSelectedUserKYC(null);
                        }}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                      >
                        Verify User
                      </button>
                      <button 
                        onClick={() => {
                          handleVerifyUser(selectedUserKYC.id, "rejected");
                          setSelectedUserKYC(null);
                        }}
                        className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedUserKYC(null)}
                  className="px-12 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                >
                  Close Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedReceipt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Transmission Proof</h3>
                    <p className="text-[10px] text-emerald-600 uppercase tracking-[0.3em] font-black">Financial Object</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12">
                <div className="rounded-[2.5rem] border-4 border-slate-100 bg-white overflow-hidden shadow-2xl relative group ring-1 ring-slate-100">
                  <img 
                    src={selectedReceipt} 
                    referrerPolicy="no-referrer"
                    alt="Transaction Receipt" 
                    className="w-full h-auto object-contain cursor-zoom-in group-hover:scale-[1.03] transition-transform duration-700"
                    onClick={() => window.open(selectedReceipt, "_blank")}
                  />
                  <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/5 transition-colors pointer-events-none" />
                </div>
                <p className="mt-8 text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                  Audit verified visual documentation.
                </p>
              </div>
              
              <div className="p-8 bg-slate-100 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="px-12 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                >
                  Exit Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setConfirmDelete(null)}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="bg-rose-50 p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-rose-200 mb-6">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Permanent Deletion</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Are you sure you want to delete <span className="font-black text-slate-900 break-all">{confirmDelete.name}</span>? 
                  This operation is irreversible.
                </p>
              </div>
              <div className="p-8 flex gap-4">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-100 uppercase tracking-widest text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {showAddUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddUserModal(false)}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add New User</h3>
                <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address *</label>
                  <input 
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                  <input 
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Initial Balance ($)</label>
                  <input 
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreatingUser}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
                  >
                    {isCreatingUser ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
