# Do It Admin Dashboard: Documentation v2 (Gap Analysis and Full Spec)

Based on: Admin Dashboard Spec (2026-08-10), Admin Frontend Context, Master Documentation, Implementation Phases, and Phase 4 to 10 documents. Everything is marked **Built** (documented as done in your files), **Partial**, or **To build**. Nothing here was verified by running the code, so confirm each Built item against the source.

## 1. Requirement Check (Your List vs Current State)

| # | Requirement | Backend | Admin web UI | Verdict |
| --- | --- | --- | --- | --- |
| 1 | See all users | Not built (GET /admin/users missing) | Not started | **Gap** |
| 2 | See user devices | Not built. Device data exists only as device\_info on user and in the fraud module (block-device, fingerprints); no admin read endpoint | Not started | **Gap** |
| 3 | Approve / reject KYC | Built (/kyc/admin/\*) | Not started | **UI gap** |
| 4 | See all service categories | Not documented for admin. Phase 3 lists category and skill CRUD, but no admin endpoints or screens are specified | Not specified | **Gap** |
| 5 | Review provider service verification, approve / reject with reasons | Built (/providers/admin/records, review) | Not started | **UI gap**, plus rejection reasons are a single free-text field |
| 6 | Complete profile of a provider | One endpoint missing (GET /providers/admin/profiles/:id) | Not started | **Gap** |
| 7 | Complete profile of a client | Nothing exists | Not started | **Gap** |
| 8 | See all jobs | Admin can transition a job, but there is no admin list or detail endpoint (browse is built for providers only) | Not specified | **Gap (build)** |
| 9 | Wallets: view and manage | Partial: GET /wallet/admin/wallets and POST /wallet/admin/adjustment exist. No admin transactions, ledger, escrow or payout views | Not specified | **Gap** |
| 10 | Payment integrations (Stripe, Connect, Wise) | Built on the backend; admin visibility and controls missing | Not specified | **Gap** |
| 11 | Oversight of everything else (disputes, reviews, fraud, notifications) | Built (see section 5.10 to 5.12) | Not started | **UI gap** |

**Bottom line:** the existing admin spec covers only users, KYC, verification and provider profile (and only 4 of those 11 requirements have a backend). The admin web UI is not started for anything. Jobs, categories, wallets, devices, client profiles and payment oversight were never specified, so this document specifies them.

## 2. Architecture and Conventions

| Item | Decision |
| --- | --- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, route group under /admin |
| API | Same backend, base /api/v1, JWT with role admin, envelope { success, data, meta } |
| API client | web/lib/api.ts apiRequest(path, options) only; never raw fetch |
| Design | Teal #1A9E8F and amber #F5A623, no blue anywhere, light theme for v1 |
| Pagination | Users, KYC: page and limit. Verification: skip and limit. New list endpoints: use page and limit and say so in the contract |
| Every screen | Handles loading (skeleton), loaded, empty, error with retry |
| Destructive actions | Confirm modal, required reason (min 3 chars), toast, audit log entry |
| Money | Integer cents in USD; display conversion only in the UI |

### Navigation (sidebar)

Dashboard, Users, KYC Review, Verification, Service Categories, Jobs, Wallets and Payments, Disputes, Reviews, Fraud and Security, Notifications, Audit Log.

## 3. Screen Inventory (Target)

