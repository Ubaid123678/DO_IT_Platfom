    # Do It Platform — Complete System Architecture & Flow Reference

**Purpose of this file:** A single, self-contained reference. Paste this whole file into any LLM (or read it yourself) and it will have full working knowledge of what "Do It" is, how every flow works end-to-end, how the pieces connect, what algorithms drive matching/fraud/escrow, the data model, the folder structure (backend + mobile), and the delivery roadmap.

All diagrams below are **plain ASCII text art inside code blocks** — they render correctly in ANY `.md` viewer (Notepad, VS Code, GitHub, Word, Google Docs, plain text editors) because they don't depend on a diagram-rendering engine like Mermaid. No special plugin needed.

Sources consolidated: `DO_IT_MASTER_DOCUMENTATION.md`, `IMPLEMENTATION_PHASES.md`, `detail_for_frontend.md`.

---

## 0. One-Paragraph Summary

Do It is a React Native (Expo/TypeScript) global service marketplace connecting **Clients** (post jobs, pay via wallet) and **Providers** (apply, complete work, get paid), for both **physical/local** jobs (geo-matched) and **digital/remote** jobs (skill-matched). Backend is a **Node.js + Express modular monolith** over **MongoDB Atlas**, with **Redis/Bull** for queues, **Socket.io** for realtime, **Stripe** for top-ups, **Wise** for payouts, and a ledger-first wallet/escrow system. Current build order: **mobile app + backend first**, **website (Next.js) + admin portal deferred to the final stage**, but the backend must stay forward-compatible for that later web layer.

---

## 1. High-Level Architecture (System Map)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DO IT PLATFORM — SYSTEM MAP                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐    │
│  │              │     │              │     │                      │    │
│  │  MOBILE APP  │     │    WEBSITE   │     │    ADMIN PORTAL      │    │
│  │  (Expo/RN)   │     │  (Next.js)   │     │    (Next.js)         │    │
│  │  * ACTIVE    │     │  DEFERRED    │     │    DEFERRED          │    │
│  │              │     │  (Phase 11)  │     │    (Phase 11)        │    │
│  └──────┬───────┘     └──────┬───────┘     └──────────┬───────────┘    │
│         │                    │                         │                │
│         │  HTTPS/REST        │  HTTPS/REST             │  HTTPS/REST    │
│         │  + Socket.io       │  + Socket.io            │                │
│         │                    │                         │                │
│         └────────────────────┼─────────────────────────┘                │
│                              │                                          │
│                              v                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                 API GATEWAY / EXPRESS SERVER  (/api/v1)           │  │
│  │                                                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │  Auth   │ │  Jobs   │ │ Wallet  │ │ Notify   │ │ Dispute  │  │  │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module   │ │ Module   │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘ └──────────┘  │  │
│  │                                                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │Proposal │ │  KYC    │ │ Review  │ │ Message  │ │  Fraud   │  │  │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module   │ │ Module   │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘ └──────────┘  │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              │                                          │
│              ┌───────────────┼───────────────┐                          │
│              v               v               v                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐          │
│  │   MongoDB    │  │    Redis     │  │   Bull Queue System  │          │
│  │    Atlas     │  │  (Cache +    │  │   (Async Workers)    │          │
│  │              │  │  Throttle +  │  │                      │          │
│  │  15+ collec- │  │  Sessions)   │  │  - Fraud Worker      │          │
│  │  tions       │  │              │  │  - Notify Worker     │          │
│  │  (source of  │  │              │  │  - FX Refresh        │          │
│  │  truth)      │  │              │  │  - Reconciliation    │          │
│  │              │  │              │  │  - Scheduled Jobs    │          │
│  └──────────────┘  └──────────────┘  └──────────────────────┘          │
│                                                                         │
│  ┌───────────────────── THIRD-PARTY ADAPTERS ──────────────────────┐   │
│  │  ┌─────────┐ ┌────────┐ ┌───────┐ ┌─────────┐ ┌───────────┐   │   │
│  │  │ Stripe  │ │  Wise  │ │  FCM  │ │SendGrid │ │  Twilio   │   │   │
│  │  │(top-up) │ │(payout)│ │(push) │ │(email)  │ │(SMS/OTP)  │   │   │
│  │  └─────────┘ └────────┘ └───────┘ └─────────┘ └───────────┘   │   │
│  │  ┌──────────────┐ ┌──────────────────────────────────────┐    │   │
│  │  │  MaxMind     │ │  AWS S3 / Cloudflare R2               │    │   │
│  │  │  (GeoIP)     │ │  (KYC docs, attachments, avatars)     │    │   │
│  │  └──────────────┘ └──────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key architectural rules (non-negotiable):**
- **Modular monolith first** — one deployable backend, clear module boundaries (not microservices yet).
- **Event-driven side effects** — e.g. `proposal:accepted` -> emits an event -> wallet escrow lock + notification + analytics update happen as reactions, not as inline chained calls.
- **Queue-backed async work** — anything non-critical or slow (fraud scoring, notification fan-out, FX refresh) goes through Bull/Redis, not the request/response cycle.
- **No frontend-specific logic in the persistence layer.** Response shaping for mobile vs. future web happens in dedicated mappers, never in domain/service logic.
- **API versioning** (`/api/v1`) and a **shared domain service layer** are what let the mobile app ship now and the website/admin plug into the *same* backend later without breaking changes.

