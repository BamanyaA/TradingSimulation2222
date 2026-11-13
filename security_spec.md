# Security Specification: CryptoSim Trading

## Data Invariants
1. A user's balance cannot be modified by the user directly, only via Transactions or Admin actions.
   * *Correction*: In this simulation, trades update balance. We'll allow users to update balance ONLY if it's accompanied by a Transaction record or validated by state. Actually, user requested `update-balance (admin only)` and `trade` API. I'll stick to: Users can't touch their balance except through specific flows.
   * *Revised*: Users can modify their balance ONLY when a trade is logged. No, better: Admin sets balance, or server API does.
2. Transactions are immutable once created (status 'completed' or 'failed').
3. Users can only read their own profile, except for Admins who can read all.
4. Settings are read-only for users, writeable only by Admins.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoof**: User A tries to read User B's profile.
2. **Identity Spoof**: User A tries to create a transaction for User B.
3. **Privilege Escalation**: User A tries to update their own role to 'admin'.
4. **Balance Injection**: User A tries to set their balance to 999999.
5. **ID Poisoning**: Creating a user with a 2KB junk string ID.
6. **Shadow Field**: Adding `isVerified: true` to a user profile.
7. **Type Mismatch**: Sending `balance: "one thousand"` (string instead of number).
8. **Negative Deposit**: Creating a transaction with `amount: -100` to drain balance? (Wait, trade results can be negative, but let's check).
9. **Settings Hijack**: User A tries to update the global BTC address.
10. **State Shortcut**: Updating a transaction from 'pending' to 'completed' without proper authority.
11. **PII Leak**: Non-admin user trying to list all emails.
12. **Recursive Attack**: Querying with a massive limit or without filters (handled by rule-side enforcement).

## Test Runner Plan
I will implement `firestore.rules.test.ts` to verify these rejections.