| # | Screen | Route | Priority |
| --- | --- | --- | --- |
| 1 | Admin Login | /admin/login | P0 |
| 2 | Dashboard Home | /admin | P1 |
| 3 | User List | /admin/users | P0 |
| 4 | User Detail (with Devices tab) | /admin/users/\[id\] | P0 |
| 5 | Full Profile: Provider | /admin/users/\[id\]/profile | P1 |
| 6 | Full Profile: Client | /admin/users/\[id\]/profile (client variant) | P1 |
| 7 | KYC Queue | /admin/kyc | P0 |
| 8 | KYC Detail | /admin/kyc/\[userId\] | P0 |
| 9 | Service Categories | /admin/categories | P1 |
| 10 | Verification Queue | /admin/verification | P1 |
| 11 | Verification Detail | /admin/verification/\[recordId\] | P1 |
| 12 | Jobs List | /admin/jobs | P1 |
| 13 | Job Detail (proposals, escrow, dispute) | /admin/jobs/\[id\] | P1 |
| 14 | Wallets List | /admin/wallets | P1 |
| 15 | Wallet Detail (balance, escrow, ledger) | /admin/wallets/\[userId\] | P1 |
| 16 | Transactions | /admin/transactions | P1 |
| 17 | Payouts | /admin/payouts | P2 |
| 18 | Disputes Queue and Detail | /admin/disputes, /admin/disputes/\[id\] | P2 |
| 19 | Reviews Moderation | /admin/reviews | P2 |
| 20 | Fraud Flags, Cases, Rules | /admin/fraud | P2 |
| 21 | Notifications Broadcast | /admin/notifications | P3 |
| 22 | Audit Log | /admin/audit | P3 |

## 4. Authentication and Access

- Login with POST /auth/login. If the returned role is not admin, show an error and store nothing.
- Store access and refresh tokens; on 401 refresh once, otherwise redirect to /admin/login. On 403 show Not authorized.
- Admin sub-roles (super-admin, support, finance) are mentioned in the original design but are not in any backend contract. Decide whether you need them for the demo; if yes, add an adminRole field and guard wallet adjustment and payouts to finance and super-admin.
- IP whitelist and MFA are documented as requirements, not as implemented features. Do not claim them in your report unless they exist in the code.

## 5. Module Specifications

### 5.1 Users (Requirement 1)

**Status:** backend To build; UI not started.

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | /admin/users | To build |
| GET | /admin/users/:userId | To build |
| PATCH | /admin/users/:userId | To build (role, ban, unban) |
| DELETE | /admin/users/:userId | To build (soft deactivate with reason) |

**List query params:** page, limit (max 100), search (min 2 chars: name, email, phone), role (client, provider, admin, pending), email\_verified, phone\_verified, kyc\_status, overall\_status, track, sort\_by, sort\_order.

**List columns:** name with email and phone, role, country, email/phone verified icons, KYC status, overall status (providers only), joined date, banned flag.

**Backend notes:** add a denormalised kyc\_status field on User (updated on KYC submit, approve, reject) to avoid a join per row. Index role, createdAt and kyc\_status. Every ban, role change and deactivation must write an audit\_logs entry (admin id, before, after, ip).

**Acceptance:** admin can search, filter and page through all users; click a row to open detail; ban and unban with a reason; changes are audited.

### 5.2 User Devices and Sessions (Requirement 2)

**Status:** To build. There is no documented endpoint that lists a user devices. Sources that exist: device\_info on the user, device fingerprints in fraud flag context, refresh-token device and session tracking in the auth design.

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | /admin/users/:userId/devices | To build |
| GET | /admin/users/:userId/sessions | To build |
| POST | /admin/users/:userId/sessions/revoke | To build (revoke refresh tokens) |
| POST | /fraud/block-device | Built |
| POST | /fraud/lock-account | Built |

**Device record to expose:** deviceId or fingerprint, platform, model/OS, app version, last IP, country, first seen, last seen, fcm token present (boolean only, never the token), blocked flag.

**Decision for you:** if the backend does not currently store a device list per user, the cheapest correct design is a user\_devices collection written at login and token refresh (userId, fingerprint, ip, userAgent, lastSeenAt). Add it before building the UI, otherwise the Devices tab will be empty.

**UI:** Devices tab on User Detail with a table, a Revoke sessions button and a Block device action (reason required).

### 5.3 KYC Review (Requirement 3)