---

## 2. Confirmed Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo SDK 51+), TypeScript only |
| Router | Expo Router (file-based, `app/` folder) |
| Mobile state | Zustand (global) + `useState` (local) |
| Mobile HTTP | Axios (`src/services/api.ts`) |
| Realtime client | Socket.io client |
| Mobile storage | `expo-secure-store` (tokens), MMKV (cache) |
| Maps/location | `expo-location`, `react-native-maps` |
| Backend API | Node.js + Express.js |
| Database | MongoDB Atlas |
| Cache / Queues | Redis + Bull |
| Realtime server | Socket.io |
| File storage | AWS S3 or Cloudflare R2 |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Payments (in) | Stripe (wallet top-up) |
| Payments (out) | Wise (payout / FX conversion) |
| Email | SendGrid |
| SMS / OTP | Twilio |
| Geolocation | MaxMind GeoIP2 |
| Future website/admin | Next.js — separate codebase, same backend |

---

## 3. Roles & Access Model

- **Client** — posts jobs, accepts proposals, funds escrow, confirms completion, leaves reviews.
- **Provider** — completes KYC, browses/applies to jobs, completes work, receives payouts.
- **Admin** — KYC review, dispute resolution, fraud review, moderation/ops. Admin endpoints get an extra hardening layer: role check + IP whitelist + MFA.

Auth mechanics: **JWT access tokens (short TTL)** + **refresh token rotation with revocation tracking** + **role-based authorization middleware** + device/session tracking for suspicious activity.

---

## 4. Core Business Flows

### 4.1 Onboarding & Verification

```
 USER            MOBILE APP           BACKEND API          TWILIO / SENDGRID
  │                   │                     │                      │
  │ Register(role)    │                     │                      │
  ├──────────────────>│  POST /auth/register│                      │
  │                   ├────────────────────>│                      │
  │                   │                     │  send email OTP      │
  │                   │                     ├─────────────────────>│
  │                   │                     │  send phone OTP      │
  │                   │                     ├─────────────────────>│
  │                   │<── pending_verify ──┤                      │
  │ Enter email OTP   │                     │                      │
  ├──────────────────>│ POST /verify-email  │                      │
  │                   ├────────────────────>│                      │
  │ Enter phone OTP   │                     │                      │
  ├──────────────────>│ POST /verify-phone  │                      │
  │                   ├────────────────────>│                      │
  │                   │<── JWT issued ──────┤                      │
  │                   │                     │                      │
  │      IF role == PROVIDER:                                      │
  │      ┌──────────────────────────────────────────────────┐      │
  │      │ App forces KYC flow (blocking).                  │      │
  │      │ Provider CANNOT post proposals, accept jobs,     │      │
  │      │ or receive payouts until kyc_status = approved.  │      │
  │      └──────────────────────────────────────────────────┘      │
  │      IF role == CLIENT:                                        │
  │      -> Route straight to (client)/home                        │
  │                   │                     │                      │
```

### 4.2 Job Lifecycle (State Machine)

