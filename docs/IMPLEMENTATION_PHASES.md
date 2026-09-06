# Do It Platform - Implementation Phases

Version: 2.3
Last updated: 2026-08-11 (Phase 5 "What was actually implemented" section added with full detail matching Phase 1-4)
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
- Build provider skill verification pipeline for physical, digital, and errand tracks
- Enable category and skill selection as part of provider onboarding

Deliverables:
- Category & skill management (CRUD for skill_categories, skill_items collections)
- Provider category/skill selection endpoints
- Physical verification: certificate/license upload, prior work photos
- Digital verification: certificate upload, portfolio links
- Errands & Delivery verification: Trust Bundle (background/character check, vehicle documents, service area, references) — one record per errand category
- Skill item flag: requires_vehicle for errand skills (drives the vehicle-document evidence requirement)
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
- Errand providers can complete Trust Bundle verification (background check, vehicle docs, service area) and be reviewed by admin
- Admin can review and approve/reject verification records via API
- Provider dashboard reflects locked/partial/full access based on verification status
- Auto-verification workers trigger on eligible submissions (credential URLs, platform OAuth)

### What was actually implemented (Phase 3)

Backend (`backend/src/modules/verification/`):
- **Models** (6): `SkillCategory`, `SkillItem`, `VerificationRecord`, `AdminReview`, `ConnectedAccount`, `ResumeParseResult` with proper indexes, enums, `toJSON` transforms
- **Validation** (`verification.validation.ts`): Joi schemas for `selectCategories`, `submitEvidence`, `resubmitEvidence`, `updateProfile`, `connectOAuth`, `adminReview`, `adminListQuery`, `queryCategories`, `uploadResume`
- **Service** (`verification.service.ts`):
  - Category/skill item listing and selection (flat `{ categories[], skill_items[] }` from mobile)
  - Evidence submission with SLA calculation and `overall_status` recomputation
  - Record listing/detail/resubmission
  - Profile get/update (headline, bio, experience, languages, work_history, education)
  - Resume upload with parse result tracking
  - Verification status aggregation (per-category status derivation)
  - Admin queue listing/review/audit trail with immutable `AdminReview` records
- **Auto-verification service** (`verification-auto.service.ts`):
  - `verifyGitHubUsername` — fetches public GitHub profile + repos, analyzes for skill-relevant keywords, computes verification score (0-1), auto-approves at ≥0.7
  - `verifyCredentialUrl` — HEAD request to verify URL validity (200-399)
  - `applyAutoVerification` — updates record status + `auto_check_result` based on score
  - `connectOAuthPlatform` — creates/updates connected accounts, runs GitHub verification inline
  - `getConnectedAccounts` — lists all connected platform accounts
- **Bull worker** (`verification.worker.ts`):
  - `verification` queue with 2 job types: `oauth-verify` and `credential-url-verify`
  - Graceful fallback: if Redis unavailable, runs inline verification synchronously
  - Initialized in server bootstrap (`initializeVerificationWorker`)
- **Controller** (`verification.controller.ts`) — 15 handlers:
  - `listCategories`, `listSkillItems`, `selectCategories`, `getSelectedCategories`
  - `submitEvidence`, `listMyRecords`, `getRecordDetail`, `resubmitEvidence`
  - `getVerificationStatus`, `getProfile`, `updateProfile`, `uploadResume`, `getResumeParseResult`
  - `connectGithub` (real GitHub verification), `getConnectedAccounts`, `submitEvidenceWithAutoVerify`
- **Routes** (`verification.routes.ts`) — 16 routes:
  - Public: `GET /categories`, `GET /categories/:categoryId/skill-items`
  - Provider: `POST /categories`, `GET /categories`, `GET /verification-status`, `GET/POST /verification-records`, `POST /verification-records/:id/resubmit`, `POST /verification-records/auto-verify`, `GET/PATCH /profile`, `POST /resume/upload`, `GET /resume/parse-result/:id`, `POST /oauth/github/connect`, `GET /oauth/accounts`
  - Admin: `GET /admin/records`, `GET /admin/records/:id`, `GET /admin/records/:id/audit-trail`, `POST /admin/records/:id/review`
- **Seed data** (`seed.ts`): 40 categories (20 physical, 20 digital) with 185 skills; run with `npm run seed`