**Status:** Backend built. UI not started.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | /kyc/admin/submissions?status= | Flat array, no pagination, no user name or email |
| GET | /kyc/admin/submissions/:userId | Includes document and liveness images |
| PATCH | /kyc/admin/:userId/approve | No body; promotes pending to provider |
| PATCH | /kyc/admin/:userId/reject | Body { reason } required |

**Gaps to fix:** (1) list response should include fullName and email so the queue is readable; (2) add pagination before real volume; (3) images are base64 data URIs (24-hour TTL KycImage records), so an admin opening a submission after the TTL may see broken images. Confirm what happens to the images after approval and extend retention or move to S3/R2 signed URLs; (4) uploads under /uploads need a protected static route.

**Screens:** KYC queue with tabs (Pending, Approved, Rejected, All); detail with front/back document, four liveness photos, lightbox, approve, and reject with required reason.

**Acceptance:** admin approves a provider and that provider enters the dashboard on next status refresh; reject shows the reason in the app and allows resubmission.

### 5.4 Service Categories (Requirement 4)

**Status:** Not specified for admin. The data model has categories (multilingual name, slug, parent, icon, sort order, active) and Phase 3 introduces skill\_categories and skill\_items (name, job\_type, requires\_certificate, supports\_auto\_test). Your documents are inconsistent here: the original schema has one categories collection, Phase 3 has two. Confirm which collections exist in the code.

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | /admin/categories | To build (categories with item counts and provider counts) |
| POST | /admin/categories | To build |
| PATCH | /admin/categories/:id | To build (name, job\_type, icon, active, sort order) |
| POST | /admin/categories/:id/skill-items | To build |
| PATCH | /admin/skill-items/:id | To build |
| DELETE | /admin/categories/:id | Soft-deactivate only (active = false); never hard delete categories referenced by jobs or verification records |

**UI:** table grouped by job type (physical, digital, errand) showing active flag, number of skill items, number of verified providers, number of verification records pending. Edit drawer with skill items list. Show for each category the verification requirement (certificate required, auto-test supported).

**Acceptance:** admin sees every category and its skill items, adds or deactivates one, and the mobile category picker reflects the change.

### 5.5 Provider Service Verification (Requirement 5)

**Status:** Backend built, UI not started.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | /providers/admin/records | Filters: status, category\_id, sla\_overdue, limit, skip |
| GET | /providers/admin/records/:recordId | Evidence payload, auto\_check\_result, audit trail |
| GET | /providers/admin/records/:recordId/audit-trail | History |
| POST | /providers/admin/records/:recordId/review | action approve, reject, request\_info; reason required for reject and request\_info |

**Your requirement: reject based on the error or anything that is missed.** The current backend stores a single free-text reason. Recommended small extension so the provider app can show exactly what to fix:

- Add optional missing\_items to the review body: an array of codes such as certificate\_unreadable, license\_expired, photos\_insufficient, portfolio\_unreachable, wrong\_category, identity\_mismatch, other.
- Store missing\_items on AdminReview and on the VerificationRecord, return them to the provider with the free-text reason, and show them as a checklist in the resubmit screen.
- Optionally allow per-evidence-item flags (this certificate rejected, others fine). This is a nice-to-have; the checklist above is enough for the demo.

**UI:** queue with status, category, SLA-overdue toggle, provider and evidence type; detail with an evidence viewer that renders every key of evidence\_payload generically (physical bundle: photos, certificates; digital bundle: portfolio, oauth, certificates; errand trust bundle: background check, vehicle docs, service area, references), auto-check card (GitHub score, URL check), audit trail, and the decision bar (Approve, Request Info, Reject). Disable actions when status is not pending\_review or scheduled (409 RECORD\_NOT\_PENDING).

**Acceptance:** admin can open a provider submission, see all evidence, approve or reject with listed missing items, and the provider overall\_status updates (verified, partially\_verified, rejected).

### 5.6 Complete Profile: Provider (Requirement 6)