```
                         ┌──────────┐
                  posts  │          │
            ┌───────────>│   OPEN   │
            │            │          │
            │            └────┬─────┘
            │                 │ proposal accepted
            │                 │ (escrow LOCKED)
            │  client cancels │
            │  (no proposal   v
            │   accepted)  ┌──────────────┐
            │              │ IN_PROGRESS  │──────────┐
            │              └──────┬───────┘          │ mutual /
            │                     │ provider marks    │ admin
            │                     │ done + client      │ cancel
            │                     │ confirms            │
            │                     v                     v
      ┌─────┴─────┐        ┌──────────────┐      ┌────────────┐
      │ CANCELLED │        │  COMPLETED   │      │ CANCELLED  │
      └───────────┘        └──────┬───────┘      └────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │ dispute raised                │ no dispute
                    │ (within evidence window)      │ (auto-close)
                    v                                v
             ┌────────────┐                   ┌────────────┐
             │  DISPUTED  │                   │   CLOSED   │
             └──────┬─────┘                   └────────────┘
                    │ admin verdict
                    v
             ┌────────────┐
             │  RESOLVED  │───────────────────> CLOSED
             └────────────┘
```

**Hard rules:**
- Exactly **one accepted proposal** per job.
- Escrow lock is **required** at the `open -> in_progress` transition.
- Payout only fires after **client confirmation** or a **dispute verdict** — never automatically on "provider marked complete" alone.
- Dispute outcomes are **immutable once finalized**, except via an admin correction flow that writes an audit log entry.

### 4.3 Matching Algorithm

```
                    ┌────────────────────────────────┐
                    │  New job posted OR provider     │
                    │  becomes available               │
                    └────────────────┬─────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │   Job type?          │
                          └──────────┬───────────┘
                 PHYSICAL            │             DIGITAL
          ┌──────────────────────────┴──────────────────────────┐
          v                                                     v
┌───────────────────────────┐                    ┌───────────────────────────┐
│ Filter candidates:         │                    │ Filter candidates:         │
│ - geo radius (2dsphere)    │                    │ - category/skill match     │
│ - category match            │                    │ - KYC approved             │
│ - KYC approved              │                    │ - rating >= min threshold  │
│ - availability = true       │                    │ - (NO geo constraint)      │
│ - rating >= min threshold   │                    │                             │
└──────────────┬─────────────┘                    └──────────────┬─────────────┘
               v                                                  v
┌───────────────────────────┐                    ┌───────────────────────────┐
│ Rank by:                   │                    │ Rank by:                   │
│ 1) distance (ascending)     │                    │ rating (desc),              │
│ 2) rating (descending)      │                    │ skill overlap (desc)        │
└──────────────┬─────────────┘                    └──────────────┬─────────────┘
               └──────────────────────┬───────────────────────────┘
                                      v
                    ┌──────────────────────────────────┐
                    │ Notify top-N matching providers    │
                    │ (push + in-app + socket event      │
                    │  "job:new_matching")               │
                    └────────────────┬───────────────────┘
                                     v
                    ┌──────────────────────────────────┐
                    │ Providers submit proposals          │
                    └────────────────┬───────────────────┘
                                     v
                    ┌──────────────────────────────────┐
                    │ Client accepts ONE proposal         │
                    └────────────────┬───────────────────┘
                                     v
                    ┌──────────────────────────────────┐
                    │ Auto-reject all other proposals    │
                    │ for this job                        │
                    └────────────────┬───────────────────┘
                                     v
                    ┌──────────────────────────────────┐
                    │ Emit "proposal:accepted" event      │
                    │ -> Escrow lock + notifications +    │
                    │    analytics update                 │
                    └──────────────────────────────────┘
```

Pseudocode for the ranking step:

```
function rankProviders(job, candidates):
    if job.type == "physical":
        candidates = filter(candidates, c =>
            c.kyc_status == "approved" and
            c.categories includes job.category_id and
            c.available == true and
            geoDistance(c.location, job.location) <= c.service_radius and
            c.rating >= MIN_RATING)
        return sortBy(candidates, [distanceAsc, ratingDesc])

    if job.type == "digital":
        candidates = filter(candidates, c =>
            c.kyc_status == "approved" and
            c.categories includes job.category_id and
            c.rating >= MIN_RATING)
        return sortBy(candidates, [ratingDesc, skillOverlapDesc])
```

### 4.4 Wallet, Escrow & Payment Flow (Ledger-First)

