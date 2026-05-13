# Firestore Security Specification

## Data Invariants
1. **Users**: Each user must have a unique profile document at `users/{uid}`. They can only read and write their own profile (except for the `role` field which is only writeable by admins).
2. **Orders**: Orders must belong to a user. Users can create orders and read their own. Admins manage all orders.
3. **Transactions**: Transactions represent balance changes (deposits, orders). Users can create 'deposit' type transactions. Admins approve/reject them.
4. **Services & Categories**: Read-only for users, managed by admins.
5. **Settings**: General site settings managed by admins, readable by all.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: Attempt to create a transaction with `userId` of another user.
2. **Role Escalation**: Attempt to update `users/{uid}` with `role: 'admin'`.
3. **Ghost Transactions**: Attempt to create a transaction with `status: 'completed'` to bypass admin approval.
4. **Service Price Manipulation**: Attempt to create an order with a `charge` that doesn't match the quantity * price (validation logic).
5. **Setting Sabotage**: Attempt to write to `settings/site` as a non-admin.
6. **Provider Theft**: Attempt to read `providers/` as a non-admin (PII/Secret leak).
7. **Orphaned Message**: Attempt to create a message in a room that doesn't exist.
8. **Recursive Cost Attack**: Attempt to create a document with extremely large ID or field values.
9. **Terminal State Break**: Attempt to update a 'completed' transaction back to 'pending'.
10. **Identity Integrity Fail**: Attempt to delete another user's order.
11. **PII Leak**: Attempt to list all users as a regular user.
12. **Shadow Field injection**: Attempt to add `isVerified: true` to a user profile during creation.

## Proposed Rules Structure
- Global helpers: `isSignedIn()`, `isAdmin()`, `isValidId()`.
- Collection-specific validation: `isValidUser()`, `isValidTransaction()`, etc.
- Action-based updates using `affectedKeys().hasOnly()`.
