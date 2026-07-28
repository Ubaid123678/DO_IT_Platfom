# Do It Platform - Implementation Phases

Version: 2.0
Last updated: 2026-07-24
Purpose: Delivery roadmap to build the complete mobile app and shared backend first, then finalize website and admin portal in the final stage.

For a condensed system architecture overview before reading this roadmap, see [LLM_ARCHITECTURE_PACK.md](LLM_ARCHITECTURE_PACK.md).

## Delivery Model

- Approach: Vertical slices with strong platform foundations
- Cadence: 2-week sprints (adjustable)
- Environments: local -> dev -> staging -> production
- Launch strategy: staged rollout by region
- Execution mode update (2026-04-10): website/admin implementation is deferred until mobile app completion milestone.

## Phase 0 - Program Setup and Architecture Baseline

Duration: 1 sprint

Goals:
- Initialize repositories/workspace structure for mobile app, backend, and deferred website track
- Define coding standards, branching model, PR templates, and CI baseline
- Set up environment configuration and secret management pattern

Deliverables:
- Monorepo or coordinated repos decided and initialized
- Backend service bootstrap (Express modular structure)
- Mobile app bootstrap (Expo + navigation + theme tokens)
- Website bootstrap only (scaffold reserved for final-stage implementation)
- CI pipeline for lint/test/build
- Environment templates (.env.example) for all services

Exit Criteria:
- Fresh clone can run backend and app locally; website scaffold is optional in active delivery
- CI passes on default branch

### What was actually implemented (Phase 0)

Backend:
- Express + TypeScript scaffold with modular structure (`backend/src/modules/`)
- Base middleware stack (helmet, cors, rate limiting)
- Health endpoints: `GET /health`, `GET /api/v1/health`
- Environment configuration via `backend/src/config/env.ts`
- Environment templates: `backend/.env`, `backend/.env.example`

Mobile:
- Expo React Native app template initialized with TypeScript
- Source-based frontend structure (`mobile/app/`, `mobile/src/`)
- Theme token system at `mobile/src/theme/colors.ts`
- Reusable UI primitives: `Button.tsx`, `Input.tsx`, `Loader.tsx`
- Custom hooks: `useColorScheme`, `useClientOnlyValue` (+ web variants)

Website:
- Next.js template initialized with TypeScript + Tailwind + ESLint
- Scaffold structure: `web/app/`, `web/public/`

Documentation:
- `docs/DO_IT_MASTER_DOCUMENTATION.md`
- `docs/IMPLEMENTATION_PHASES.md`
- `docs/SPRINT_TASK_BOARD.md`
- `docs/IMPLEMENTATION_STATUS.md`

Utility:
- Root launcher: `start-dev.js`
- Unified `.gitignore` covering all workspaces

Verification:
- Backend build: Passed
- Backend run (localhost:8080): Passed
- Website dev server (localhost:3000): Passed
- Mobile web (localhost:8081): Passed

---

## Phase 1 - Identity, Auth, and Account Foundation

Duration: 1 sprint

Goals:
- Build secure authentication and user profile foundation
- Implement role handling (client/provider/admin)

Deliverables:
- Register, login, refresh, logout
- Email OTP verification flow
- Phone OTP verification flow
- Password reset flow
- Basic profile read/update endpoints
- Session and token revocation support

Exit Criteria:
- End-to-end onboarding works for both client and provider
- Auth abuse protection baseline active (rate limits, lockouts, audit logs)

### What was actually implemented (Phase 1)

Backend (`backend/src/modules/auth/`):
- Mongo user auth model with verification, reset, and role fields
- Auth API endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/verify-phone`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh-token`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `GET /api/v1/auth/me`
  - `PATCH /api/v1/auth/me`
  - `POST /api/v1/auth/resend-otp`
- Joi validation for all endpoints
- JWT token helpers (access + refresh token rotation)
- OTP generation with email (SendGrid) and phone (Twilio) provider support
- Debug mode bypass (`OTP_DEBUG_MODE=true` returns `debugOtp` in response)
- Auth middleware for protected endpoints (JWT verification with refresh interceptor)
- Auth lockout: failed login tracking + temporary account lock
- Auth audit logging for key security actions
- API router registration + database bootstrap wiring
- Auth HTTP integration tests with Vitest + Supertest

Mobile frontend (`mobile/app/`, `mobile/src/`):
- Auth screens connected to live APIs:
  - `app/auth/login.tsx`
  - `app/auth/forgot-password.tsx`
  - `app/auth/reset-password.tsx`
  - `app/onboarding/register.tsx`
  - `app/onboarding/otp.tsx`