**Status:** One endpoint to add.

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | /providers/admin/profiles/:providerId | To build (reuse serializeProviderProfile) |

**Screen sections:** header (avatar, name, headline, city, track), completeness ring with missing fields, universal profile (bio, languages, availability, public flag), active-track details (physical, digital or errand fields), selected categories, KYC status link, verification records list with statuses, ratings and review count, jobs completed, wallet summary link, device and fraud flags summary. Read-only.

### 5.7 Complete Profile: Client (Requirement 7)

**Status:** To build. There is no client-profile contract in any document.

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | /admin/users/:userId/overview | To build (works for any role) |

**Recommended response for a client:** account info and verification flags, country, joined and last seen, wallet balance and escrow balance, job counts by status, total spent, recent jobs (5), disputes raised, reviews written, fraud flags count, active devices count, ban state.

**Design advice:** build one overview endpoint that returns a role-specific block (client block or provider block) instead of separate endpoints per role. The profile screen then renders by role. This also covers the admin and pending roles with a minimal view.

### 5.8 Jobs (Requirement 8)

**Status:** Admin view To build. What exists: job model with state machine, POST /jobs/:id/status (admin allowed for all transitions), POST /jobs/:id/assign-provider (admin allowed), GET /jobs/:id, proposals endpoints, GET /proposals/job/:jobId.

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | /admin/jobs | To build |
| GET | /admin/jobs/:jobId | To build (job, client, provider, proposals, escrow, dispute, reviews) |
| POST | /jobs/:id/status | Built (admin may force a transition; require a reason and audit it) |
| PATCH | /admin/jobs/:jobId/moderation | To build (feature, unfeature, remove inappropriate) |
| GET | /admin/jobs/stats | To build (counts by status, type, GMV) |

**List filters:** status, type (physical, digital, errand), category, client, provider, country or city, budget range, created date range, has dispute, escrow state (none, locked, released, refunded), search by title or id.

**List columns:** title, type, status badge, client, provider, budget, applications count, escrow state, created date.

**Detail sections:** job summary and requirements (type-specific), location map for physical and errand (hidden for digital), timeline of status changes, proposals table with accept state, escrow panel (locked amount, fee, transaction ids), dispute panel link, reviews, admin actions (cancel with refund, force complete, reassign provider only with reason).

**Rules:** any forced status change must call the same service methods as the normal flow so escrow release or refund still runs; never update status directly in the database. Show a clear warning before force actions.

### 5.9 Wallets, Escrow and Payments (Requirements 9 and 10)

**What is built (backend):** wallet balance, top-up with Stripe PaymentIntent and webhook, transaction history, double-entry ledger, escrow lock, release and refund, platform fee, provider payout request, Stripe Connect Express onboarding, Wise recipient and transfer, FX rates, payout scheduler and webhooks, GET /wallet/admin/wallets, POST /wallet/admin/adjustment.

**What is missing for admin:**

| Method | Endpoint | Status | Purpose |
| --- | --- | --- | --- |
| GET | /wallet/admin/wallets | Built | List wallets |
| POST | /wallet/admin/adjustment | Built | Manual credit/debit (needs reason and audit) |
| GET | /admin/wallets/:userId | To build | Wallet detail, balances, escrow, recent transactions |
| GET | /admin/transactions | To build | All transactions with filters (type, status, user, job, date, amount) |
| GET | /admin/ledger?transactionId= | To build | Ledger entries of a transaction, with a balanced-check flag |
| GET | /admin/escrow | To build | All jobs with locked escrow, amount, age |
| GET | /admin/payouts | To build | List payouts and status (pending, processing, completed, failed, cancelled) |
| POST | /admin/payouts/:id/cancel | To build | Cancel a pending payout and reverse the debit (payout\_reversal) |
| POST | /admin/payouts/:id/retry | To build | Retry a failed payout |
| GET | /admin/finance/summary | To build | Totals: top-ups, escrow held, platform fee earned, payouts, failed payments |
| GET | /admin/payments/webhooks | To build | Recent Stripe and Wise webhook events and failures |
| GET | /admin/reconciliation | To build | Result of the reconciliation job (drift between ledger and Stripe/Wise) |

