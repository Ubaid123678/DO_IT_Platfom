# Do It Phase 6 Handoff Prompt (Wallet, Escrow, and Ledger)

Use this prompt in a new chat to continue Phase 7 work from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phases 0, 1, 2, 3, 4, 5, and 6 are completed and validated.

Read these files first:
- docs/LLM_ARCHITECTURE_PACK.md (condensed system architecture — read this first)
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md (single source of truth — see Phase 6 completion section)
- docs/HANDOFF_PROMPT.md
- docs/PHASE_4_JOBS_CORE.md (detailed design doc for Phase 4)
- docs/PHASE_5_PROPOSALS_MATCHING.md (detailed design doc for Phase 5)
- docs/PHASE_6_WALLET_ESCROW.md (detailed design doc for Phase 6)
- web/ADMIN_REMAINING.md (for deferred web work tracking)

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current repo truth:
- Phase 0, 1, 2, 3, 4, 5, and 6 fully completed and verified; Phase 7 (Payouts, FX, and Multi-Currency) is the next implementation focus.
- Backend has auth, KYC, verification, jobs, proposals, and wallet modules with full test coverage.
- Mobile has auth screens, KYC flow, 11-step provider verification wizard, per-track profile completion, 7-step job creation wizard, provider job browse feed, job detail with status transitions, client/provider job management, full proposal/matching flow, and complete wallet/escrow flow.
- Wallet/escrow: double-entry ledger, escrow lock on proposal acceptance, escrow release on job completion (90/10 split), platform fee (10%), Stripe top-ups, payout requests.
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

Deferred / known mock areas (NOT blocking): public profile viewer and `(provider)/profile.tsx` stats/reviews still use mock data; resume upload still uses multipart transport (may need the same base64 migration if it fails on device); web/admin portal remains deferred; Stripe Connect for provider payouts deferred; Wise integration for cross-border payouts deferred.

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with the existing envelope format.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break auth, KYC, jobs, proposals, or wallet contracts already used by mobile.
7. `provider_profile` and `track_data` are `Schema.Types.Mixed` — always `markModified` (or reassign a new object) after mutating them, or writes are silently dropped.

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for Phase 7:
1. Wise integration for cross-border payouts (provider bank accounts, FX conversion).
2. Stripe Connect onboarding for providers (express accounts, capabilities).
3. Multi-currency support (wallet balances in multiple currencies, FX rates).
4. Automated payout scheduling (batch processing, retry logic).
5. Payout reconciliation (Wise webhooks, settlement reports).
6. FX rate caching and refresh jobs (daily, with fallback).
7. Mobile screens: payout setup, Wise onboarding, FX rate display, multi-currency wallet.
8. Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass.
9. Mobile `npx tsc --noEmit` passes.
10. docs/IMPLEMENTATION_STATUS.md updated after completion.

Immediate next work:
1. Phase 7 - Payouts, FX, and Multi-Currency:
   - Design and implement Wise integration for provider payouts (bank accounts, KYC, compliance)
   - Implement Stripe Connect Express onboarding for providers
   - Implement multi-currency wallet balances with FX rate caching
   - Implement automated payout scheduling with Wise API
   - Implement payout reconciliation with Wise webhooks
   - Build mobile screens: Wise onboarding, payout setup, FX rate display, multi-currency wallet
   - Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass
   - Mobile `npx tsc --noEmit` passes
   - docs/IMPLEMENTATION_STATUS.md updated after completion

---

Start by designing the Wise integration and Stripe Connect onboarding flow; implement multi-currency wallet with FX caching; build automated payout scheduling with Wise; build mobile payout/Wise onboarding screens.

(End of file)