Modified existing backend files:
- `auth.model.ts` — added provider fields: `categories_selected`, `skill_items_selected`, `overall_status`, headline, bio, languages, work_history, education, resume_file_url, public_profile, `track`, `provider_profile`, `track_data`
- `upload.ts` — added `handleResumeUpload` middleware (PDF/DOC, 5MB limit); fixed pre-existing TS cast errors
- `routes/index.ts` — mounted verificationRouter at `/api/v1/providers`
- `index.ts` — initialized verification worker in bootstrap
- `kyc.controller.ts` — fixed `return res.json(...)` → `res.json(...); return` for TS asyncHandler compat

Mobile frontend (`mobile/src/components/verification/`, `mobile/app/(provider-verification)/`):
- **All 11 wizard step components** + navigation infrastructure:
  1. `CategorySelectionStep` — pick 1-3 categories (no close/back button — user must complete wizard)
  2. `SkillSelectionStep` — multi-select skills per category
  3. `EvidenceTypeChoiceStep` — choose cert/prior_work/portfolio/OAuth (skill_test and in_person_test removed)
  4. `CertificateUploadStep` — camera/gallery + issuing body + credential ID
  5. `PriorWorkPhotosStep` — 3-10 photos with captions
  6. `PortfolioLinkStep` — URL + description
  7. `OauthIntegrationStep` — username input → calls `verificationService.connectGithub()` → shows verification score → continue
  8. `ResumeBioStep` — PDF upload + manual editor + skip
  9. `StatusHubScreen` — per-category status badges
  10. `RejectionDetailScreen` — rejection reason + resubmit CTA
  11. `BackgroundCheckStep`, `VehicleDocsStep`, `ServiceAreaReferencesStep` — errand Trust Bundle evidence
- **Infrastructure**:
  - `VerificationWizardContext.tsx` — 14-action reducer, removed `skill-test` from WizardStep
  - `verificationService.ts` — `connectGithub(username, skillKeywords)` → `OAuthConnectResult`; `getConnectedAccounts()`; `submitEvidenceWithAutoVerify()`
  - `(provider-verification)/_layout.tsx` — KYC gate → verification check → AsyncStorage
  - `(provider-verification)/index.tsx` — step component router
- **Deleted**: `mobile/src/components/verification/SkillTestStep.tsx`

**Wiring fixes applied**:
- Fixed URL double-prefix (`/api/v1` in both baseURL and paths)
- Fixed backend route paths to match mobile URLs
- Fixed request body shape for selectCategories (mobile sends flat arrays)
- Fixed response extraction (`.data.categories`, `.data.records`, `.data.record`)
- Fixed field names (`_id` → `id` across all mobile interfaces, `category_id`/`category_name` in status)
- Added `active` field to `listCategories` backend response
- Fixed duplicate route registration (moved selected-categories path)
- Fixed BackHandler to prevent Android back from navigating to dead screen

Per-track Profile Completion (post-Phase-3 enhancement, `docs/PROFILE_COMPLETION_PER_TRACK.md`):
- **Backend**:
  - `auth.model.ts` — added `ProviderTrack`, `LanguageItem`, `AvailabilityWindow`, `ProviderProfile`, `PhysicalTrackData`, `DigitalTrackData`, `ErrandTrackData`, `TrackData` types and `track`/`provider_profile`/`track_data` fields on user document
  - `verification.validation.ts` — per-track Joi schemas; `updateProfile` accepts nested `{ provider_profile?, track_data? }`
  - `verification.service.ts` — `resolveProviderTrack` (single-track lock), `computeCompleteness` (required ~60% + optional ~40% scoring), `serializeProviderProfile`, `serializePublicProfile`; rewritten `updateProfile` (off-track rejection, errand transport gate via `errandRequiresVehicle`, errand `service_area` mirrored read-only from verified Trust Bundle); `selectCategories` rejects multi-track selections; `getPublicProfile` with `public_profile` privacy gate; `uploadResumeFile` mirrors resume into `track_data.digital.resume_file_url`
  - `verification.controller.ts`/`verification.routes.ts` — added `GET /providers/:providerId/public` and `POST /providers/profile/avatar`
  - `upload.ts` — added avatar upload middleware (images, 10MB, `uploads/avatar`)