```
 CLIENT        BACKEND API         STRIPE        WALLET/LEDGER      PROVIDER        WISE
   │                │                 │                │               │             │
   │ Top-up wallet  │                 │                │               │             │
   │ (idempotency)  │                 │                │               │             │
   ├───────────────>│  create intent  │                │               │             │
   │                ├────────────────>│                │               │             │
   │                │<── webhook: paid│                │               │             │
   │                │                 │                │               │             │
   │                │  credit tx (immutable ledger row)│               │             │
   │                ├──────────────────────────────────>│               │             │
   │                │<─── wallet:updated (socket) ──────┤               │             │
   │                │                                    │               │             │
   │  ── Job proposal accepted ──                         │               │             │
   │                │  lock escrow sub-balance for job amount            │             │
   │                ├──────────────────────────────────>│               │             │
   │                │                                    │ escrow entry  │             │
   │                │                                    │ (job_id linked)│             │
   │                │                                    │               │             │
   │                │                                    │  <── provider marks complete ─┤
   │  confirm completion                                  │               │             │
   ├───────────────>│                                    │               │             │
   │                │  release escrow -> deduct fee -> credit provider    │             │
   │                ├──────────────────────────────────>│               │             │
   │                │                                    ├── wallet:updated ──────────>│
   │                │                                    │               │             │
   │                │                                    │  <── request payout ─────────┤
   │                │                                    │            (idempotency)     │
   │                │  initiate transfer (FX conversion)                                │
   │                ├───────────────────────────────────────────────────────────────────>│
   │                │<── webhook: payout settled ────────────────────────────────────────┤
   │                │  debit provider wallet, write ledger row           │               │
   │                ├──────────────────────────────────>│               │               │
```

**Rules:**
- **Ledger-first, immutable transactions.** Nothing is hard-deleted; corrections happen via new offsetting entries + audit log.
- All amounts normalized internally to **USD**; displayed in user-selected currency via cached FX rates.
- **Idempotency keys required** for: wallet top-up confirmation, escrow lock/release, payout initiation.
- **Atomic balance updates** using transactional safeguards / optimistic concurrency wherever money moves.
- **Reconciliation jobs** run against Stripe/Wise webhook history to catch drift.

### 4.5 Dispute Resolution

```
┌────────────────┐
│ Job completed   │
└────────┬────────┘
         v
┌─────────────────────────────┐   NO    ┌───────────────────────────┐
│ Dispute raised within        ├────────>│ Auto-close job             │
│ evidence window?              │         │ (funds already released)  │
└────────┬────────────────────┘         └───────────────────────────┘
         │ YES
         v
┌─────────────────────────────┐
│ Evidence upload window opens │
│ (both parties)                │
└────────┬────────────────────┘
         v
┌─────────────────────────────┐
│ Admin reviews evidence        │
└────────┬────────────────────┘
         v
┌─────────────────────────────┐
│ Admin issues verdict          │
└────────┬────────────────────┘
         │
   ┌─────┼──────────────┬───────────────────┐
   v     v               v                    │
Favor  Favor          Split                    │
Client Provider        (partial)                │
   │     │               │                      │
   v     v               v                      │
Escrow  Escrow      Partial release              │
refunded released   per verdict                  │
to client to provider                             │
   └─────┴───────────────┴──────────────────────┘
                    v
     ┌───────────────────────────────────┐
     │ Outcome + reason written to        │
     │ immutable dispute record +         │
     │ audit log                          │
     └───────────────────────────────────┘
```

### 4.6 Fraud Pipeline

```
┌───────────────────────────────────────────┐
│ Trigger points: registration, payment,      │
│ job milestone, account security event       │
└─────────────────────┬───────────────────────┘
                      v
┌───────────────────────────────────────────┐
│ Bull-based fraud rules engine                │
│ (async worker, NOT inline with request)      │
└─────────────────────┬───────────────────────┘
                      v
              ┌───────────────┐
              │ Risk evaluation│
              └───────┬────────┘
        ┌─────────────┼─────────────────────┐
        v             v                      v
  Low/no risk     Flagged             Explicit high-risk
        │             │               rule (policy-permitted)
        v             v                      v
 ┌─────────────┐ ┌───────────────┐   ┌───────────────────────┐
 │ No flag,     │ │ Create        │   │ Automatic temporary     │
 │ continue     │ │ fraud_flags   │   │ restriction              │
 │ normally     │ │ record        │   │ (still logged +          │
 └─────────────┘ │ (severity +   │   │  reviewable)             │
                  │ status=pending)│   └───────────────────────┘
                  └───────┬───────┘
                          v
                ┌───────────────────┐
                │ Admin review queue  │
                └─────────┬──────────┘
                  ┌────────┴────────┐
                  v                 v
             Confirm             Dismiss
                  │                 │
                  v                 v
      ┌───────────────────┐ ┌───────────────┐
      │ Account action      │ │ Flag closed,   │
      │ (restrict/suspend/  │ │ no action      │
      │  ban)                │ └───────────────┘
      └───────────────────┘
```

