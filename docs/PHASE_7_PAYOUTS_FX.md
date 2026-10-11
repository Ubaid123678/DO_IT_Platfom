# Do It Platform - Phase 7: Payouts, FX, and Multi-Currency

## Overview

Phase 7 implements the complete payout and foreign exchange infrastructure for the Do It platform: Wise-powered cross-border payouts, Stripe Connect Express onboarding for providers, multi-currency wallet support with FX rate caching, and automated payout scheduling with webhook reconciliation. This phase bridges wallet/escrow (Phase 6) with provider earnings withdrawal.

**Duration**: 1 sprint
**Status**: ✅ Completed
**Completion Date**: 2026-08-11

---

## Architecture

```mermaid
flowchart TB
    subgraph ClientApp["Client App"]
        CW["Client Wallet Screen\nBalance / Top-up / History"]
        CW2["Top-up Screen\nStripe PaymentIntent"]
    end

    subgraph ProviderApp["Provider App"]
        PW["Provider Wallet Screen\nBalance / Payout / History"]
        PW2["Payout Setup Screen\nWise Onboarding"]
    end

    subgraph API["Backend API (/api/v1/wallet)"]
        WCR["POST /topup\nCreate PaymentIntent"]
        WCNF["POST /topup/confirm\nConfirm Stripe Payment"]
        WEBHOOK["POST /webhook/stripe\nStripe Webhooks"]
        WTRANS["GET /transactions\nTransaction History"]
        WPAYOUT["POST /payout\nRequest Payout"]
        WSTATS["GET /stats\nWallet Statistics"]
        WADMIN["GET /admin/wallets\nAdmin Wallets"]
        WADJ["POST /admin/adjustment\nAdmin Adjustment"]
        ILOCK["POST /internal/escrow/lock\nLock Escrow (Phase 5)"]
        IRELEASE["POST /internal/escrow/release\nRelease Escrow (Phase 4)"]
        IREFUND["POST /internal/escrow/refund\nRefund Escrow"]
        PPAYOUT["POST /payout\nRequest Payout"]
        PSTATS["GET /payout/stats\nPayout Stats"]
        PCONNECT["POST /connect/account\nStripe Connect Account"]
        PLINK["POST /connect/account-link\nAccount Link"]
        PSTATUS["GET /connect/account-status\nConnect Status"]
        PLOGIN["POST /connect/login-link\nLogin Link"]
        PWRECIPIENT["POST /wise/recipient\nCreate Recipient"]
        PRATE["GET /wise/rate\nExchange Rate"]
        PCONVERT["POST /wise/convert\nConvert Currency"]
        PFXRATES["GET /fx/rates\nFX Rates"]
        PCONVERT2["POST /fx/convert\nConvert Currency"]
        PWEBHOOK_STRIPE["POST /webhook/stripe-connect\nStripe Connect Webhook"]
        PWEBHOOK_WISE["POST /webhook/wise\nWise Webhook"]
    end

    subgraph Matching["Matching Engine (Phase 5)"]
        MATCH["GET /proposals/job/:id/match\nFind Providers"]
    end

    subgraph Jobs["Jobs Service (Phase 4)"]
        JCOMPLETE["POST /jobs/:id/status\ncompleted → releaseEscrow"]
        JCANCEL["POST /jobs/:id/status\ncancelled → refundEscrow"]
    end

    subgraph Proposals["Proposals Service (Phase 5)"]
        PACCEPT["POST /proposals/:id/accept\n→ lockEscrow"]
    end

    subgraph DB["MongoDB"]
        WALLET[("wallets\ncollection")]
        LEDGER[("ledger_entries\ncollection")]
        TXN[("transactions\ncollection")]
        PAYOUT[("payouts\ncollection")]
        JOB[("jobs\ncollection")]
        PROP[("proposals\ncollection")]
        USER[("users\ncollection")]
    end

    subgraph External["External Services"]
        STRIPE["Stripe\nPaymentIntents / Webhooks / Connect"]
        STRIPE_CONNECT["Stripe Connect\nProvider Payouts"]
        WISE["Wise\nCross-border Payouts"]
    end

    CW --> WCR
    CW2 --> WCR
    CW --> WTRANS
    PW --> WTRANS
    PW --> PPAYOUT
    PW2 --> PLINK
    WCR --> STRIPE
    STRIPE --> WEBHOOK
    WEBHOOK --> WCNF
    WCNF --> WALLET
    WCR --> WALLET
    WTRANS --> TXN
    PPAYOUT --> PAYOUT
    PPAYOUT --> PPAYOUT
    ILOCK --> WALLET
    ILOCK --> TXN
    ILOCK --> JOB
    IRELEASE --> WALLET
    IRELEASE --> TXN
    IRELEASE --> JOB
    IREFUND --> WALLET
    IREFUND --> TXN
    PACCEPT --> ILOCK
    JCOMPLETE --> IRELEASE
    JCANCEL --> IREFUND
    MATCH --> JOB
    WADMIN --> WALLET
    WADJ --> WALLET
    TXN --> LEDGER
    PAYOUT --> LEDGER
    WALLET --> USER
```

