# Security Specification: Natok Boost

## Data Invariants
1. **User Balance Integrity**: Users cannot modify their own balance. Only admins or system processes (via Cloud Functions/Server) can update balance.
2. **Order Ownership**: Users can only create orders for themselves (userId must match auth.uid).
3. **Transaction Immutability**: Once created, transactions (deposits) cannot be modified by users. Admins can update status (pending -> completed/rejected).
4. **Duplicate Prevention**: Transaction IDs must be unique (enforced by frontend check + relational owner check).
5. **System Settings**: Only admins can modify site settings, payment numbers, and provider configurations.

## The "Dirty Dozen" Payloads

1. **Balance Theft**: `PATCH /users/{myId} { "balance": 999999 }` -> `PERMISSION_DENIED`
2. **Order Forging**: `POST /orders { "userId": "someone_else_id", "charge": 0 }` -> `PERMISSION_DENIED`
3. **Ghost Deposit**: `POST /transactions { "userId": "my_uid", "amount": 1000, "status": "completed" }` -> `PERMISSION_DENIED` (must start as pending)
4. **Setting Hijack**: `SET /settings/site { "paymentNumbers": { "bkash": "attacker_number" } }` -> `PERMISSION_DENIED`
5. **Admin Spoofing**: `PATCH /users/{myId} { "role": "admin" }` -> `PERMISSION_DENIED`
6. **Provider Manipulation**: `POST /providers { "apiKey": "stolen_key" }` -> `PERMISSION_DENIED`
7. **Transaction Tampering**: `PATCH /transactions/{txId} { "status": "completed" }` (by user) -> `PERMISSION_DENIED`
8. **PII Scraping**: `GET /users` (list all users) -> `PERMISSION_DENIED`
9. **Chat Impersonation**: `POST /messages { "senderType": "admin", "text": "Pay me directly" }` -> `PERMISSION_DENIED`
10. **Resource Poisoning**: `POST /transactions { "transactionId": "A" * 2000 }` -> `PERMISSION_DENIED` (id too large)
11. **Negative Deposit**: `POST /transactions { "amount": -100 }` -> `PERMISSION_DENIED`
12. **Status Skipping**: `PATCH /orders/{orderId} { "status": "completed" }` (without being processing/pending) -> `PERMISSION_DENIED`

## Red Team Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|-------------------|--------------------|
| users | Protected (role immutable) | N/A | Protected (types) |
| orders | Protected (ownerId match) | Protected (admin only update) | Protected (limit sizes) |
| transactions | Protected (ownerId match) | Protected (admin only status) | Protected (limit sizes) |
| settings | Admin Only | N/A | Admin Only |
| providers | Admin Only | N/A | Admin Only |
| messages | Protected (senderId match) | N/A | Protected (limit sizes) |