**Rule:** No automatic **permanent** bans without admin approval — the only exception is an explicitly policy-approved high-risk auto-rule, and even that stays reviewable/loggable.

### 4.7 Realtime Messaging & Notifications

```
┌───────────────────────────────────────────────────────────┐
│                    SOCKET.IO EVENT BUS                     │
│                                                             │
│   job:new_matching   proposal:new     proposal:accepted    │
│   job:status_changed  message:new     notification:new     │
│   wallet:updated                                            │
└───────────────────────────┬────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              v                            v
     ┌─────────────────┐         ┌──────────────────────┐
     │   Mobile App      │<------->│ Notifications Service │
     │ (subscribe/emit)  │         └──────────┬────────────┘
     └─────────────────┘                     │
                          ┌────────────────────┼────────────────────┐
                          v                    v                    v
                   ┌────────────┐      ┌──────────────┐     ┌────────────┐
                   │  FCM Push   │      │  SendGrid     │     │  Twilio    │
                   │             │      │  (email)      │     │  (SMS)     │
                   └────────────┘      └──────────────┘     └────────────┘
```

`messages` collection fields: `_id, job_id (nullable), conversation_id, sender_id, receiver_id, body, attachments[], message_type(text|image|file|system), read_by[], created_at, updated_at, deleted_at(soft delete)`.

---

## 5. Data Model (Entity Relationships)

```
┌───────────────────┐          ┌────────────────────────┐
│      USERS         │ 1 ─── 0..1│   PROVIDER_PROFILES     │
│ _id, email(UK)      │          │ user_id, location(2dsphere)│
│ phone(UK), role      │          │ categories, service_type │
│ kyc_status           │          │ service_radius, rating   │
└───────┬───────┬─────┘          └────────────────────────┘
        │       │
        │ 1     │ 1
        │       └────────────────┐
      1 v                        v
┌────────────────┐      ┌────────────────┐
│    WALLETS       │      │      JOBS       │ -- belongs to --> CATEGORIES
│ user_id(UK)       │      │ _id, client_id  │
│ balance_usd        │      │ category_id     │
│ escrow_locked       │      │ status          │
└────────┬──────────┘      │ job_type        │
         │ 1                │ created_at      │
         │                  └────┬───┬───┬────┘
         │ many                  │   │   │
         v                     1:N│ 1:N│ 1:N
┌────────────────┐               v   v   v
│  TRANSACTIONS    │      ┌──────────┐ ┌──────────┐ ┌──────────┐
│ job_id             │      │PROPOSALS │ │ MESSAGES │ │ REVIEWS  │
│ from_wallet_id      │      │job_id    │ │job_id    │ │(post-    │
│ to_wallet_id        │      │provider_id│ │(nullable)│ │completion)│
│ type, created_at    │      │status    │ │conv_id   │ └──────────┘
└────────────────┘      └──────────┘ └──────────┘

┌────────────────┐   ┌──────────────────┐   ┌────────────────┐
│  NOTIFICATIONS   │   │  KYC_DOCUMENTS     │   │  FRAUD_FLAGS    │
│  user_id          │   │  user_id            │   │  user_id         │
│  is_read           │   │  status             │   │  reviewed        │
│  created_at         │   │  created_at         │   │  severity        │
└────────────────┘   └──────────────────┘   └────────────────┘

All USERS relate to: NOTIFICATIONS, KYC_DOCUMENTS, FRAUD_FLAGS,
MESSAGES (as sender/receiver), REVIEWS (as writer/receiver) — 1-to-many.
```

**Collections:** `users, provider_profiles, jobs, proposals, wallets, transactions, reviews, notifications, categories, fraud_flags, kyc_documents, audit_logs, messages`.

**Mandatory indexes:**
- `users`: email (unique), phone (unique), `role + kyc_status`
- `provider_profiles`: `2dsphere(location)`, categories, service_type
- `jobs`: `status + created_at`, `client_id + status`, `provider_id + status`, `category_id + status`
- `proposals`: `job_id + provider_id` unique partial (active statuses only)
- `wallets`: `user_id` unique
- `transactions`: `job_id`, `from_wallet_id`, `to_wallet_id`, `type + created_at`
- `notifications`: `user_id + is_read + created_at`
- `messages`: `job_id + created_at`, `sender_id + created_at`
- `fraud_flags`: `user_id + reviewed + severity`
- `kyc_documents`: `user_id + status + created_at`

