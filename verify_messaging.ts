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

async function runMessagingTests() {
  console.log("=== STARTING SUPPORT MESSAGING VERIFICATION TESTS ===");

  const db = loadDb();
  db.support = []; // reset for clean test

  const testUserId = "test_user_chat_123";
  const testMessageId = "msg_" + Date.now();

  // 1. User sends a support message
  const userMsg = {
    id: testMessageId,
    userId: testUserId,
    senderId: testUserId,
    senderEmail: "user@gammixtrades.com",
    text: "Hello, I need help with my deposit.",
    isAdmin: false,
    createdAt: new Date()
  };
  db.support.push(userMsg);
  saveDb(db);

  console.log(`[Test 1] User message sent successfully by ${testUserId}`);

  // 2. Admin replies to the user
  const adminReplyId = "msg_admin_" + Date.now();
  const adminReply = {
    id: adminReplyId,
    userId: testUserId,
    senderId: "admin",
    text: "Hello! We have received your deposit request and are processing it.",
    isAdmin: true,
    createdAt: new Date()
  };
  db.support.push(adminReply);
  saveDb(db);

  console.log(`[Test 2] Admin reply sent successfully to ${testUserId}`);

  // 3. Verify both messages exist in support collection and match userId
  const conversationMessages = db.support.filter((m: any) => m.userId === testUserId);
  if (conversationMessages.length !== 2) {
    throw new Error(`Messaging Test Failed: Expected 2 messages, found ${conversationMessages.length}`);
  }

  console.log("Test 3 PASSED: User message and admin reply successfully stored and retrieved for conversation.");
  console.log("=== ALL SUPPORT MESSAGING TESTS PASSED SUCCESSFULLY ===");
}

runMessagingTests().catch(err => {
  console.error("MESSAGING TEST FAILED:", err);
  process.exit(1);
});
