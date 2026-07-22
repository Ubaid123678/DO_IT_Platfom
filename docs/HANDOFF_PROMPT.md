# Do It Phase 2 Handoff Prompt (KYC + Provider Activation)

Use this prompt in a new chat to continue Phase 2 implementation from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phase 0 and Phase 1 are completed and validated. The next delivery slice is Phase 2: KYC and provider activation.

Read these files first:
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md
- docs/detail_for_frontend.md
- docs/HANDOFF_PROMPT.md

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current repo truth:
- Mobile route inventory is implemented and the route-level screen scaffolds are removed.
- Mobile TypeScript check passes: `cd mobile && npx tsc --noEmit`.
- Backend auth foundation is implemented, integrated, and verified with mobile.
- Phase 0 is fully completed.
- Phase 1 is completed and validated end-to-end.
- Phase 2 is now partially implemented and should be completed from backend through frontend.

What has already been done in this repo:
- Backend KYC module added under backend/src/modules/kyc with model, service, controller, routes, and validation.
- KYC endpoints are mounted under `/api/v1/kyc` for provider status, restricted-access checks, upload URL generation, submission, resubmission, and admin review actions.
- Role-based authorization middleware was added for protected KYC routes.
- Storage helper logic was added for signed upload URL generation and KYC metadata handling.
- Backend tests were added for KYC service and route-level behavior.
- Mobile KYC service was added under mobile/src/services/kycService.ts.
- Provider KYC UI was wired to live API calls in mobile/app/(provider)/kyc.tsx.
- Provider home now reads live KYC status for the banner and verification state.
- Client/provider role-separation navigation was normalized so client flows stay on client screens and provider flows stay on provider screens.

Remaining Phase 2 work:
1. Complete end-to-end live API verification for KYC submission and review flows.
2. Ensure provider restrictions are enforced consistently until KYC is approved.
3. Implement or complete the admin-side review experience for listing submissions, approving/rejecting with a reason, and reflecting the result in provider access state.
4. Make sure provider role updates and access gating are reflected immediately after approval/rejection.
5. Wire any remaining provider-facing screens to the KYC status truth where needed.
6. Update docs/IMPLEMENTATION_STATUS.md only after full Phase 2 verification is complete.

Testing and verification still left:
1. Backend build: `cd backend && npm run build`
2. Backend tests: `cd backend && npm test -- --run`
3. Mobile compile check: `cd mobile && npx tsc --noEmit`
4. Manual smoke test for the complete provider KYC lifecycle:
   - sign in as a provider-like user
   - open KYC screen
   - generate upload URL
   - submit KYC
   - confirm pending state
   - approve/reject from admin flow
   - confirm provider status changes and restrictions are enforced
5. Regression checks for existing auth and onboarding flows so the new KYC work does not break mobile login/register/role selection.

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with the existing envelope format.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break auth contracts already used by mobile.

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for Phase 2:
1. KYC endpoints are implemented, validated, and authorized.
2. Backend build passes.
3. Backend tests pass.
4. Mobile service wiring compiles and the KYC flow works against the backend.
5. Provider restrictions are enforced until KYC approval.
6. Admin KYC review actions (approve/reject with reason) are operational and audited.
7. Documentation is updated only after the full Phase 2 verification set completes.

Immediate next work:
1. Finish the admin KYC review flow and confirm provider access updates correctly.
2. Run the backend and mobile verification commands above.
3. Resolve any issues found during the live KYC lifecycle test.
4. Update implementation status documentation only once the full Phase 2 verification is complete.

---

Start from the current Phase 2 KYC implementation state, finish the remaining provider activation work, and verify it with the requested backend/mobile tests.