---

## Data Model

```mermaid
erDiagram
    WALLET ||--o{ LEDGER_ENTRY : "has"
    WALLET ||--o{ TRANSACTION : "has"
    WALLET }|--|| USER : "belongs to"
    WALLET ||--o{ PAYOUT : "has"
    TRANSACTION ||--o{ LEDGER_ENTRY : "creates"
    PAYOUT }|--|| WALLET : "from"
    TRANSACTION }|--|| USER : "initiated by"
    JOB }|--|| WALLET : "escrow (client)"
    JOB ||--o| TRANSACTION : "escrow ops"

    WALLET {
        ObjectId _id PK
        ObjectId userId FK
        enum type "user|platform|escrow|fee"
        Map balances "currency -> amount (cents)"
        string baseCurrency "ISO 4217"
        Map escrowBalances "currency -> locked amount"
        Map availableBalances "currency -> available amount"
        boolean isActive
        datetime lastTransactionAt
        datetime createdAt
        datetime updatedAt
    }

    TRANSACTION {
        string transactionId PK "TXN_..."
        ObjectId userId FK
        ObjectId walletId FK
        enum type "topup|escrow_lock|escrow_release|escrow_refund|platform_fee|payout|payout_reversal|adjustment|refund"
        enum status "pending|completed|failed|cancelled"
        int amount "cents (+credit/-debit)"
        string currency "ISO 4217"
        int netAmount "after fees"
        int feeAmount "platform fee"
        string description
        object metadata {stripePaymentIntentId, jobId, proposalId, payoutId, idempotencyKey, fxRate, targetCurrency, targetAmount, ...}
        ObjectId[] ledgerEntries
        datetime completedAt
        datetime failedAt
        datetime createdAt
        datetime updatedAt
    }

    LEDGER_ENTRY {
        ObjectId _id PK
        ObjectId transactionId FK
        ObjectId walletId FK
        ObjectId userId FK
        enum entryType "debit|credit"
        int amount "always positive cents"
        int balanceAfter "wallet balance after this entry"
        string description
        ObjectId referenceId "jobId|proposalId|..."
        string referenceType "job|proposal|topup|payout|..."
        datetime createdAt
    }

    PAYOUT {
        string payoutId PK "PAYOUT_..."
        ObjectId providerId FK
        ObjectId walletId FK
        int amount "source currency cents"
        string currency "ISO 4217"
        int netAmount "after platform fee"
        int feeAmount "platform fee (10%)"
        enum status "pending|processing|completed|failed|cancelled"
        string wiseTransferId
        string wiseQuoteId
        string destinationAccountId
        string failureReason
        datetime completedAt
        datetime createdAt
        datetime updatedAt
        object metadata {scheduledAt, recurrence, retryCount, maxRetries, cancellationReason}
    }
```

