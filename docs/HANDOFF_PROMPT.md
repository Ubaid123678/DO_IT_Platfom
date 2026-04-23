# Do It Backend Integration Handoff Prompt (Phase 1 Restart)

Use this prompt in a new chat to continue implementation with backend-first execution starting from Phase 1 integration.

---

I am continuing the Do It platform implementation.
The mobile frontend is available, and we are restarting active backend execution from Phase 1.
Phase 1 backend exists, but now we must connect and verify auth flows end-to-end before Phase 2.

Read these files first:
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md
- docs/detail_for_frontend.md

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current truth:
- Mobile route inventory is fully implemented (51 app route files present).
- Route-level screen scaffolds are removed.
- Mobile TypeScript check passes (`cd mobile && npx tsc --noEmit`).
- Backend auth foundation is implemented and tested.
- Phase 0 is fully completed.
- Phase 1 is reopened for backend-to-frontend integration and runtime verification.

Primary objective for this chat:
- Complete Phase 1 auth integration and testing from backend through frontend, then move to Phase 2.

Backend implementation rules:
1. Keep Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with project envelope standards.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break existing auth contracts already used by mobile.

Frontend integration rules while wiring APIs:
1. Do not redesign completed screen UI unless required by API state handling.
2. Replace mock screen data with service calls under mobile/src/services.
3. Preserve theme token usage (Colors + makeStyles(C)) and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only (no src/screens reintroduction).

Recommended implementation order:
1. Phase 1: Identity, auth, and account flow integration verification
2. Phase 2: KYC and provider activation
3. Phase 3: Jobs core
4. Phase 4: Proposals and matching
5. Phase 5: Wallet and escrow

Definition of done for Phase 1 restart:
1. Endpoints implemented with validation and authorization.
2. Backend build passes (`cd backend && npm run build`).
3. Backend tests pass (`cd backend && npm test -- --run`).
4. Mobile service wiring compiles (`cd mobile && npx tsc --noEmit`) and register/login flows run successfully against backend.
5. Forgot/reset password and OTP verify flows are tested against live backend contracts.
6. Session flows (`me`, refresh-token, logout) are verified.
7. docs/IMPLEMENTATION_STATUS.md updated only when the full Phase 1 verification set is complete.

Immediate next work:
1. Connect and verify register and login flows from mobile to backend.
2. Validate OTP and password reset flow behavior using live APIs.
3. Run backend and mobile checks, then document verification results.
4. Move to Phase 2 only after Phase 1 integration/testing is fully successful.

---

Start from Phase 1 auth integration verification and keep frontend as the integration target.