- Auth service at `src/services/authService.ts` with full endpoint methods and types
- Token management: AsyncStorage-based access/refresh token storage
- Axios interceptor for automatic 401 → token refresh → retry
- Token expiry detection on app resume for proactive re-authentication
- Email/phone OTP verification flow with resend support
- Password reset flow (forgot → email OTP → reset)
- Role selection (client/provider) at registration entry
- Verified-first routing: pending-role selection blocks dashboard entry
- Rate-limit error handling on OTP/resend endpoints

Verification:
- Backend build: Passed
- Backend auth tests: 12 tests passing
- Mobile TypeScript: Clean compilation
- E2E flows validated: register → verify email → verify phone → login → refresh → logout
- OTP debug mode delivery verified
- Rate-limit error responses confirmed working

---

## Phase 2 - KYC and Identity Verification

Duration: 1 sprint

Goals:
- Enforce provider identity trust gating through KYC

Deliverables:
- KYC document upload pipeline (S3/R2 signed URLs)
- KYC status tracking in app
- Admin KYC review endpoints (approve/reject + reason)

Exit Criteria:
- Non-approved providers blocked from restricted actions
- KYC review process operational for admin users

### What was actually implemented (Phase 2)

Backend (`backend/src/modules/kyc/`):
- Mongoose models: `kyc_documents` (KycDocument) and `kyc_images` (KycImage with 24h TTL)
- KYC endpoints:
  - `GET /api/v1/kyc/provider/status` — current KYC state + latest document
  - `GET /api/v1/kyc/provider/restricted-access` — access gate check
  - `POST /api/v1/kyc/provider/upload-image` — accepts multipart (`req.file`) or base64 JSON (`req.body.data`)
  - `POST /api/v1/kyc/provider/submit` — create new KYC submission
  - `POST /api/v1/kyc/provider/resubmit` — resubmit after rejection
  - `GET /api/v1/kyc/admin/submissions` — list all submissions (admin)
  - `GET /api/v1/kyc/admin/submissions/:userId` — submission detail (admin)
  - `PATCH /api/v1/kyc/admin/:userId/approve` — approve KYC
  - `PATCH /api/v1/kyc/admin/:userId/reject` — reject with reason
- Base64 image upload support: reads file as base64 data URL, stores as `KycImage` record
- Multipart (multer) image upload fallback for `req.file`
- KYC status state machine: `pending → approved | rejected`, resubmit allowed after rejection
- Role promotion: user role auto-upgraded from `pending` to `provider` on KYC approval
- Provider role gate middleware for KYC-restricted actions
- Joi validation for all upload/submit/review endpoints
- KYC service + HTTP integration tests (12 tests passing)

Mobile frontend:
- `src/services/kycService.ts` — full API service with types (`KycStatus`, `KycDocument`, `KycSubmissionPayload`)
- `src/components/KycFlow.tsx` — extracted KYC flow component (reusable by layout and route)
  - 5-step form wizard: Document Selection → Document Capture → Liveness Check → Review → Submit
  - Status screens: Under Review (pending), Rejected (reason + retake), Approved
  - Image upload via base64 + `api.post()` with 60s timeout
  - All 4 liveness steps (face_clear, move_left, move_right, smile)
  - Manual "Refresh Status" button on all non-approved screens
  - `useFocusEffect` auto-refresh on screen focus
- `app/(provider)/kyc.tsx` — thin route wrapper, redirects to home if already approved
- `app/(provider)/_layout.tsx` — KYC gate: checks status on mount, renders `<KycFlow>` instead of `<Tabs>` until approved
- `app/(provider)/home.tsx` — KYC verification banner removed (gated at layout level)
- No "Back to Home" / "Home" navigation from KYC status screens (prevents bypassing gate)

Image upload approach:
- Base64 JSON via `api.post()` is the reliable path (Android multipart/FormData has issues)
- Backend accepts both: `req.file` (multipart via multer) and `req.body.data` (base64 data URL)
- Server config: 50mb body limit, 600s/610s timeouts, 60s client upload timeout

Verification:
- Backend build: Passed
- Backend tests: 12 tests passing (service + integration)
- Mobile TypeScript: Clean compilation
- Token refresh interceptor: verified 401 → refresh → retry
- Tested working on physical Android device (base64 upload path)

Production notes (see `PRODUCTION_MIGRATION.md`):
- Switch image upload from base64 to multipart → S3 for production
- Disable `OTP_DEBUG_MODE`
- Add mobile image compression via `expo-image-manipulator`
- Enable SendGrid/Twilio production credentials