**Integrity rules:** never hard-delete financial records; use status transitions + audit logs for sensitive entities; enforce ObjectId reference existence at the service layer; transactional safeguards on money movement.

---

## 6. API Design Standards

- Prefix: **`/api/v1`**, resource-based route naming, consistent plural nouns.
- **Success envelope:** `{ success: true, data, meta? }`
- **Error envelope:** `{ success: false, error: { code, message, details? }, request_id }`
- Strict schema validation on every write endpoint; unknown fields rejected on protected endpoints.
- **Idempotency keys required** on: wallet top-up confirmation, escrow lock/release, payout initiation.
- Pagination: cursor-based for high-volume feeds, offset allowed for small admin lists.

---

## 7. Security Model

```
 Incoming Request
        │
        v
┌──────────────────────────────────────┐
│ Helmet + CORS allowlist + rate        │
│ limiting + payload limits             │
└───────────────────┬────────────────────┘
                    v
┌──────────────────────────────────────┐
│ JWT verification (short-lived         │
│ access token)                         │
└───────────────────┬────────────────────┘
                    v
┌──────────────────────────────────────┐
│ Role-based authorization middleware   │
└───────────────────┬────────────────────┘
                    v
            Admin endpoint?
           ┌────────┴────────┐
          YES                NO
           v                  v
┌────────────────────┐  ┌──────────────┐
│ + IP whitelist       │  │ Route handler │
│ + MFA enforcement    │  └──────┬───────┘
└──────────┬──────────┘         │
           └────────────────────┤
                                 v
                     Touches KYC / payout data?
                    ┌────────────┴────────────┐
                   YES                        NO
                    v                          v
        ┌───────────────────────┐    ┌──────────────────┐
        │ Encrypt at rest         │    │ Standard          │
        │ Signed URLs, strict     │    │ processing         │
        │ expiry. Never log       │    └──────────────────┘
        │ secrets/OTP/raw KYC     │
        └───────────────────────┘
```

- Refresh token rotation with revocation tracking; device/session tracking for anomaly detection.
- Double-entry-style ledger checks (logical), atomic balance updates, reconciliation jobs for Stripe/Wise callbacks.
- Structured JSON logs with `request_id` + `user_id`; immutable admin action audit logs.

---

## 8. Mobile Frontend — Structure & Conventions

### 8.1 Folder Structure (active project)

```
mobile/
├── app/                          ← Expo Router routes
│   ├── (auth)/                   login, register, otp-verify, forgot/reset password
│   ├── (onboarding)/             welcome (3-slide carousel), role-select
│   ├── (client)/                 home, post-job (3-step in 1 screen), my-jobs,
│   │                             job-detail/[id], proposals/[jobId], wallet,
│   │                             wallet-topup, wallet-withdraw, messages, profile
│   ├── (provider)/               home, browse-jobs, job-detail/[id], proposals,
│   │                             active-job/[id], earnings, kyc (4 states in 1), profile
│   ├── (shared)/                 chat/[id], public-profile/[id], notifications,
│   │                             settings, raise-dispute/[jobId], leave-review/[jobId]
│   ├── (help)/                   index, faq, faq-detail/[id], live-chat, tickets,
│   │                             new-ticket, ticket-detail/[id], report, safety
│   ├── index.tsx                 ← Splash
│   ├── _layout.tsx                ← Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/common/        Avatar, Badge, Button, Card, Input, Loader,
│   │                             BottomSheet, OTPInput, StarRating, ReviewCard,
│   │                             NotificationItem, ChatBubble, MapPreview
│   ├── components/job/           JobCard, ProposalCard, JobStatusBadge, CategoryGrid
│   ├── components/wallet/        TransactionItem
│   ├── context/                  AuthContext, ThemeContext
│   ├── hooks/                    useAuth, useTheme, useColorScheme(.web)
│   ├── navigation/                AppNavigator, ClientTabs, ProviderTabs
│   ├── services/                  api.ts, authService, jobService,
│   │                             socketService, walletService
│   ├── theme/                     colors.ts, typography.ts, index.ts
│   └── utils/                     formatCurrency, storage, validators
```

51 screens total across Onboarding, Auth, Client, Provider, Shared, and Help & Support groups.