---

## Financial Flows

### 1. Wallet Top-up (Stripe)

```mermaid
sequenceDiagram
    participant U as User (Client/Provider)
    participant App as Mobile App
    participant API as Backend API
    participant STRIPE as Stripe
    participant DB as MongoDB

    U->>App: Enter amount, tap "Continue"
    App->>API: POST /wallet/topup {amountCents, currency, idempotencyKey}
    API->>DB: Create Transaction (status=pending, type=topup)
    API->>STRIPE: Create PaymentIntent (amount, metadata)
    STRIPE-->>API: clientSecret
    API-->>App: {clientSecret, transactionId}
    App->>U: Redirect to Stripe Checkout
    U->>STRIPE: Complete payment
    STRIPE->>API: Webhook (payment_intent.succeeded)
    API->>DB: Find Transaction by paymentIntentId
    API->>DB: Confirm Transaction (status=completed)
    API->>DB: Create Ledger Entries (credit user wallet)
    API->>DB: Update Wallet (balance += amount)
    API-->>App: Transaction confirmed
    App-->>U: Success notification
```

### 2. Escrow Lock (Proposal Acceptance)

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Backend API
    participant DB as MongoDB
    participant PROP as Proposal Service

    C->>PROP: POST /proposals/:id/accept
    PROP->>DB: Verify proposal + job
    PROP->>Wallet: POST /internal/escrow/lock {jobId, proposalId, amountCents, idempotencyKey}
    Wallet->>DB: Find client wallet
    Wallet->>DB: Check availableBalance >= amount
    Wallet->>DB: Deduct from balance, add to escrowBalance
    Wallet->>DB: Create Transaction (type=escrow_lock, amount=-amount)
    Wallet->>DB: Create LedgerEntry (debit client wallet)
    Wallet->>DB: Update Job (escrow.lockedAmount, lockedAt, platformFeeAmount)
    Wallet-->>PROP: Escrow locked
    PROP->>DB: Accept proposal, assign provider, job→in_progress
    PROP-->>C: Proposal accepted, escrow locked
```

### 3. Escrow Release (Job Completion)

```mermaid
sequenceDiagram
    participant C as Client
    participant P as Provider
    participant API as Backend API
    participant DB as MongoDB
    participant WALLET as Wallet Service

    C->>API: POST /jobs/:id/status {status: "completed"}
    API->>DB: Verify job in_progress, client owns job
    API->>WALLET: POST /internal/escrow/release {jobId, split: {providerAmount, platformFee, clientRefund}, idempotencyKey}
    WALLET->>DB: Find client/provider/platform wallets
    WALLET->>DB: Client: escrowBalance -= total, balance += clientRefund
    WALLET->>DB: Provider: balance += providerAmount
    WALLET->>DB: Platform: balance += platformFee
    WALLET->>DB: Create Transaction (escrow_release)
    WALLET->>DB: Create LedgerEntries (client debit, provider credit, platform credit)
    WALLET->>DB: Update Job (escrow.releasedAt, status=completed)
    WALLET-->>API: Success
    API-->>C: Job completed
```

### 4. Escrow Refund (Cancellation)

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Backend API
    participant DB as MongoDB

    C->>API: POST /jobs/:id/status {status: "cancelled"}
    API->>DB: Verify job, client owns job
    API->>Wallet: POST /internal/escrow/refund {jobId, amount, reason, idempotencyKey}
    Wallet->>DB: Find client wallet
    Wallet->>DB: escrowBalance -= amount, balance += amount
    Wallet->>DB: Create Transaction (escrow_refund, amount=+amount)
    Wallet->>DB: Create LedgerEntry (credit client wallet)
    Wallet->>DB: Update Job (status=cancelled)
    Wallet-->>API: Success
    API-->>C: Job cancelled, refunded
```

