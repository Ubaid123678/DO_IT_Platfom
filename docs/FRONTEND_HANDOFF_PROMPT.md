# Do It Frontend Handoff Prompt (App-Only Screens)

Use this prompt in a new chat to continue implementation with the current architecture.

---

I am continuing the Do It mobile frontend implementation.

Read these files first:
- docs/detail_for_frontend.md
- docs/IMPLEMENTATION_STATUS.md
- docs/FRONTEND_HANDOFF_PROMPT.md

Execution mode:
- App-first only (mobile + shared backend)
- Website/admin frontend is deferred for now

Architecture truth (must follow exactly):
- All screens live directly in app folder files.
- src/screens folder was removed intentionally. Do not recreate it.
- Screen generation and editing must target app/*.tsx files directly.
- Reusable UI components live in:
  - mobile/src/components/common
  - mobile/src/components/job
  - mobile/src/components/wallet

Current app route groups:
- app/(auth)
- app/(onboarding)
- app/(client)
- app/(provider)
- app/(shared)
- app/(help)

Mandatory implementation rules:
1. TypeScript only (.tsx, .ts)
2. Use Colors from @/src/theme/colors and makeStyles(C) pattern
3. No hardcoded hex values in screens
4. Use reusable components from src/components/common, src/components/job, and src/components/wallet when relevant
5. Use Expo Router navigation patterns from the master frontend doc
6. Keep app and backend contract aligned via services under src/services
7. Do not introduce wrapper indirection through removed src/screens files

UI design quality rules (teach and enforce while generating):
1. Each screen must define clear visual hierarchy:
  - Primary heading
  - Supporting subtext
  - Main action area
  - Secondary actions
2. Every form screen must include all states:
  - Default
  - Focused fields
  - Validation errors
  - Submit loading
  - Success/confirmation
3. Every list screen must include:
  - Loading skeleton or loader
  - Non-empty list state
  - Empty state with CTA
  - Error retry state
4. Keep spacing and radii aligned to docs/detail_for_frontend.md:
  - Screen padding 20
  - Card radius 16
  - Input height 52
  - Primary button height 52
5. Light and dark themes must both be correct through token usage only.

Screen development process:
1. Pick one screen path from the app folder inventory
2. Build or replace that exact app/*.tsx screen file
3. Add loading/error/empty/success states where relevant
4. Reuse component primitives from src/components before creating new ones
5. Run mobile type-check:
  - cd mobile
  - npx tsc --noEmit
6. Move to next screen only after type-check passes

Preferred build order:
1. Auth + onboarding
2. Client core (home, post-job, my-jobs, detail, proposals)
3. Provider core (home, browse, proposals, active-job, kyc, earnings)
4. Shared screens (chat, notifications, settings, dispute, review)
5. Help and support module
6. Visual polish and accessibility pass

When using Stitch MCP for each screen:
1. Generate one screen at a time
2. Target the exact app path only (not src/screens)
3. Include explicit layout structure in prompt:
  - Header
  - Body sections
  - Primary CTA area
  - Empty/error states
4. Include explicit style direction:
  - Clean modern marketplace UI
  - Strong hierarchy
  - Token-driven colors
  - Accessible contrast
5. Do not change backend contracts unless explicitly requested

Template request for each screen:

Build the [SCREEN_NAME] screen for Do It platform.
File: [EXACT app/... path]
Follow docs/detail_for_frontend.md rules.
Use Colors + makeStyles(C) for full light/dark support.
Use components from src/components/common, src/components/job, and src/components/wallet when relevant.
Include loading/error/empty/success states.
Do not hardcode hex colors.
Do not create src/screens files.

Definition of done per screen:
- Screen implemented in the exact app/*.tsx target file
- No new src/screens folder or files created
- Type-check passes
- Component imports are from project paths
- Themed styles compliant with master guidance

Active app screen paths:
- app/index.tsx
- app/(auth)/login.tsx
- app/(auth)/register.tsx
- app/(auth)/otp-verify.tsx
- app/(auth)/forgot-password.tsx
- app/(auth)/reset-password.tsx
- app/(onboarding)/welcome.tsx
- app/(onboarding)/role-select.tsx
- app/(client)/home.tsx
- app/(client)/post-job.tsx
- app/(client)/my-jobs.tsx
- app/(client)/job-detail/[id].tsx
- app/(client)/proposals/[jobId].tsx
- app/(client)/wallet.tsx
- app/(client)/wallet-topup.tsx
- app/(client)/wallet-withdraw.tsx
- app/(client)/messages.tsx
- app/(client)/profile.tsx
- app/(provider)/home.tsx
- app/(provider)/browse-jobs.tsx
- app/(provider)/job-detail/[id].tsx
- app/(provider)/proposals.tsx
- app/(provider)/active-job/[id].tsx
- app/(provider)/earnings.tsx
- app/(provider)/kyc.tsx
- app/(provider)/profile.tsx
- app/(shared)/chat/[id].tsx
- app/(shared)/public-profile/[id].tsx
- app/(shared)/notifications.tsx
- app/(shared)/settings.tsx
- app/(shared)/raise-dispute/[jobId].tsx
- app/(shared)/leave-review/[jobId].tsx
- app/(help)/index.tsx
- app/(help)/faq.tsx
- app/(help)/faq-detail/[id].tsx
- app/(help)/live-chat.tsx
- app/(help)/tickets.tsx
- app/(help)/new-ticket.tsx
- app/(help)/ticket-detail/[id].tsx
- app/(help)/report.tsx
- app/(help)/safety.tsx

---

Start from: app/(auth)/login.tsx
Validate after completion with: cd mobile && npx tsc --noEmit