### 8.2 Theme System

Both light and dark themes, switched automatically by device system setting. **Never hardcode hex colors in a screen** — always resolve through `Colors.light` / `Colors.dark` via `useColorScheme()`.

| Token | Light | Dark |
|---|---|---|
| primary | `#1A9E8F` | `#1A9E8F` (unchanged) |
| primaryMid | `#7ABFB8` | `#7ABFB8` |
| primaryLight | `#E0F4F2` | `#0F3330` |
| primaryDark | `#0D7A6E` | `#0F3330` |
| amber | `#F5A623` | `#F5A623` (unchanged) |
| amberLight | `#FEF3DC` | `#2A1F00` |
| success | `#27AE60` | `#27AE60` |
| error | `#E74C3C` | `#E74C3C` |
| warning | `#F39C12` | `#F39C12` |
| background | `#F0F4F4` | `#0D1F1E` |
| card | `#FFFFFF` | `#152E2C` |
| cardBorder | `#D0E8E6` | `#1F4A47` |
| textPrimary | `#1A1A1A` | `#E8F8F6` |
| textSecondary | `#666666` | `#7ABFB8` |
| textHint | `#AAAAAA` | `#4A7A75` |

**No blue palette anywhere in product UI.**

Mandatory pattern in every screen:
```tsx
const scheme = useColorScheme();
const isDark = scheme === 'dark';
const C = isDark ? Colors.dark : Colors.light;
const styles = makeStyles(C);
```

### 8.3 Spacing / Radius / Sizing System

| Token | Value |
|---|---|
| Screen horizontal padding | 20px |
| Section gap | 24px |
| Card internal padding | 16px |
| Between elements | 12px |
| Tight gap | 8px |
| Card radius | 16px |
| Button radius | 12px |
| Input radius | 10px |
| Pill radius | 20px / 9999 |
| Button height (large) | 52px |
| Button height (medium) | 44px |
| Input height | 52px |
| Bottom nav height | 60px + safe area |
| Min touch target | 44px |

### 8.4 Status Badge Colors

| Status | Light bg / text | Dark bg / text |
|---|---|---|
| open | `primaryLight` / `primary` | same tokens, dark values |
| in_progress | `amberLight` / `amber` | same tokens, dark values |
| completed | `#E8F8F2` / `success` | `#0F2E1F` / `success` |
| disputed | `#FDECEA` / `error` | `#2E1010` / `error` |
| cancelled | `divider` / `textHint` | same tokens, dark values |

### 8.5 Mandatory Screen Rules

1. TypeScript only (`.tsx`), never `.js`/`.jsx`.
2. Theme resolved via `useColorScheme()` at the top of every screen; `makeStyles(C)` factory at the bottom.
3. Wrap every screen root in `SafeAreaView`.
4. `ScrollView` for tall content, `KeyboardAvoidingView` around forms.
5. `FlatList` for any list > 5 items — never `map()` inside `ScrollView` for long lists.
6. Loading states: full-screen `Loader` while fetching; `ActivityIndicator` inside buttons while submitting.
7. Inline error text (12px, `C.error`) below fields; toast for API-level errors.
8. Every list screen needs an empty state (icon + title + subtitle + CTA).
9. Navigation via `expo-router`: `router.push`, `router.replace` (post-login/logout), `router.back`, `useLocalSearchParams`.
10. After login → `router.replace('/(client)/home')` or `/(provider)/home` by role. After logout → `/(auth)/login`.

---

## 9. Delivery Roadmap (Phases 0–13)

```
Timeline (sprints) ──────────────────────────────────────────────────────────>

[Foundations]      P0 Program Setup       ▓▓
                    P1 Auth & Identity        ▓▓
                    P2 KYC & Provider Activ.     ▓▓

[Core Marketplace]  P3 Jobs Core                    ▓▓
                    P4 Proposals & Matching            ▓▓

[Money]             P5 Wallet/Escrow/Ledger              ▓▓▓▓
                    P6 Payouts/FX/Multi-currency                ▓▓

[Trust]             P7 Disputes & Reviews                          ▓▓
                    P8 Messaging & Realtime                            ▓▓
                    P9 Fraud & Security                                   ▓▓

[Completion]        P10 Mobile Frontend + QA                                 ▓▓▓▓
                    P11 Website + Admin (DEFERRED)                                 ▓▓▓▓
                    P12 Perf & Stabilization                                             ▓▓
                    P13 Launch & Post-launch                                                ▓▓
```

