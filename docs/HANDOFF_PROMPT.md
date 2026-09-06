# Do It Phase 5 Handoff Prompt (Proposals and Matching Engine)

Use this prompt in a new chat to continue Phase 6 work from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phases 0, 1, 2, 3, 4, and 5 are completed and validated.

Read these files first:
- docs/LLM_ARCHITECTURE_PACK.md (condensed system architecture — read this first)
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md (single source of truth — see Phase 5 completion section)
- docs/HANDOFF_PROMPT.md
- docs/PHASE_4_JOBS_CORE.md (detailed design doc for Phase 4)
- docs/PHASE_5_PROPOSALS_MATCHING.md (detailed design doc for Phase 5)
- web/ADMIN_REMAINING.md (for deferred web work tracking)

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current repo truth:
- Phase 0, 1, 2, 3, 4, and 5 fully completed and verified; Phase 6 (Wallet, Escrow, and Ledger) is the next implementation focus.
- Backend has auth, KYC, verification, jobs, and proposals modules with full test coverage.
- Mobile has auth screens, KYC flow, 11-step provider verification wizard, per-track profile completion, 7-step job creation wizard, provider job browse feed, job detail with status transitions, client/provider job management, and full proposal/matching flow.
- Proposal status state machine (submitted → accepted|rejected|withdrawn|expired), matching engine with geo/skill/rating scoring, and client/provider proposal management are all functional.
- Token refresh interceptor, OTP debug mode, and base64 image upload work.
- Avatar/profile-photo upload uses base64 JSON transport (KYC-proven) after React Native multipart uploads kept failing.
- Avatar persistence bug fixed: mutating the `provider_profile` / `track_data` Mixed subdocuments in place is silently dropped by Mongoose change tracking; the fix uses `user.markModified('provider_profile')` (and object reassignment in `updateProfile`).
- Mobile TypeScript check passes: `cd mobile && npx tsc --noEmit`.
- Backend checks pass: `cd backend && npx tsc --noEmit` and `cd backend && npx vitest run` (12/12 tests).

What has already been done in this repo:
- Phase 3 complete: verification module (categories/skills, evidence records, admin review, OAuth connect, resume parse), 11 mobile wizard screens, status hub, and the per-track profile completion flow.
- Phase 4 complete: job model with geo-indexing and status state machine, 7-step job creation wizard, provider browse feed with geo-filters, job detail with status transitions, client/provider job management screens.
- Phase 5 complete: proposal model with state machine (submitted → accepted|rejected|withdrawn|expired), provider submission flow (fixed/hourly bids, cover letter, timeline), client accept/reject with auto-reject others, matching engine with geo/skill/rating scoring, client/provider proposal management screens, proposal detail with bid breakdown.

Deferred / known mock areas (NOT blocking): public profile viewer and `(provider)/profile.tsx` stats/reviews still use mock data; resume upload still uses multipart transport (may need the same base64 migration if it fails on device); web/admin portal remains deferred.

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with the existing envelope format.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break auth, KYC, or jobs contracts already used by mobile.
7. `provider_profile` and `track_data` are `Schema.Types.Mixed` — always `markModified` (or reassign a new object) after mutating them, or writes are silently dropped.

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for Phase 6:
1. Wallet model with balance, ledger entries, and double-entry transactions.
2. Stripe top-up flow with webhook reconciliation and idempotency.
3. Escrow lock on proposal acceptance (auto-triggered from Phase 5).
5. Escrow release on job completion with platform fee deduction (10%).
6. Immutable transaction ledger with double-entry bookkeeping.
6. Mobile screens: wallet balance, top-up, transaction history, escrow status.
7. Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass.
7. Mobile `npx tsc --noEmit` passes.
8. docs/IMPLEMENTATION_STATUS.md updated after completion.

Immediate next work:
1. Phase 6 - Wallet, Escrow, and Ledger:
   - Design and implement wallet model (balance, ledger entries, double-entry transactions)
   - Implement Stripe top-up flow with webhook reconciliation and idempotency
   - Implement escrow lock on proposal acceptance (auto-triggered from Phase 5)
   - Implement escrow release on job completion with platform fee deduction (10%)
   - Immutable transaction ledger with double-entry bookkeeping
   - Build mobile screens: wallet balance, top-up, transaction history, escrow status
   - Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass
   - Mobile `npx tsc --noEmit` passes
   - docs/IMPLEMENTATION_STATUS.md updated after completion

---

Start by designing the Wallet model and Stripe integration; build the escrow lock/release flow that integrates with Phase 5 proposal acceptance and job completion; implement the double-entry ledger; build mobile wallet screens.