**Screens:**

- **Finance overview:** cards for escrow held, platform fee earned, pending payouts, failed payments and flagged transactions.
- **Wallets list:** user, role, balance, escrow, available, last transaction, active flag.
- **Wallet detail:** balances (and per-currency balances if Phase 7 multi-currency is live), transaction list, ledger drill-down, adjustment form (amount, direction, reason, confirm modal).
- **Transactions:** filterable table with a detail drawer showing metadata (Stripe PaymentIntent id, idempotency key, job id) and linked ledger entries.
- **Payouts:** queue with status and Wise or Stripe Connect reference, failure reason, cancel and retry actions.
- **Integrations health panel:** status of Stripe (webhook secret set, last webhook received), Stripe Connect, Wise (API key set, last transfer webhook), FX rate cache age. Show configured or not configured only; never display keys.

**Rules and risks:**

1. The manual adjustment endpoint is the most dangerous feature in the system. Require reason, confirmation, an immutable audit log entry and, ideally, the finance sub-role.
2. Admin must not edit or delete transactions or ledger entries. Corrections are offsetting entries only.
3. Your Phase 6 doc says the wallet has one balance, while the Phase 7 doc changes it to a map of per-currency balances. Check the actual schema before building the wallet detail screen.
4. Platform fee is stated as 12% in one document and 10% in others. Show the configured value from the backend, not a hardcoded one.
5. Mismatches between the Stripe dashboard and the ledger should surface in the reconciliation view; if the reconciliation job is not implemented, say so in your report.

### 5.10 Disputes and Reviews

**Status:** Backend built (Phase 8), UI not started.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /disputes/admin | Dispute list with filters and stats |
| GET | /disputes/admin/:id | Detail with evidence from both parties |
| POST | /disputes/:id/resolve | Verdict: client\_wins, provider\_wins, split (splitPercentage) with reasoning |
| POST | /disputes/:id/extend-deadline | Extend the evidence window |
| POST | /reviews/:id/moderate | Approve or remove a flagged review |

**UI:** dispute queue (status tabs), evidence viewer (documents, images, links, text), job and escrow summary, verdict form with preview of the money split and platform fee, confirmation. Reviews moderation table of flagged reviews with approve and remove.

### 5.11 Fraud, Security and Audit

**Status:** Backend built (Phase 10), UI not started.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /fraud/flags, /fraud/flags/:id | Flags with severity and evidence |
| POST | /fraud/flags/:id/review | Confirm, false positive, dismiss, escalate |
| POST | /fraud/flags/bulk | Bulk update |
| GET, POST | /fraud/cases, /fraud/cases/:id/resolve | Investigation cases |
| GET, POST, PATCH, DELETE | /fraud/rules | Rule management |
| POST | /fraud/block-ip, /block-device, /lock-account, /require-2fa | Security actions |
| GET | /fraud/stats, /fraud/export | Statistics and CSV/JSON export |

**Gap:** your Phase 10 document lists an audit log viewer only as a mobile screen. An admin audit log list endpoint (GET /admin/audit-logs with filters admin, action, target, date) is not documented. To build, because every sensitive action in this document depends on it.

### 5.12 Notifications

| Method | Endpoint | Status |
| --- | --- | --- |
| POST | /messaging/admin/notifications | Built (send to users) |
| POST | /messaging/admin/notifications/bulk | Built |

**UI:** compose form (title, body, channels in-app/push/email, audience: all, role, specific users) with preview and confirmation. Note that segment targeting (for example all providers in one country) is not in the documented contract.

### 5.13 Dashboard Home