- **Mobile**:
  - `verificationService.ts` — added new profile/track types, nested `updateProfile`/`getProfile` signatures returning `ProviderProfileResponse`, `getPublicProfile(providerId)`, `uploadAvatar(uri, mimeType)`
  - `ProfileCompletionStep.tsx` (**new**, replaces `ResumeBioStep`) — universal section (photo upload, headline, bio, city, languages, availability, visibility toggle) + per-track sections (physical: experience/radius/tools/rates/travel; digital: skills/stack/rates/timezone/English/work history/education/resume upload; errand: transport/fees/payload/capabilities with read-only verified service area); skip preserved; live completeness meter
  - `(provider-verification)/index.tsx` — `review-approved` and `resume-bio` steps now render `ProfileCompletionStep`
  - `StatusHubScreen.tsx` — added "Profile X% complete" card with missing-fields hint + CTA back into wizard
  - `(provider)/profile.tsx` — completion nudge card + "Edit Provider Profile" menu row routing to wizard
  - `(shared)/public-profile/[id].tsx` — fetches real `getPublicProfile` endpoint (falls back to mock data on error)
- **UI Improvements** (2026-08-11):
  - Multi-select dropdown modals with search for Languages, Availability days/shifts, Transport mode, Team size, Timezone, English proficiency (replaced chip buttons)
  - City field made optional for digital track (remote work), required for physical/errand

Verification results:
- Backend `npx tsc --noEmit` clean
- Backend `npx vitest run` — 12/12 tests pass
- Mobile `npx tsc --noEmit` clean

Notes:
- Public profile viewer still relies on mock reviews/portfolio; real endpoint returns core profile data
- `profile.tsx` remains largely mock-driven for stats/reviews; only completion nudge and Edit Profile row are live
- Backend `computeCompleteness` defaults `public_profile = false` — existing providers treated as private until they set it
- Resume upload still uses multipart transport (candidate for base64 migration if it fails on device)

---

## Phase 4 - Jobs Core (Create, Browse, Manage)

Duration: 1 sprint

Goals:
- Implement job lifecycle core up to open state management

Deliverables:
- Client post job flow (physical/digital/errand)
- Provider browse feed with filters
- Client job list and detail endpoints
- Geo indexing and query support
- Status transition validations for open/cancel rules

Exit Criteria:
- Jobs can be created, discovered, and managed reliably
- Location and category filtering validated

### What was actually implemented (Phase 4)

Backend (`backend/src/modules/jobs/`):
- **Model** (`job.model.ts`): Complete Job schema with 2dsphere geo-indexing, status state machine (open → in_progress → completed → cancelled → disputed → resolved), budget (fixed/hourly), schedule, requirements, escrow, dispute, review tracking, virtual fields for timeUntilStart and duration, instance methods for canBeCancelled and canTransitionTo
- **Validation** (`job.validation.ts`): Joi schemas for createJob, updateJob, browseJobsQuery, jobStatusTransition, clientJobQuery, providerJobQuery with proper conditional logic
- **Service** (`job.service.ts`): createJob (with category/skill validation), getJobById (with view count increment), updateJob (open only), browseJobs (geo $near queries, filters, sorting, text search), getClientJobs, getProviderJobs, transitionStatus (permission-based), assignProvider, incrementApplications, deleteJob, getJobStats, searchJobs
- **Controller** (`job.controller.ts`): 10 handlers — createJob, getJobById, updateJob, browseJobs, getClientJobs, getProviderJobs, transitionStatus, assignProvider, deleteJob, getJobStats, searchJobs
- **Routes** (`job.routes.ts`): 11 endpoints mounted at `/api/v1/jobs`:
  - `POST /jobs` — Create job (client only)
  - `GET /jobs/:jobId` — Get job detail
  - `PATCH /jobs/:jobId` — Update job (client, open only)
  - `DELETE /jobs/:jobId` — Delete job (client, open/cancelled only)
  - `GET /jobs/browse` — Browse with filters (type, category, budget, geo, experience, sort)
  - `GET /jobs/search` — Text search with filters
  - `GET /jobs/client` — Client's jobs with status filter
  - `GET /jobs/provider` — Provider's assigned jobs with type filter
  - `GET /jobs/client/stats` — Client job statistics
  - `GET /jobs/provider/stats` — Provider job statistics
  - `POST /jobs/:jobId/status` — Transition status (permission-based)
  - `POST /jobs/:jobId/assign-provider` — Assign provider (client/admin)