### 4. Provider Payout

```mermaid
sequenceDiagram
    participant P as Provider
    participant API as Backend API
    participant DB as MongoDB
    participant WISE as Wise (Phase 7)

    P->>API: POST /wallet/payout {amountCents, currency}
    API->>DB: Verify provider wallet, availableBalance >= amount
    API->>DB: Deduct from balance (amount + 10% fee)
    API->>DB: Create Payout record (status=pending)
    API->>DB: Create Transaction (type=payout, amount=-(amount+fee))
    API->>DB: Create LedgerEntry (debit provider wallet)
    API-->>P: Payout requested (pending)

    Note over API,WISE: Phase 7 - Wise integration
    API->>WISE: Create payout to provider bank
    WISE-->>API: Webhook (transfer.completed)
    API->>DB: Update Payout (status=completed, wiseTransferId)
    API->>DB: Update Transaction (status=completed)
```

---

## Double-Entry Ledger

Every financial transaction creates balanced debit/credit entries:

```
┌─────────────────────────────────────────────────────────────┐
│  TOP-UP ($100)                                              │
├──────────────┬────────────┬───────────┬─────────────────────┤
│ Wallet       │ Entry Type │ Amount    │ Balance After       │
├──────────────┼────────────┼───────────┼─────────────────────┤
│ Client       │ CREDIT     │ $100.00   │ $100.00             │
│ Platform     │ DEBIT      │ $100.00   │ -$100.00 (liability)│
└──────────────┴────────────┴───────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ESCROW LOCK ($500 job)                                     │
├──────────────┬────────────┬───────────┬─────────────────────┤
│ Wallet       │ Entry Type │ Amount    │ Balance After       │
├──────────────┼────────────┼───────────┼─────────────────────┤
│ Client       │ DEBIT      │ $500.00   │ $500.00 (escrow)    │
│ Client       │ CREDIT     │ $500.00   │ $0.00 (available)   │
└──────────────┴────────────┴───────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ESCROW RELEASE ($500 job, 90/10 split)                     │
├──────────────┬────────────┬───────────┬─────────────────────┤
│ Wallet       │ Entry Type │ Amount    │ Balance After       │
├──────────────┼────────────┼───────────┼─────────────────────┤
│ Client       │ DEBIT      │ $500.00   │ $0.00 (escrow)      │
│ Provider     │ CREDIT     │ $450.00   │ $450.00 (balance)   │
│ Platform     │ CREDIT     │ $50.00    │ $50.00 (balance)    │
└──────────────┴────────────┴───────────┴─────────────────────┘
```

---

## State Machines

### Wallet Transaction Status

```mermaid
stateDiagram-v2
    [*] --> pending: Create Transaction
    pending --> completed: Webhook/Confirmation
    pending --> failed: Payment Failed
    pending --> cancelled: Expired/Cancelled
    completed --> [*]
    failed --> [*]
    cancelled --> [*]
```

### Escrow States (on Job)

```mermaid
stateDiagram-v2
    [*] --> none: Job created
    none --> locked: Proposal accepted (lockEscrow)
    locked --> released: Job completed (releaseEscrow)
    locked --> refunded: Job cancelled (refundEscrow)
    released --> [*]
    refunded --> [*]
```

### Payout Status

```mermaid
stateDiagram-v2
    [*] --> pending: Request payout
    pending --> processing: Wise transfer initiated
    processing --> completed: Wise webhook success
    processing --> failed: Wise webhook failure
    pending --> cancelled: Admin cancel
    completed --> [*]
    failed --> [*]
    cancelled --> [*]
```

---

## API Endpoints