---

## Phase 3 - Provider Onboarding & Verification System

Duration: 1-2 sprints

Goals:
- Build provider skill verification pipeline for physical and digital tracks
- Enable category and skill selection as part of provider onboarding

Deliverables:
- Category & skill management (CRUD for skill_categories, skill_items collections)
- Provider category/skill selection endpoints
- Physical verification: certificate/license upload, prior work photos
- Digital verification: certificate upload, portfolio links
- Admin verification review queue (approve/reject/request-info with audit trail)
- Provider status aggregator (overall_status: incomplete/pending/partially_verified/verified/rejected)
- Verification status tracking and resubmission flow
- Resume upload & parsing pipeline with structured editor
- OAuth platform integration (GitHub MVP)
- Auto-verification workers for credential URLs, OAuth signals

New collections:
- `verification_records` — per-skill-item evidence submissions with polymorphic evidence payload
- `admin_reviews` — immutable audit trail for every admin action on a verification record
- `resume_parse_results` — raw parser output kept separate from canonical provider fields

Exit Criteria:
- Provider can complete full onboarding: signup → KYC → category selection → skill verification → dashboard
- Admin can review and approve/reject verification records via API
- Provider dashboard reflects locked/partial/full access based on verification status
- Auto-verification workers trigger on eligible submissions (credential URLs, platform OAuth)

---

## Phase 4 - Jobs Core (Create, Browse, Manage)

Duration: 1 sprint

Goals:
- Implement job lifecycle core up to open state management

Deliverables:
- Client post job flow (physical/digital)
- Provider browse feed with filters
- Client job list and detail endpoints
- Geo indexing and query support
- Status transition validations for open/cancel rules

Exit Criteria:
- Jobs can be created, discovered, and managed reliably
- Location and category filtering validated

## Phase 5 - Proposals and Matching Engine

Duration: 1 sprint

Goals:
- Enable provider applications and client selection flow

Deliverables:
- Submit/withdraw proposal
- Client proposal review and accept/reject actions
- Auto-reject other proposals when one is accepted
- Matching algorithm execution for physical and digital jobs
- Notification trigger integration for proposal/job events

Exit Criteria:
- One accepted provider per job rule enforced
- Matching and proposal workflow stable under load tests

## Phase 6 - Wallet, Escrow, and Ledger (Critical)

Duration: 2 sprints

Goals:
- Implement trusted financial core

Deliverables:
- Wallet model and balance operations
- Stripe top-up initiation + webhook reconciliation
- Escrow lock on proposal acceptance
- Escrow release on completion confirmation
- Platform fee deduction logic
- Immutable transaction ledger records

Exit Criteria:
- Money movement paths fully tested (happy + failure paths)
- Idempotency and reconciliation checks passing

## Phase 7 - Payouts, FX, and Multi-Currency

Duration: 1 sprint

Goals:
- Complete provider earnings withdrawal experience

Deliverables:
- Provider payout request flow
- Wise transfer integration
- FX rate cache refresh jobs
- Display currency conversion pipeline
- Earnings and wallet transaction screens complete

Exit Criteria:
- End-to-end payout path validated in staging
- FX display and stored USD consistency checks pass

## Phase 8 - Disputes, Reviews, and Resolution

Duration: 1 sprint

Goals:
- Protect transaction trust and quality signals

Deliverables:
- Dispute creation flow with evidence upload windows
- Admin dispute verdict endpoints and audit logs
- Escrow outcome routing by verdict
- Review submission after completion
- Review moderation support hooks

Exit Criteria:
- Full disputed-job state machine operational
- Auditability confirmed for every dispute outcome

## Phase 9 - Messaging, Notifications, and Realtime

Duration: 1 sprint

Goals:
- Deliver responsive communication and event visibility

Deliverables:
- messages collection and chat APIs
- Socket.io realtime updates for chat and job events
- FCM push events for critical triggers
- In-app notifications center and read state management
- Email/SMS templates and event wiring for key flows

Exit Criteria:
- Real-time chat and notifications functional on both roles
- Notification delivery and retry paths monitored

## Phase 10 - Fraud Detection and Security Hardening

Duration: 1 sprint

Goals:
- Raise trust and resilience before scale

Deliverables:
- Bull-based fraud rules engine (initial rule set)
- fraud_flags creation and admin review actions
- Security hardening pass (auth, input validation, logging hygiene, SSRF/file upload checks)
- Abuse controls for OTP, payment attempts, and suspicious sessions

Exit Criteria:
- Fraud alerts visible and actionable
- Security checklist completed with no unresolved high-risk gaps

