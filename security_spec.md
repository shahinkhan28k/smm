# Security Specification - Natok Boost SMM Panel

## Data Invariants
1. **User Integrity**: A user can only access their own profile, balance, and private data.
2. **Financial Security**: Balance updates must be strictly controlled. Users cannot update their own `balance` field (system or admin only).
3. **Order Lifecycle**: Users can create orders but cannot modify them once created (only admins can change status).
4. **Transaction Logs**: Transactions are immutable once created, except for status updates by admins.
5. **Support Tickets**: Users can create and view their own tickets. Admins can view and respond to all.
6. **Chat Privacy**: Chat rooms are private between the user (roomId) and admins.
7. **Role Protection**: Users cannot escalate their own privileges (role field is immutable for users).

## The "Dirty Dozen" Payloads (Targeting Firestore Rules)

### 1. Identity Spoofing (Create User)
**Target**: `/users/another_uid`
**Payload**: `{"uid": "another_uid", "email": "victim@example.com", "balance": 1000, "role": "admin"}`
**Expectation**: PERMISSION_DENIED (User cannot create a profile for another UID).

### 2. Privilege Escalation (Update User Role)
**Target**: `/users/my_uid`
**Payload**: `{"role": "admin"}`
**Expectation**: PERMISSION_DENIED (Users cannot update their own role).

### 3. Balance Injection (Update User Balance)
**Target**: `/users/my_uid`
**Payload**: `{"balance": 999999}`
**Expectation**: PERMISSION_DENIED (Users cannot update their own balance).

### 4. Admin Impersonation (Create Order for Others)
**Target**: `/orders/some_order_id`
**Payload**: `{"userId": "victim_uid", "serviceId": "s1", "quantity": 100, "charge": 0}`
**Expectation**: PERMISSION_DENIED (User cannot create orders for other users).

### 5. Order Theft (Read Other Users' Orders)
**Target**: `/orders` (List query)
**Payload**: `where("userId", "==", "victim_uid")`
**Expectation**: PERMISSION_DENIED (Rule must enforce `resource.data.userId == request.auth.uid`).

### 6. Free Services (Create Order with 0 Charge)
**Target**: `/orders/new_order`
**Payload**: `{"userId": "my_uid", "charge": 0, "status": "completed", ...}`
**Expectation**: PERMISSION_DENIED (Charge must be validated if possible, or status must be 'pending').

### 7. Transaction Forgery (Fake Deposit)
**Target**: `/transactions/fake_tx`
**Payload**: `{"userId": "my_uid", "amount": 100, "status": "completed", "type": "deposit"}`
**Expectation**: PERMISSION_DENIED (Users can only create 'pending' transactions).

### 8. Shadow Field Injection (Service Update)
**Target**: `/services/s1`
**Payload**: `{"name": "Free Service", "hidden_admin_field": "unauthorized"}`
**Expectation**: PERMISSION_DENIED (Strict key validation).

### 9. Chat Eavesdropping (Read Others' Messages)
**Target**: `/messages` (List query)
**Payload**: `where("roomId", "==", "victim_uid")`
**Expectation**: PERMISSION_DENIED (Room ID must match user ID).

### 10. System Setting Sabotage
**Target**: `/settings/config`
**Payload**: `{"siteName": "Hacked Site"}`
**Expectation**: PERMISSION_DENIED (Only admins can write settings).

### 11. Resource Exhaustion (ID Poisoning)
**Target**: `/orders/` + ("A" * 2000)
**Payload**: `{"userId": "my_uid", ...}`
**Expectation**: PERMISSION_DENIED (ID size check `isValidId`).

### 12. Orphaned Order (Missing Service Reference)
**Target**: `/orders/order1`
**Payload**: `{"userId": "my_uid", "serviceId": "non_existent_service", ...}`
**Expectation**: PERMISSION_DENIED (Exists check for serviceId during create).

## The Test Runner
(A separate test file `firestore.rules.test.ts` will be created to automate these checks).
