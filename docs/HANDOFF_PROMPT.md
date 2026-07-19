# Do It Backend Integration Handoff Prompt (Phase 2 Kickoff)

Use this prompt in a new chat to continue implementation with backend-first execution starting from Phase 2 (KYC and Provider Activation).

---

I am continuing the Do It platform implementation.
The mobile frontend is available, and active backend execution now starts from Phase 2.
Phase 1 is completed and validated end-to-end; the next delivery slice is KYC and provider activation.

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
- Backend auth foundation is implemented, integrated, and verified with mobile.
- Phase 0 is fully completed.
- Phase 1 is completed.
- Phase 2 (KYC and Provider Activation) is now active.

Primary objective for this chat:
- Complete Phase 2 KYC and provider activation from backend through frontend.

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
1. Phase 2: KYC and provider activation
2. Phase 3: Jobs core
3. Phase 4: Proposals and matching
4. Phase 5: Wallet and escrow
5. Phase 6: Payouts and FX

Definition of done for Phase 2:
1. Endpoints implemented with validation and authorization.
2. Backend build passes (`cd backend && npm run build`).
3. Backend tests pass (`cd backend && npm test -- --run`).
4. Mobile service wiring compiles (`cd mobile && npx tsc --noEmit`) and KYC flows run successfully against backend.
5. Provider restrictions are enforced until KYC is approved.
6. Admin KYC review actions (approve/reject with reason) are operational and audited.
7. docs/IMPLEMENTATION_STATUS.md updated only when the full Phase 2 verification set is complete.

Immediate next work:
1. Implement KYC document submission and status endpoints.
2. Add signed upload URL generation and secure storage metadata handling.
3. Implement admin KYC review endpoints (approve/reject + reason).
4. Enforce KYC approval gating on provider-restricted actions.
5. Wire [app/(provider)/kyc.tsx](app/(provider)/kyc.tsx) to live APIs and validate state transitions.

---

Start from Phase 2 KYC implementation and keep frontend as the integration target.