Cards: pending KYC, pending verification, SLA overdue, open disputes, flagged fraud, jobs by status, escrow held, platform fee earned, new users (7 days). Today the spec derives these from list responses. Add GET /admin/stats so the dashboard does not fetch full lists.

## 6. Consolidated List of Backend Work Still Needed

| Priority | Endpoint or change | Needed for |
| --- | --- | --- |
| P0 | GET/PATCH/DELETE /admin/users | Users, ban, role |
| P0 | kyc\_status on user, fullName/email in KYC list, KYC image retention fix | KYC queue |
| P1 | GET /admin/users/:id/overview | Client and provider full profile |
| P1 | GET /providers/admin/profiles/:id | Provider profile |
| P1 | GET /admin/users/:id/devices and sessions, user\_devices collection | Devices |
| P1 | GET /admin/jobs, /admin/jobs/:id, /admin/jobs/stats | Jobs |
| P1 | Admin category and skill-item CRUD | Service categories |
| P1 | missing\_items on verification review | Rejection by missed items |
| P1 | GET /admin/transactions, /ledger, /escrow, /wallets/:id, /finance/summary | Wallet and payments oversight |
| P2 | GET/POST /admin/payouts, cancel, retry | Payouts |
| P2 | GET /admin/payments/webhooks, /reconciliation | Payment integration health |
| P2 | GET /admin/audit-logs | Audit |
| P2 | GET /admin/stats | Dashboard |
| P3 | Admin sub-roles, IP whitelist, MFA | Hardening |

## 7. Build Order

1. Foundation: env, auth store, guard, login, shell layout, shared components (table, filter bar, pagination, status pill, modal, evidence viewer, lightbox).
2. KYC queue and detail (backend ready, fastest win).
3. Verification queue and detail (backend ready), then add missing\_items.
4. Users list, detail, devices (build backend first).
5. Profile overview for provider and client.
6. Jobs list and detail.
7. Wallets, transactions, escrow, payouts, integrations health.
8. Disputes, reviews, fraud, notifications, audit log, dashboard.

## 8. Definition of Done for the Admin Module

| Check | Done when |
| --- | --- |
| Users | Admin lists, searches, filters, bans and opens any user |
| Devices | Admin sees devices and sessions of a user and can revoke or block |
| KYC | Admin approves and rejects with reason; provider app reflects it |
| Categories | Admin sees all categories and skill items and can add or deactivate |
| Verification | Admin reviews evidence, approves or rejects with missing items; provider overall\_status updates |
| Profiles | Admin opens full provider and client profiles |
| Jobs | Admin lists and filters all jobs, opens detail with proposals and escrow, can cancel or force-complete with audit |
| Wallets and payments | Admin sees all wallets, transactions, ledger, escrow and payouts, and integration status; adjustments are audited |
| Oversight | Disputes, reviews, fraud flags and notifications are manageable |
| Security | Every admin write action is audited; no keys or tokens are exposed |

## 9. Inconsistencies in Your Documents (Fix Before Building)

1. Wallet schema: single USD balance (Phase 6) versus per-currency maps (Phase 7).
2. Platform fee: 12% (first documentation) versus 10% (Phase 6 and 7).
3. Categories: one categories collection versus skill\_categories plus skill\_items.
4. Phase numbering differs between the master roadmap, the phase files and the architecture pack.
5. The admin spec says the web is not started and uses the date 2026-08-10, while later phases (8, 9, 10) were completed after that date; the spec does not mention disputes, wallets, fraud or reviews at all.
6. Several flows in the Phase documents are described as complete while mobile TypeScript shows strictness warnings; list them honestly in your report instead of claiming a clean build.

## 10. Sources of Truth Used

Admin Dashboard Spec, Admin Frontend Context, Master Documentation, Implementation Phases, Provider Onboarding and Verification design, and Phase 4, 5, 6, 7, 8, 9 and 10 documents. If any Built item above does not match the code, the code wins and this document should be corrected.