| Phase | Focus | Exit Criteria (summary) |
|---|---|---|
| 0 | Repos, CI, env scaffolding, mobile+backend bootstrap | Fresh clone runs backend+app locally; CI green |
| 1 | Register/login/refresh/logout, email+phone OTP, password reset | End-to-end onboarding works both roles; abuse protection live |
| 2 | KYC upload (signed URLs), admin approve/reject, provider profile setup | Non-approved providers blocked from restricted actions |
| 3 | Post job, browse feed, geo indexing, status transitions | Jobs creatable/discoverable; filtering validated |
| 4 | Submit/withdraw proposal, accept/reject, matching engine, notifications | One-accepted-provider rule enforced; stable under load |
| 5 | Wallet model, Stripe top-up + webhook, escrow lock/release, fees, ledger | Money paths tested happy+failure; idempotency/reconciliation pass |
| 6 | Payout request, Wise integration, FX cache refresh, currency display | Payout path validated in staging; FX/USD consistency checks pass |
| 7 | Dispute creation+evidence window, admin verdicts, reviews | Full disputed-job state machine operational, auditable |
| 8 | `messages` collection, Socket.io events, FCM push, notification center | Realtime chat + notifications functional both roles |
| 9 | Bull fraud rules engine, fraud_flags + admin review, security hardening pass | Fraud alerts actionable; no unresolved high-risk security gaps |
| 10 | All 51 screens, responsive QA, accessibility pass | Full screen inventory live on APIs; QA sign-off |
| 11 | **[Deferred]** Public website + admin portal (Next.js) | Website/admin production-ready, responsive+accessible |
| 12 | DB/query/cache tuning, load/soak testing | p95 latency + stability targets met in staging |
| 13 | Production rollout, runbooks, feature flags, monitoring | Successful staged launch, hotfix pipeline validated |

**Milestones:** M1 = Auth+KYC+Jobs Core (0–3) · M2 = Matching+Escrow+Payout (4–6) · M3 = Disputes+Realtime+Fraud (7–9) · M4 = Mobile completion + Website/Admin + Stabilization + Launch (10–13)

**Cross-phase workstreams (continuous):** QA/test automation · documentation/ADRs · security & compliance scanning · analytics/funnel instrumentation.

**Top risks:** payment reconciliation complexity, KYC operational bottlenecks, realtime scaling, geolocation/matching edge cases, contract drift if website/admin (deferred) starts late. **Mitigations:** early staging integrations, idempotent/replay-safe webhooks, dead-letter queue retries, admin override tools with audit logs, shared API schema checks in CI.

---

## 10. Performance & Reliability Targets

| Metric | Target |
|---|---|
| API p95 latency (core reads) | < 400ms |
| App screen interactive readiness | < 2.5s on mid-tier device |
| Crash-free sessions | ≥ 99.5% |

Backend levers: Redis caching for read-heavy endpoints (categories, settings, FX rates), queue offloading, index optimization pre-launch, circuit breaker/retry on third-party calls.
Mobile levers: paginated/lazy feeds, image optimization/caching, memoized selectors to avoid rerenders, offline-tolerant UX for retryable actions.

---

## 11. Definition of Done (Program Level)

The app is complete when: all core client/provider flows are implemented and production-tested; wallet/escrow/dispute flows pass reconciliation and audit checks; KYC and fraud review are usable by the admin team; realtime messaging/notifications are stable under load; responsive behavior is validated across device classes; and security baseline + performance SLOs are met in staging and production.

---

## 12. Open Items Still To Resolve

- Exact platform fee defaults per region/category
- KYC provider choice for automated verification (vs. manual review)
- Chargeback / refund policy edge cases
- Country-specific legal compliance for payouts and wallet holding
- Data retention policy for KYC documents and chat attachments

---

## 13. How To Use This Document With Another LLM

Paste this entire file as context, then prompt with something like:

> "Using the Do It platform architecture above, [build screen X / write the escrow release endpoint / design the fraud rule for Y / explain how a dispute affects the ledger] — follow the stack, folder structure, theme tokens, and business rules exactly as specified."

The LLM now has: the full data model, every state machine, the matching algorithm, the money-movement sequence, the security/idempotency rules, the mobile folder/theme/component conventions, and the phase-by-phase build order — everything needed to reason about or generate any part of the system consistently.
