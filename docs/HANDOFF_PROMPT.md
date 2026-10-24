# Do It Platform — Handoff Prompt

Copy the block below into a new chat. It is self-contained.

---

I am continuing the **Do It Platform** (mobile + shared backend). Follow the
documentation in `docs/` as the source of truth and only append updates there
when a phase is completed.

## Repo facts (verified 2026-10-13)

```
backend  npx tsc --noEmit → 0 errors
backend  npx vitest run   → 11 files / 65 tests pass
mobile   npx tsc --noEmit → 0 errors
```

- Monorepo: `backend/` (Express + TS + MongoDB + Redis), `mobile/` (Expo / React
  Native, SDK 57, `expo-router`), `web/` (Next.js — **deferred**, owned by
  another developer; do not modify unless explicitly asked).
- We work **only** on mobile + the backend modules the mobile app uses. The
  backend is shared with the website, so do not break existing contracts.
- Active scope: **mobile app + shared backend**. Website/admin frontend is
  deferred.
- Database is **MongoDB Atlas (cloud)**; the backend runs **locally** during
  development.

## Read first

- `docs/LLM_ARCHITECTURE_PACK.md` (condensed architecture)
- `docs/IMPLEMENTATION_STATUS.md` — **single source of truth** (§8 is the current
  verified state; older "12/12 tests" lines are stale)
- `docs/IMPLEMENTATION_PHASES.md` — phase plans 0–14
- `docs/DO_IT_MASTER_DOCUMENTATION.md`
- `docs/SPRINT_TASK_BOARD.md`
- `docs/PROFILE_COMPLETION_PER_TRACK.md`
- Per-phase designs: `PHASE_4_JOBS_CORE.md`, `PHASE_5_PROPOSALS_MATCHING.md`,
  `PHASE_6_WALLET_ESCROW.md`, `PHASE_7_PAYOUTS_FX.md`,
  `PHASE_8_DISPUTES_REVIEWS.md`, `PHASE_9_MESSAGING_REALTIME.md`,
  `PHASE_10_FRAUD_SECURITY.md`

## Where the project actually stands

Phases 0–10 are implemented. Phase 4 (Jobs Core) has just finished an extended
**stabilization pass** (device testing + review fixes). Phase 11 is next.

Implemented mobile surfaces: auth/onboarding, KYC gate, provider verification
wizard (category → skill → evidence), per-track profile completion, client
profile completion, job creation wizard (physical/digital/errand), provider
relevant-jobs feed + apply/submit proposal, client My Jobs, job detail with
status transitions, proposals (client + provider + detail), wallet/earnings,
disputes, reviews, chat/notifications screens, fraud/security.

Backend modules: `auth`, `kyc`, `verification`, `jobs`, `proposals`, `wallet`
(+ payouts/fx), `disputes`, `reviews`, `messaging`, `fraud`, `admin`.

## Verified state and known ceilings (do not regress)

- **Server is source of truth** for onboarding gates. The provider dashboard
  unlocks on `kyc approved && overall_status === 'verified' &&
  getProfile().required_complete`. The old device-local AsyncStorage
  `@doit_verification_complete` sentinel was **removed** — do not reintroduce it.
