# Do It Phase 3 Handoff Prompt (Provider Onboarding & Verification System)

Use this prompt in a new chat to continue Phase 3 work from the current repository state.

---

I am continuing the Do It platform implementation.
The app-first delivery path is active, with mobile and shared backend as the focus.
Phases 0, 1, 2, and 3 are completed and validated, including the per-track profile completion enhancement and its avatar-persistence fix. The only remaining Phase 3 work is manual end-to-end testing.

Read these files first:
- docs/LLM_ARCHITECTURE_PACK.md (condensed system architecture — read this first)
- docs/DO_IT_MASTER_DOCUMENTATION.md
- docs/IMPLEMENTATION_PHASES.md
- docs/SPRINT_TASK_BOARD.md
- docs/IMPLEMENTATION_STATUS.md (single source of truth — see §3.5 + follow-up for the latest Phase 3 additions)
- docs/HANDOFF_PROMPT.md
- docs/DO_IT_PROVIDER_ONBOARDING_skill_VERIFICATION_MERMAID.md (detailed design doc for Phase 3)
- docs/PROFILE_COMPLETION_PER_TRACK.md (per-track profile completion spec)
- web/ADMIN_REMAINING.md (for deferred web work tracking)

Execution mode:
- App-first (mobile + shared backend)
- Website/admin frontend remains deferred for now

Current repo truth:
- Phase 0, 1, 2, and 3 fully completed and verified; Phase 4 (Jobs Core) is the next implementation focus.
- Backend has auth, KYC, and verification modules with full test coverage.
- Mobile has auth screens, KYC flow, the 11-step provider verification wizard, and the per-track profile completion screen.
- Verification status hub, admin review queue, OAuth/GitHub auto-verification, and the Bull worker (Redis optional, inline fallback) are all functional.
- Token refresh interceptor, OTP debug mode, and base64 image upload work.
- Avatar/profile-photo upload was changed to base64 JSON transport (KYC-proven) after React Native multipart uploads kept failing.
- Avatar persistence bug fixed: mutating the `provider_profile` / `track_data` Mixed subdocuments in place is silently dropped by Mongoose change tracking; the fix uses `user.markModified('provider_profile')` (and object reassignment in `updateProfile`).
- Mobile TypeScript check passes: `cd mobile && npx tsc --noEmit`.
- Backend checks pass: `cd backend && npx tsc --noEmit` and `cd backend && npx vitest run` (12/12 tests).

What has already been done in this repo:
- Phase 3 complete: verification module (categories/skills, evidence records, admin review, OAuth connect, resume parse), 11 mobile wizard screens, status hub, and the per-track profile completion flow.
- Per-track profile completion (see docs/PROFILE_COMPLETION_PER_TRACK.md):
  - Provider is locked to a single verified track (physical / digital / errand); `updateProfile` rejects off-track data.
  - `computeCompleteness` returns a single server-side completeness % (required ~60% + optional ~40%) that the mobile completion screen displays directly (client-side re-scoring removed).
  - **City is now optional for digital track** (remote work doesn't require location), required for physical (on-site) and errand (service area).
  - Universal section (photo, headline, bio, languages, availability, visibility toggle) + per-track sections; errand service area is mirrored read-only from the verified Trust Bundle; digital resume upload mirrors into `track_data.digital.resume_file_url`.
  - **Improved UI**: Languages and availability days/shifts now use multi-select dropdown modals with search instead of chip buttons for better UX.
  - Avatar upload is base64 JSON (`mobile/src/services/verificationService.ts` `uploadAvatar` via `expo-file-system/legacy`); backend `uploadAvatar` accepts either multipart or base64 (`req.body.data`); `getMediaUrl` in `mobile/src/services/api.ts` passes through `data:`/`file:` URIs so the avatar renders.
  - Avatar persistence fix (backend verification.service.ts): added `user.markModified('provider_profile')` after in-place mutation of the Mixed path and removed a dead `user.set('avatar_url', ...)` call (not a schema path, silently dropped). Verified with a Mongoose-level repro that a fresh `findById().lean()` now includes `provider_profile.avatar_url`.
  - Android hardware-back on the completion screen returns to the dashboard for verified providers who have reached the completion screen once, otherwise closes the app.

Remaining Phase 3 work (testing only, no code expected unless a defect is found):
1. Run the app end-to-end and manually test the profile completion screen for ALL THREE track types (physical, digital, errand):
   - Register → KYC approve → verification wizard → review-approved/resume-bio step shows the track-correct completion screen.
   - For each track, fill every section, upload a photo, save, and confirm:
     - the completeness % is identical on the completion screen, the dashboard "Profile X% complete" card, and the profile screen;
     - the photo persists after Save → dashboard → reopen the completion screen (no phantom 95%);
     - missing-fields hint disappears once the meter reaches 100%;
     - availability syncs between the universal profile and the track section.
2. Confirm the avatar is stored in MongoDB as `provider_profile.avatar_url` (not lost on a fresh read).
3. Spot-check the errand transport gate (motorized mode required when skills require a vehicle) and the read-only verified service area.
4. Confirm verified providers reaching 100% can route to the dashboard, and Android back behavior is correct.
5. If any defect is found, fix it, then re-run `cd backend && npx tsc --noEmit && npx vitest run` and `cd mobile && npx tsc --noEmit`.

Deferred / known mock areas (NOT blocking): public profile viewer and `(provider)/profile.tsx` stats/reviews still use mock data; resume upload still uses multipart transport (may need the same base64 migration if it fails on device); web/admin portal remains deferred.

Implementation rules:
1. Keep the Express + TypeScript modular structure under backend/src/modules.
2. Use Joi validation for every write endpoint.
3. Keep API responses consistent with the existing envelope format.
4. Keep authorization and role checks explicit on protected routes.
5. Add or update integration tests for each implemented endpoint group.
6. Do not break auth or KYC contracts already used by mobile.
7. `provider_profile` and `track_data` are `Schema.Types.Mixed` — always `markModified` (or reassign a new object) after mutating them, or writes are silently dropped.

Frontend integration rules:
1. Do not redesign completed UI unless required for API state handling.
2. Replace mock screen data with service calls under mobile/src/services where still needed.
3. Preserve theme token usage and existing navigation flow.
4. Add loading, empty, and error handling around live API calls where missing.
5. Keep route file ownership in mobile/app/*.tsx only.

Definition of done for the remaining Phase 3 work:
1. Manual completion-screen test passes for all three track types with consistent completeness % throughout the app and persisted avatars.
2. Backend `npx tsc --noEmit` and `npx vitest run` (12/12) pass.
3. Mobile `npx tsc --noEmit` passes.
4. docs/IMPLEMENTATION_STATUS.md updated (do not create separate phase files) after any defect fix.

Immediate next work:
1. Manual test the profile completion screen for the three track types per the checklist above.
2. If no defects, Phase 3 is fully closed; begin Phase 4 (Jobs Core). If defects appear, fix them and re-run the verification commands.
3. Update docs/IMPLEMENTATION_STATUS.md only after the testing checklist is closed.

---

Start by testing the per-track profile completion flow end-to-end; fix any defect found and re-verify, then update docs/IMPLEMENTATION_STATUS.md.