- **Modified**: `src/routes/index.ts` to mount jobs router at `/api/v1/jobs`

Mobile frontend:
- **Job Service** (`mobile/src/services/jobService.ts`): Complete typed API client with Job, JobType, JobStatus, BudgetType interfaces and methods for createJob, getJobById, updateJob, deleteJob, browseJobs, searchJobs, getClientJobs, getProviderJobs, transitionStatus, assignProvider, getJobStats, getProviderJobStats
- **Job Creation Context** (`mobile/src/context/JobCreationContext.tsx`): Reducer-based state management for 7-step wizard with validation
- **Job Creation Wizard** (7 step components in `mobile/src/components/jobs/`):
  1. `JobTypeStep` — Physical/Digital/Errand selection with icons
  2. `JobDetailsStep` — Title (min 5 chars) + Description (min 20 chars) with char counts
  3. `JobLocationStep` — Auto-detect via expo-location + manual city/address/country
  4. `JobBudgetStep` — Fixed vs Hourly toggle, amount/rate/hours inputs with platform fee preview
  5. `JobScheduleStep` — Flexible toggle, start/end dates, timezone dropdown, preferred days/shifts chips
  6. `JobRequirementsStep` — Category chips (1-3), experience level, language chips, certification/vehicle checkboxes
  7. `JobReviewStep` — Full summary with fee breakdown, terms acceptance, submit
- **Job Browse Feed** (`mobile/app/(provider)/browse-jobs.tsx`): Geo-aware feed with type/category/budget/radius/experience filters, sort (newest/budget/distance/urgency), stats tabs (All/Open/In Progress/Completed/Cancelled), pull-to-refresh, infinite scroll, empty states
- **Job Detail** (`mobile/app/(shared)/job-detail/[jobId].tsx`): Full view with status badges, budget/schedule/requirements/client/provider info, role-based status actions (client: complete/cancel/dispute; provider: complete/cancel/dispute), bottom action bar
- **Client Job Management** (`mobile/app/(client)/my-jobs.tsx`): Status tabs with counts, job cards with applicant counts, navigation to detail
- **Provider Job Management** (`mobile/app/(provider)/browse-jobs.tsx`): Type filter + status tabs, assigned jobs with completion actions
- **Expo-location** integration for auto-detecting user location in job creation wizard

Job Status State Machine (server-enforced):
- `open` → `in_progress` (provider assigned) → `completed` (client confirms) | `cancelled` (client/provider) | `disputed`
- `completed` → `disputed` (within evidence window)
- `disputed` → `resolved` (admin verdict: client_wins/provider_wins/split)
- Permission-based transitions: only job owner can cancel open jobs; only assigned provider can start/complete; client confirms completion

Geo Features:
- 2dsphere index on `job.location` for MongoDB geo queries
- `$near` queries with configurable radius (default 50km, max 500km)
- Auto-detect user location via expo-location (high accuracy)
- City/country fallback for non-GPS searches
- Distance display in job cards

Verification results:
- Backend `npx tsc --noEmit` clean
- Backend `npx vitest run` — 12/12 tests pass
- Mobile `npx tsc --noEmit` clean
- Expo-location installed and integrated

Notes:
- Escrow locking/release delegated to Wallet module (Phase 6)
- Proposals/Applications module to be built in Phase 5
- Review submission endpoint to be added in Phase 5
- Admin job moderation endpoints to be added in Phase 5
- Matching engine execution triggered on job creation (Phase 5)

---

## Phase 5 - Proposals and Matching Engine

Duration: 1 sprint

Goals:
- Enable provider applications and client selection flow

Deliverables:
- Submit/withdraw proposal
- Client proposal review and accept/reject actions
- Auto-reject other proposals when one is accepted
- Matching algorithm execution for physical, digital, and errand jobs (errand = geo radius + verified errand provider + service-area match)
- Notification trigger integration for proposal/job events

Exit Criteria:
- One accepted provider per job rule enforced
- Matching and proposal workflow stable under load tests

### What was actually implemented (Phase 5)

