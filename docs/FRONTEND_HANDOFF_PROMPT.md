# Do It Frontend Handoff Prompt (App-First)

Use this prompt in a new chat to start screen implementation immediately.

---

I am continuing the Do It mobile frontend implementation.

Critical context files to read first:
- docs/detail_for_frontend.md
- docs/IMPLEMENTATION_STATUS.md
- docs/FRONTEND_HANDOFF_PROMPT.md

Execution mode:
- App-first only (mobile + shared backend)
- Website/admin frontend is deferred for now

Current mobile baseline already prepared:
- Expo Router grouped routes scaffolded:
  - app/(auth)
  - app/(onboarding)
  - app/(client)
  - app/(provider)
  - app/(shared)
  - app/(help)
- Full route wrappers exist for planned screen paths
- Theme tokens aligned to master guidance in:
  - mobile/src/theme/colors.ts
  - mobile/src/theme/typography.ts
- Required shared component scaffolds exist (common + job)
- Mobile type-check currently passes

Mandatory implementation rules:
1. TypeScript only (.tsx, .ts)
2. Use Colors from `@/src/theme/colors` and `makeStyles(C)` pattern
3. No hardcoded hex values in screens
4. Use reusable components from `src/components/common` and `src/components/job`
5. Use Expo Router navigation patterns from the master frontend doc
6. Keep app and backend contract aligned via services under `src/services`

Screen development process:
1. Pick one screen from the 51-screen inventory in docs/detail_for_frontend.md
2. Build/replace the corresponding file in `src/screens/...`
3. Keep the route file in `app/...` as wrapper only
4. Add loading/error/empty states in-screen
5. Run `cd mobile && npx tsc --noEmit`
6. Move to next screen

Preferred build order:
1. Auth + Onboarding
2. Client core (home, post-job, my-jobs, details, proposals)
3. Provider core (home, browse, proposals, active-job, kyc, earnings)
4. Shared screens (chat, notifications, settings, dispute, review)
5. Help & support module
6. Visual polish + accessibility + state completeness

When using Stitch MCP for each screen:
- Enhance prompt first with explicit structure, state coverage, and design tokens
- Ask Stitch for one screen at a time
- Apply output to the matching `src/screens/...` file only
- Do not change backend contract without explicit update

Template request for each screen:

"Build the [SCREEN_NAME] screen for Do It platform.
File: [EXACT src/screens/... path]
Route: [EXACT app/... path]
Use rules from docs/detail_for_frontend.md.
Include light/dark theme via Colors + makeStyles(C).
Include loading/error/empty/success states where relevant.
Do not hardcode hex colors."

Definition of done per screen:
- Screen implemented in target `src/screens/...` file
- Route wrapper points correctly
- Type-check passes
- Component imports are from project paths
- Themed styles compliant with master guidance

---

Start by implementing: `src/screens/auth/LoginScreen.tsx` and validate with `npx tsc --noEmit`.
