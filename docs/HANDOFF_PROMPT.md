# Do It Phase 3 Handoff Prompt (Jobs Core)

Use this prompt in a new chat to continue Phase 3 implementation from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phases 0, 1, and 2 are completed and validated. The next delivery slice is Phase 3: Jobs Core (Create, Browse, Manage).

Read these files first:
- docs/LLM_ARCHITECTURE_PACK.md (condensed system architecture — read this first)
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md
- docs/HANDOFF_PROMPT.md
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

Remaining Phase 3 work:
1. Build Job model with status state machine (open, assigned, in_progress, completed, cancelled, disputed)
2. Implement client job creation endpoints for physical and digital job types
3. Implement provider job browse feed with category/location/price filters
4. Add geo indexing and distance-based query support
5. Implement job status transition validations
6. Integrate mobile job screens with live APIs

Testing and verification:
1. Backend build: `cd backend && npm run build`
2. Backend tests: `cd backend && npm test -- --run`
3. Mobile compile check: `cd mobile && npx tsc --noEmit`
4. Manual smoke test for job lifecycle:
   - Create job as client (physical + digital types)
   - Browse/feed as provider (with filters)
   - View job detail
   - Cancel job as client
   - Verify status transitions and validation rules

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with the existing envelope format.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break auth or KYC contracts already used by mobile.

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for Phase 3:
1. Job endpoints are implemented, validated, and authorized.
2. Backend build passes.
3. Backend tests pass.
4. Mobile service wiring compiles and job flows work against the backend.
5. Geo queries function correctly for physical jobs.
6. Job status transitions are enforced and validated.
7. Documentation updated only after full Phase 3 verification set completes.

Immediate next work:
1. Design and implement Job MongoDB model with full status state machine.
2. Implement client POST /jobs endpoint with Joi validation (physical/digital fields).
3. Implement GET /jobs feed endpoint for providers with category/location/price filtering.
4. Add 2dsphere geo index and distance-based sorting for physical jobs.
5. Add job status transition validation (open → cancel, open → assigned, etc.).
6. Write integration tests for job create, browse, and status transitions.
7. Wire mobile job screens (create, browse, detail) to live APIs.
8. Update docs/IMPLEMENTATION_STATUS.md only after full Phase 3 verification.

---

Start from the current Phase 3 state, implement the Jobs Core module, and verify with the requested backend/mobile tests.