Backend (`backend/src/modules/proposals/`):
- **Model** (`proposal.model.ts`): Complete Proposal schema with compound indexes (jobId+providerId unique), status state machine (submitted → accepted|rejected|withdrawn|expired), bid types (fixed/hourly), virtual fields for bidTotal, instance methods for accept/reject/withdraw
- **Validation** (`proposal.validation.ts`): Joi schemas for createProposal, updateProposal, proposalQuery, clientProposalAction
- **Service** (`proposal.service.ts`): createProposal (with category verification), getProposalById, getProposalsForJob (client), getProviderProposals, acceptProposal (auto-rejects others), rejectProposal, withdrawProposal, getJobProposalStats, expireOldProposals
- **Controller** (`proposal.controller.ts`): 9 handlers for all endpoints
- **Routes** (`proposal.routes.ts`): 10 endpoints mounted at `/api/v1/proposals` including matching endpoints
- **Matching Engine** (`matching.service.ts`): Geo-aware provider matching with skill overlap, rating, availability, distance scoring; auto-match with notification support
- **Modified**: `src/routes/index.ts` to mount proposals router at `/api/v1/proposals`

Mobile frontend:
- **Proposal Service** (`mobile/src/services/proposalService.ts`): Complete typed API client with Proposal, ProposalStatus, BidType interfaces and all CRUD/matching methods
- **Proposal Submission** (`mobile/app/(provider)/submit-proposal/[jobId].tsx`): Fixed vs Hourly bid toggle, amount/rate/hours inputs with platform fee preview, cover letter, timeline
- **Client Proposal Management** (`mobile/app/(client)/job-proposals/[jobId].tsx`): Tabbed view (All/Submitted/Accepted/Rejected/Withdrawn), stats cards, accept/reject actions with auto-reject others
- **Provider Proposal Management** (`mobile/app/(provider)/my-proposals.tsx`): Status tabs, withdraw action, bid/timeline preview
- **Proposal Detail** (`mobile/app/(shared)/proposal-detail/[proposalId].tsx`): Full view with bid breakdown, cover letter, provider/client info, role-based actions (client: accept/reject; provider: withdraw)
- **Matching Engine Integration**: Client can trigger matching from job proposals screen

Proposal Status State Machine:
- submitted → accepted (client, auto-rejects others) | rejected (client) | withdrawn (provider) | expired (system)
- Acceptance triggers job assignment and transitions job to in_progress
- All transitions permission-enforced server-side

Matching Engine Features:
- Provider filtering by verified categories, skills, rating, availability
- Geo-distance filtering with service radius for physical/errand jobs
- Skill overlap scoring (0-100) based on job requirements vs provider skills
- Match score combines skill overlap (40%), rating (25%), category match (20%), availability (15%)
- Configurable radius, rating threshold, result limits
- Auto-match with notification integration ready

Verification results:
- Backend `npx tsc --noEmit` clean
- Backend `npx vitest run` — 12/12 tests pass
- Mobile `npx tsc --noEmit` clean

Notes:
- Escrow locking/release on proposal acceptance delegated to Wallet module (Phase 6)
- Review submission endpoint to be added in Phase 6
- Admin proposal moderation endpoints to be added in Phase 6
- Advanced matching (ML-based ranking) deferred to post-MVP

---

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

- Milestone M1: Auth + KYC + Provider Onboarding incl. Errands & Delivery Trust verification (Phases 0-3)
- Milestone M2: Jobs Core + Matching + Escrow + Payout (Phases 4-7)
- Milestone M3: Disputes + Realtime + Fraud (Phases 8-10)
- Milestone M4: Mobile completion + Website/Admin finalization + Stabilization + Launch (Phases 11-14)

## Dependency and Risk Notes

Top dependencies:
- Stripe and Wise account readiness
- FCM, Twilio, SendGrid production credentials
- MaxMind license and legal region checks
- Cloud storage compliance for KYC data
- Background-check provider readiness (third-party screening API in Phase 2; MVP uses manual document upload)

Top risks:
- Payment reconciliation complexity
- KYC operational bottlenecks
- Realtime scaling and notification reliability
- Geolocation quality and edge-case matching logic
- Errand trust/regulatory risk: background-check correctness and local courier/rideshare rules (passenger rides excluded from MVP)
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