- **Profile completion is track-aware:** backend returns `completeness`
  (60/40 strength incl. optional) **and** `required_completeness` /
  `required_complete` / `required_missing` (the form's `*` fields only). The
  provider meter shows `required_completeness`; strength is secondary.
- **Visible pop-ups must be themed**, not native `Alert.alert`. Use
  `src/components/common/ConfirmSheet.tsx` for confirmations. Native `Alert` is
  acceptable only for transient success/error toasts.
- **Refresh-on-focus patterns must use refs for pagination** (e.g. wallet,
  proposals). Putting `skip`/`hasMore` in a `useCallback` dep array alongside
  `useFocusEffect` causes an infinite reload loop.
- **Mongoose object-vs-string bugs are a recurring class.** `.lean()` returns
  ObjectIds and populated fields become objects; always compare
  `String(obj?._id ?? obj)` — never `obj.toString()`. Aggregations do **not**
  auto-cast string ids (cast with `new mongoose.Types.ObjectId(id)`).
- **`.lean()` skips `{}` schema defaults** — job responses are normalized in
  `serializeJob` (`provider`/`escrow`/`dispute`/`review` default to `{}`).
- **Proposal matching:** the relevant feed and the `createProposal` gate both use
  category **OR** skill. Keep them aligned.
- **Escrow money flow (verified):** lock on proposal accept → release on job
  complete (90% provider / 10% platform, platform wallet auto-created) → refund
  on cancel. `balance` and `availableBalance` must stay equal outside escrow.
  The ledger is a **record only** — callers apply their own balance changes.
- **Digital jobs** are remote: `location` is `{type:'Point',coordinates:[0,0]}`
  only (country/city omitted to avoid the `minlength:2` validator).
- HTTP timeout is 20s; network errors log as warnings (not errors).
- Base64 JSON is the proven image transport (KYC, avatar); multipart has failed
  on device before.
- `provider_profile` / `track_data` are `Schema.Types.Mixed` — always
  `markModified` (or reassign a new object) or writes are silently dropped.
- Messaging (nodemailer/twilio/firebase-admin) compiles with optional deps
  installed but needs real credentials to run. Socket.io realtime is wired in
  the backend; mobile proposals currently use refetch-on-focus, not live push.

## Rules

### Backend
1. Keep the modular structure under `backend/src/modules`.
2. Joi validation on every write endpoint.
3. Keep the existing response envelope.
4. Explicit role/auth checks on protected routes.
5. Add tests for new endpoint groups; keep `npx vitest run` green.
6. Never break contracts already consumed by mobile.

### Mobile
1. Do not redesign completed UI unless required for state/API handling.
2. Replace mock screen data with `src/services/*` calls where still mocked.
3. Preserve theme tokens and the existing navigation flow.
4. Add loading / empty / error states around live API calls.
5. Route files stay in `mobile/app/**` only.

### Process
- Conventional commits (`feat:`, `fix:`, `refactor:`, `perf:`, `test:`, `docs:`).
- Keep changes atomic; do not reformat unrelated files.
- Run both typechecks and the backend suite before declaring work done:
  `cd backend && npx tsc --noEmit && npx vitest run`
  `cd mobile && npx tsc --noEmit`
- Do **not** start/kill the backend: the user runs `npm run dev` in their own
  terminal.
- Update `docs/IMPLEMENTATION_STATUS.md` when a phase completes.

---

## Work to do now (in order)

### A. Documentation catch-up (do this first)

The docs lag the actual state. Update in place, no new files:

1. **`docs/IMPLEMENTATION_STATUS.md`**
   - Bump version/date; set "Current phase: Phase 11 — Analytics & Admin
     Dashboard", Phase 4 stabilization **completed**.
   - §8: update verified numbers to **65 tests** (was 60) and 11 files.
   - Add a **§9 "Phase 4 stabilization — round 2"** log covering the fixes since
     §8 (see the list below). Keep it factual and terse.
2. **`docs/HANDOFF_PROMPT.md`** — replace with this prompt (or keep it in sync).
3. **`docs/IMPLEMENTATION_PHASES.md`** — mark Phase 4 stabilization complete;
   leave Phases 11–14 as planned.
4. **`docs/SPRINT_TASK_BOARD.md`** — move the Phase 4 stabilization items to done.

Round-2 fixes to record in §9:
- Job-detail crash rendering populated `requirements.categories` objects
  (`JobRef` type widened; renders name/id; skill items now listed).
- `getJobStats` aggregation used a string id → all filter counts showed 0; cast
  to `ObjectId`.
- `getProposalById` 403 — populated `providerId`/`clientId` compared via
  `.toString()`; read `_id`.
- `getJobById` `isOwner`/`isAssignedProvider` ObjectId-vs-string comparison fixed.
- Digital job create 500 — `country: ''` failed `minlength:2`; digital omits
  address, physical/errand coerce empties to `undefined`.
- Provider onboarding flapping — removed the AsyncStorage completion sentinel;
  gate now uses `required_complete`; wizard retries on transient failure.
- Track-relevant completion added (`required_completeness`, `required_complete`).
- Proposals: relevant feed + apply gate aligned (category OR skill); apply screen
  restored; submit-proposal declared as a hidden tab.
- Wallet: infinite reload loop (refs), filter tabs now actually filter, Top Up
  icon color fixed, earnings screen wired to real data.
- Duplicate-key crashes on paginated lists (in-flight guard + `_id` dedupe across
  my-jobs / browse / proposals / job-proposals / disputes).
- Native white confirm dialogs replaced with themed `ConfirmSheet` (job-detail,
  proposal-detail, job-proposals).
- Admin job handling added (backend `GET /jobs/admin/list` + admin web pages) —
  note this touches `web/`, which is otherwise deferred.

### B. Then Phase 11 — Analytics & Admin Dashboard

Per `docs/IMPLEMENTATION_PHASES.md` §Phase 11. Deliverables:
1. Analytics event tracking + aggregation.
2. Admin dashboard (user management, fraud monitoring, system health).
3. Business metrics (GMV, conversion, retention, provider quality).
4. Reporting/export (scheduled reports, CSV/PDF).
5. Mobile analytics screens (earnings, performance, insights).

Definition of done: both typechecks clean, backend suite green, status doc
updated.

### C. Remaining phases (documented, not started)

- **Phase 12** — Website & Admin Portal finalization (deferred; another dev owns
  `web/`).
- **Phase 13** — Performance, reliability, pre-launch stabilization.
- **Phase 14** — Production launch & post-launch operations.

## Known gaps / follow-ups (not blocking Phase 11)

- Public provider profile viewer and `(provider)/profile.tsx` stats/reviews are
  still partly mock-driven.
- Mobile proposals updates are refetch-on-focus; wire the Socket.io
  `proposal_received` event for true realtime if needed.
- Resume upload still uses multipart (candidate for base64 migration if it fails
  on device).
- Stripe top-up is a **test/demo** path (`/wallet/topup/demo`, disabled in
  production); real card capture still needs wiring.
- Deployment for evaluation: DB is on Atlas; backend is local. For an offline
  demo, deploy the backend and set `EXPO_PUBLIC_API_BASE_URL` before building the
  APK (see the deployment discussion in the previous session).

---

Start by doing **Section A (documentation catch-up)**, then confirm the verified
command output, then propose the Phase 11 implementation order.
