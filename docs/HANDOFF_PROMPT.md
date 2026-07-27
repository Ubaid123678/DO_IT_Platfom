# Do It Phase 3 Handoff Prompt (Provider Onboarding & Verification System)

Use this prompt in a new chat to continue Phase 3 implementation from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phases 0, 1, and 2 are completed and validated. The next delivery slice is Phase 3: Provider Onboarding & Verification System.

Read these files first:
- docs/LLM_ARCHITECTURE_PACK.md (condensed system architecture — read this first)
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md
- docs/HANDOFF_PROMPT.md
- docs/DO_IT_PROVIDER_ONBOARDING_skill_VERIFICATION_MERMAID.md (detailed design doc for Phase 3)
- web/ADMIN_REMAINING.md (for deferred web work tracking)

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current repo truth:
- Phase 0, 1, 2 fully completed and verified.
- Backend has auth module (10+ endpoints) and KYC module (9 endpoints) with full test coverage.
- Mobile has auth screens, KYC flow component, and layout-level KYC gate.
- KYC flow: form wizard (5 steps) + status screens (pending/approved/rejected) + gate that blocks tabs until approved.
- Token refresh interceptor, OTP debug mode, base64 image upload all working.
- Mobile TypeScript check passes: `cd mobile && npx tsc --noEmit`.
- Backend tests pass: `cd backend && npm test -- --run`.

What has already been done in this repo:
Backend:
- Auth module: register, login, logout, refresh-token, verify-email, verify-phone, resend-otp, forgot-password, reset-password, me, update-me
- KYC module: status, restricted-access, upload-image (base64 + multipart), submit, resubmit, admin list, admin detail, admin approve, admin reject
- Joi validation on all write endpoints
- JWT auth middleware with role-based access control
- Auth lockout, audit logging, rate limiting

Mobile:
- Auth screens (login, register, OTP, forgot-password, reset-password)
- KYC flow component (`src/components/KycFlow.tsx`) with 5-step wizard and status screens
- KYC gate in `_layout.tsx` that blocks tab access until approved
- `kyc.tsx` thin route wrapper
- Token management with auto-refresh interceptor
- Theme system, reusable UI primitives

Phase 3 scope (Provider Onboarding & Verification System):
- Phase 3 builds on top of Phase 2 (KYC identity verification) to add skill-level verification
- Design doc: `docs/DO_IT_PROVIDER_ONBOARDING_skill_VERIFICATION_MERMAID.md`

Remaining Phase 3 work:
1. Create skill_categories and skill_items MongoDB collections with CRUD endpoints
2. Implement provider category/skill selection API (POST/GET /providers/categories)
3. Create verification_records and admin_reviews models with full status state machine
4. Build physical verification track: certificate/license upload, prior work photos
5. Build digital verification track: certificate upload, portfolio links, platform OAuth (GitHub MVP)
6. Implement verification evidence submission endpoint (POST /providers/verification-records)
7. Build admin verification review queue (GET /admin/verification-records, approve/reject/request-info)
8. Implement Provider.overall_status aggregator (derived from kyc status + all verification records)
9. Build resume upload with parsing pipeline (Bull worker + third-party parser)
10. Implement auto-verification workers: credential URL verification, skill test auto-grade
11. Build verification status hub in mobile app (status badges per category/skill)
12. Wire mobile onboarding screens to live APIs (category selection, evidence upload, status tracking)

Testing and verification:
1. Backend build: `cd backend && npm run build`
2. Backend tests: `cd backend && npm test -- --run`
3. Mobile compile check: `cd mobile && npx tsc --noEmit`
4. Manual smoke test for provider onboarding:
   - Register as provider → KYC submit → category/skill selection
   - Submit physical evidence (certificate upload)
   - Submit digital evidence (certificate with credential_url)
   - Admin approve verification record
   - Verify Provider.overall_status updated correctly
   - Verify provider dashboard reflects unlocked categories
   - Test resubmission after rejection

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Create a new `verification` module alongside the existing `kyc` module.
3. Use Joi validation for every write endpoint.
4. Keep API responses consistent with the existing envelope format.
5. Keep authorization and role checks explicit on protected routes.
6. Add or update integration tests for each implemented endpoint group.
7. Do not break auth or KYC contracts already used by mobile.
8. All new collections: `verification_records`, `admin_reviews`, `resume_parse_results`

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for Phase 3:
1. All Phase 3 endpoints are implemented, validated, and authorized.
2. Backend build passes.
3. Backend tests pass.
4. Mobile service wiring compiles and onboarding flows work against the backend.
5. Admin can review and act on verification records via API.
6. Provider.overall_status correctly aggregates KYC + verification states.
7. Auto-verification workers trigger on eligible submissions.
8. Documentation updated only after full Phase 3 verification set completes.

Immediate next work:
1. Design and implement skill_categories and skill_items MongoDB models.
2. Implement CRUD endpoints for skill_categories and skill_items (admin-managed).
3. Implement POST/GET /providers/categories for provider selection.
4. Design and implement verification_records model with polymorphic evidence_payload.
5. Implement POST /providers/verification-records endpoint with Joi validation.
6. Implement admin review endpoints: list, approve, reject, request-info.
7. Implement Provider.overall_status computation as a middleware/hook on status changes.
8. Write integration tests for category selection, evidence submission, and admin review.
9. Wire mobile screens (category selection, evidence upload, status hub) to live APIs.
10. Update docs/IMPLEMENTATION_STATUS.md only after full Phase 3 verification.

---

Start from the current Phase 3 state, implement the Provider Onboarding & Verification module, and verify with the requested backend/mobile tests.
