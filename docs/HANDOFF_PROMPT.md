# Do It Phase 9 Handoff Prompt (Messaging, Notifications, and Realtime)

Use this prompt in a new chat to continue Phase 10 work from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phases 0, 1, 2, 3, 4, 5, 6, 7, 8, and 9 are completed and validated.

Read these files first:
- docs/LLM_ARCHITECTURE_PACK.md (condensed system architecture — read this first)
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md (single source of truth — see Phase 9 completion section)
- docs/HANDOFF_PROMPT.md
- docs/PHASE_4_JOBS_CORE.md (detailed design doc for Phase 4)
- docs/PHASE_5_PROPOSALS_MATCHING.md (detailed design doc for Phase 5)
- docs/PHASE_6_WALLET_ESCROW.md (detailed design doc for Phase 6)
- docs/PHASE_7_PAYOUTS_FX.md (detailed design doc for Phase 7)
- docs/PHASE_8_DISPUTES_REVIEWS.md (detailed design doc for Phase 8)
- docs/PHASE_9_MESSAGING_REALTIME.md (detailed design doc for Phase 9)
- web/ADMIN_REMAINING.md (for deferred web work tracking)

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current repo truth:
- Phase 0, 1, 2, 3, 4, 5, 6, 7, 8, and 9 fully completed and verified; Phase 10 (Fraud Detection and Security Hardening) is the next implementation focus.
- Backend has auth, KYC, verification, jobs, proposals, wallet, payouts, disputes, reviews, messaging, notifications modules with full test coverage.
- Mobile has auth screens, KYC flow, 11-step provider verification wizard, per-track profile completion, 7-step job creation wizard, provider job browse feed, job detail with status transitions, client/provider job management, full proposal/matching flow, complete wallet/escrow/payout flow, complete disputes/reviews flow, and complete messaging/notifications/realtime flow.
- Messaging/Notifications: Socket.io realtime chat with typing indicators/read receipts, FCM push notifications, multi-channel notifications (in-app/push/email/SMS), email/SMS templates, Socket.io Redis adapter, mobile chat/inbox/notification screens.
- Token refresh interceptor, OTP debug mode, and base64 image upload work.
- Avatar/profile-photo upload uses base64 JSON transport (KYC-proven) after React Native multipart uploads kept failing.
- Avatar persistence bug fixed: mutating the `provider_profile` / `track_data` Mixed subdocuments in place is silently dropped by Mongoose change tracking; the fix uses `user.markModified('provider_profile')` (and object reassignment in `updateProfile`).
- Mobile TypeScript check passes: `cd mobile && npx tsc --noEmit`.
- Backend checks pass: `cd backend && npx tsc --noEmit` and `cd backend && npx vitest run` (12/12 tests).

What has already been done in this repo:
- Phase 3 complete: verification module (categories/skills, evidence records, admin review, OAuth connect, resume parse), 11 mobile wizard screens, status hub, and the per-track profile completion flow.
- Phase 4 complete: job model with geo-indexing and status state machine, 7-step job creation wizard, provider browse feed with geo-filters, job detail with status transitions, client/provider job management screens.
- Phase 5 complete: proposal model with state machine (submitted → accepted|rejected|withdrawn|expired), provider submission flow (fixed/hourly bids, cover letter, timeline), client accept/reject with auto-reject others, matching engine with geo/skill/rating scoring, client/provider proposal management screens, proposal detail with bid breakdown.
- Phase 6 complete: wallet model with double-entry ledger, Stripe top-up flow with webhook reconciliation, escrow lock on proposal acceptance (auto-triggered from Phase 5), escrow release on job completion (90/10 split), platform fee deduction (10%), provider payout requests, mobile wallet screens (balance, top-up, history, escrow status).
- Phase 7 complete: Wise integration for cross-border payouts, Stripe Connect Express onboarding, multi-currency wallet with FX rate caching, automated payout scheduling with Wise webhook reconciliation, provider payout screens, client/provider wallet screens.
- Phase 8 complete: dispute model with state machine (open → evidence_submitted → under_review → resolved → closed), evidence submission (documents, images, videos, text, links with 7-day deadline), admin verdict system (client_wins/provider_wins/split with escrow routing), review system (5-star + 4 detailed categories, flagging, moderation, helpful votes), client/provider dispute/review management screens.
- Phase 9 complete: Socket.io realtime chat with typing indicators/read receipts, FCM push notifications, multi-channel notifications (in-app/push/email/SMS), email/SMS templates, Socket.io Redis adapter, mobile chat/inbox/notification screens.

Deferred / known mock areas (NOT blocking): public profile viewer and `(provider)/profile.tsx` stats/reviews still use mock data; resume upload still uses multipart transport (may need the same base64 migration if it fails on device); web/admin portal remains deferred; Stripe Connect integration for provider payouts is now implemented; Wise integration for cross-border payouts is now implemented.

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with the existing envelope format.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break auth, KYC, jobs, proposals, wallet, payouts, disputes, reviews, messaging, or notifications contracts already used by mobile.
7. `provider_profile` and `track_data` are `Schema.Types.Mixed` — always `markModified` (or reassign a new object) after mutating them, or writes are silently dropped.

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for Phase 10:
1. Fraud rules engine (Bull-based, initial rule set).
2. Fraud flag creation and admin review workflow.
3. Security hardening pass (auth, input validation, logging hygiene, SSRF/file upload checks).
4. Abuse controls for OTP, payment attempts, suspicious sessions.
5. Mobile screens: fraud alerts, security settings, audit log.
6. Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass.
7. Mobile `npx tsc --noEmit` passes.
8. docs/IMPLEMENTATION_STATUS.md updated after completion.

Immediate next work:
1. Phase 10 - Fraud Detection and Security Hardening:
   - Design and implement fraud rules engine (Bull-based, initial rule set)
   - Implement fraud flag creation and admin review workflow
   - Security hardening pass (auth, input validation, logging hygiene, SSRF/file upload checks)
   - Abuse controls for OTP, payment attempts, suspicious sessions
   - Build mobile screens: fraud alerts, security settings, audit log
   - Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass
   - Mobile `npx tsc --noEmit` passes
   - docs/IMPLEMENTATION_STATUS.md updated after completion

---

Start by designing the fraud rules engine (Bull-based) with initial rule set; implement fraud flag creation and admin review workflow; implement security hardening pass; build mobile fraud alerts and security settings screens.

(End of file)