## Phase 11 - Frontend Completion and Responsive QA

Duration: 1-2 sprints

Goals:
- Complete all 51 mobile screens and ensure responsive quality

Deliverables:
- All screens implemented with confirmed light/dark theme tokens
- Cross-device responsive validation (small phone, standard phone, phablet, tablet)
- Accessibility pass (font scaling, contrast, semantics)
- UX polish for loading/empty/error/success states

Exit Criteria:
- Full screen inventory complete and connected to live APIs
- QA sign-off for responsiveness and interaction quality

## Phase 12 - Website and Admin Portal Finalization (Deferred Until App Complete)

Duration: 1-2 sprints

Goals:
- Build and finalize public website and private admin portal after app completion

Deliverables:
- Public website pages implemented (home, how it works, categories, trust and safety, help, legal)
- Private admin portal pages implemented for admin workflows
- Admin UI connected to existing backend admin endpoints
- Responsive QA across mobile web, tablet, laptop, and desktop
- Performance and SEO baseline setup for public pages

Exit Criteria:
- Website pages and private admin portal are production-ready and content complete
- Responsive and accessibility QA sign-off achieved

## Phase 13 - Performance, Reliability, and Pre-Launch Stabilization

Duration: 1 sprint

Goals:
- Ensure scale-readiness and operational confidence

Deliverables:
- DB query and index optimization pass
- Cache strategy tuning for high-traffic endpoints
- Queue backpressure and retry policy tuning
- Load test and soak test execution
- Crash and error monitoring thresholds in place

Exit Criteria:
- Target p95 API and app performance metrics met in staging
- Website/admin performance baseline met in staging
- Stability metrics pass release threshold

## Phase 14 - Production Launch and Post-Launch Operations

Duration: 1 sprint + monitoring window

Goals:
- Controlled production rollout and rapid feedback loops

Deliverables:
- Production deployment runbook
- Incident response and rollback procedures
- Feature flags for phased regional enablement
- Post-launch dashboards and daily health review routine

Exit Criteria:
- Successful initial rollout with no critical unresolved incidents
- Post-launch hotfix pipeline validated

## Cross-Phase Workstreams (Run Continuously)

## A) QA and Test Automation
- Build and maintain unit/integration/E2E suites from Phase 1 onward
- Block merges for critical flow regressions

## B) Documentation
- Keep API specs, architecture docs, and runbooks updated each sprint
- Capture major decisions as ADRs

## C) Security and Compliance
- Threat modeling updates at major feature milestones
- Dependency and secret scanning in CI

## D) Analytics and Product Insight
- Event tracking instrumentation for core conversion funnel
- Track onboarding completion, job success rate, dispute frequency

## Recommended Team Sequencing

- Backend team starts Phases 0-4 quickly with mobile consuming mocks where needed
- Website/admin implementation starts after app core completion (Phase 12)
- Payments/disputes/fraud are treated as critical-path features
- Mobile frontend progresses continuously by module while backend contracts stabilize
- Final pre-launch requires full-stack hardening together including deferred website/admin stage

## Milestone View (High Level)

- Milestone M1: Auth + KYC + Provider Onboarding (Phases 0-3)
- Milestone M2: Jobs Core + Matching + Escrow + Payout (Phases 4-7)
- Milestone M3: Disputes + Realtime + Fraud (Phases 8-10)
- Milestone M4: Mobile completion + Website/Admin finalization + Stabilization + Launch (Phases 11-14)

## Dependency and Risk Notes

Top dependencies:
- Stripe and Wise account readiness
- FCM, Twilio, SendGrid production credentials
- MaxMind license and legal region checks
- Cloud storage compliance for KYC data

Top risks:
- Payment reconciliation complexity
- KYC operational bottlenecks
- Realtime scaling and notification reliability
- Geolocation quality and edge-case matching logic
- Contract drift when deferred website/admin implementation begins late

Mitigations:
- Early staging integrations
- Idempotent financial operations and replay-safe webhooks
- Queue-based retries with dead-letter handling
- Admin override tools with audit logs
- Shared API schema checks in CI for app and website

## Phase Completion Checklist Template

Use this checklist at the end of every phase:
- Scope items implemented
- Test coverage updated
- Security review completed
- Documentation updated
- Demo accepted by stakeholders
- Rollback plan validated

## Next Step After Approval

Begin implementation with:
- Phase 0 task board creation
- Sprint breakdown for Phase 0 + Phase 1
- Repository scaffolding and CI bootstrap

Detailed sprint execution board:
- docs/SPRINT_TASK_BOARD.md