### Wallet Endpoints (`/api/v1/wallet`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/balance` | ✅ | Get current wallet balance |
| GET | `/` | ✅ | Get wallet details |
| GET | `/stats` | ✅ | Wallet statistics |
| POST | `/topup` | ✅ | Create Stripe PaymentIntent |
| POST | `/topup/confirm` | ✅ | Confirm Stripe payment |
| POST | `/webhook/stripe` | ❌ | Stripe webhook (no auth) |
| GET | `/transactions` | ✅ | Transaction history |
| POST | `/payout` | ✅ (provider) | Request payout |
| GET | `/payouts` | ✅ (provider) | Payout history |
| GET | `/admin/wallets` | ✅ (admin) | Admin: list wallets |
| POST | `/admin/adjustment` | ✅ (admin) | Manual adjustment |

### Internal Escrow Endpoints (`/api/v1/wallet/internal`)

| Method | Endpoint | Called By | Description |
|--------|----------|-----------|-------------|
| POST | `/escrow/lock` | Proposal Service | Lock escrow on acceptance |
| POST | `/escrow/release` | Job Service | Release escrow on completion |
| POST | `/escrow/refund` | Job Service | Refund escrow on cancellation |

---

## Security & Idempotency

### Idempotency Keys
All mutating financial operations require an `idempotencyKey`:
- Format: `{operation}_{entityId}_{timestamp}_{random}`
- Example: `topup_user123_1700000000_abc123`
- Stored in `Transaction.metadata.idempotencyKey`
- Prevents duplicate charges on retry

### Stripe Webhook Security
```typescript
stripe.webhooks.constructEvent(payload, signature, endpointSecret)
// Verifies signature, throws on invalid
```

### Authorization
- All endpoints require valid JWT (`authenticate` middleware)
- Role-based access: `client`, `provider`, `admin`
- Internal endpoints: called only by trusted services (proposal/job services)

---

## Files Created/Modified

### Backend
```
backend/src/modules/wallet/
├── wallet.model.ts          # Wallet, LedgerEntry, Transaction, Payout schemas
├── wallet.validation.ts     # Joi validation schemas
├── wallet.service.ts        # Core business logic
├── wallet.controller.ts     # HTTP handlers
├── wallet.routes.ts         # Route definitions
├── stripe.service.ts        # Stripe integration
├── stripe-connect.service.ts # Stripe Connect integration
├── wise.service.ts          # Wise integration
├── fx-rate.service.ts       # FX rate service
├── payout-scheduler.service.ts # Automated payout scheduling
├── payout.controller.ts     # Payout/Connect/Wise/FX controllers
├── payout.routes.ts         # Route definitions
backend/src/routes/index.ts  # Mounted wallet router
backend/src/modules/proposals/proposal.service.ts  # Updated acceptProposal
backend/src/modules/jobs/job.service.ts            # Updated transitionStatus
```

### Mobile
```
mobile/src/services/walletService.ts          # Typed API client
mobile/src/services/proposalService.ts        # Updated with payout methods
mobile/app/(client)/wallet.tsx                # Client wallet screen
mobile/app/(client)/wallet/topup.tsx          # Top-up screen
mobile/app/(provider)/wallet.tsx              # Provider wallet screen
mobile/app/(provider)/wallet/payout.tsx       # Payout request screen
mobile/app/(provider)/wallet/connect.tsx      # Stripe Connect onboarding
mobile/app/(provider)/wallet/wise.tsx         # Wise recipient management
```

---

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Backend TypeScript | `cd backend && npx tsc --noEmit` | ✅ Clean |
| Backend Tests | `cd backend && npx vitest run` | ✅ 12/12 pass |
| Mobile TypeScript | `cd mobile && npx tsc --noEmit` | ⚠️ Strictness warnings (core modules clean) |

---

## Next Phase Dependencies

| Phase | Dependency |
|-------|------------|
| Phase 8: Disputes/Reviews | Requires Job/Proposal/Escrow models + state machines |
| Phase 9: Notifications | Requires job/proposal/escrow events |
| Phase 10: Fraud Detection | Requires transaction/user behavioral data |

---

*Document generated: 2026-08-11*
*Phase 7: Payouts, FX, and Multi-Currency — Complete*