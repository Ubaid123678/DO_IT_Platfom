# DO IT PLATFORM — ADMIN DASHBOARD FRONTEND MASTER CONTEXT
# Read this entire document before generating any screen.
# This is a one-time context setup for the full admin web build,
# in the same style as `detail_for_frontend.md` (mobile), adapted for
# Next.js + Tailwind CSS v4 + the Stitch MCP server via OpenCode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WHAT IS THIS APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the **Do It Admin Dashboard** — a private, internal-only web
application used by Do It platform admins to:
  - Manage users (clients, providers, admins)
  - Review and approve/reject provider KYC (identity verification)
  - Review and approve/reject provider skill verification records
    (physical / digital / errand tracks)
  - Inspect a provider's completed profile and completeness score

It is **not** the public marketing website — it is a separate,
IP-whitelisted + MFA-hardened, role-gated internal tool, built as its
own Next.js route group so it can later be deployed on a private
subdomain (e.g. `admin.doitplatform.com`) independent of the public
site.

It shares the exact same backend (`/api/v1`) as the mobile app —
no separate admin backend. It talks to already-built endpoints (KYC,
verification) and two small endpoints that still need to exist on the
backend (`/admin/users*`, `/providers/admin/profiles/:providerId`) —
see §9 "Backend Endpoint Status" so the agent building this does not
assume an endpoint exists that hasn't shipped yet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework:     Next.js 16.2.2 (App Router, `web/app/`)
Language:      TypeScript ONLY — never generate .js/.jsx files
Styling:       Tailwind CSS v4 — uses `@import "tailwindcss"` syntax,
               NOT the old v3 `@tailwind base/components/utilities`
               directives. Config lives in CSS via `@theme`, not
               `tailwind.config.js` content blocks for design tokens.
PostCSS:       `@tailwindcss/postcss` v4 plugin (already configured)
Icons:         lucide-react (preferred) — no blue-only icon sets
State:         React state / Zustand for auth + filters (small, no
               Redux needed)
HTTP:          `web/lib/api.ts` → `apiRequest<T>(path, options)`
               already exists — reads `NEXT_PUBLIC_API_BASE_URL`,
               attaches `Authorization: Bearer <token>`, unwraps the
               `{ success, data, meta }` envelope. ALWAYS use this,
               never call `fetch()` directly in a screen.
Auth storage:  Token in an httpOnly-style client cookie (or
               localStorage fallback) via a small `useAdminAuth()`
               hook — build once, reuse everywhere.
Toasts:        `sonner` (or `react-hot-toast`) for action feedback
Tables:        Plain semantic `<table>` + Tailwind, no heavy grid lib
               needed at this scale
Images:        Next.js `<Image>` where a fixed size is known;
               plain `<img>` for base64 `data:` URIs (Next/Image
               cannot optimize those)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BACKEND CONNECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base URL (dev):    http://localhost:8080/api/v1
Env var:           NEXT_PUBLIC_API_BASE_URL
Auth:              Same JWT as mobile. POST /auth/login (role must
                   resolve to "admin"). Store access + refresh token,
                   same rotation pattern as mobile's api.ts interceptor
                   (401 → refresh → retry once → else force logout to
                   /admin/login).
Response envelope: { success: boolean, data: T, meta?: object }
Error envelope:    { success: false, error: { code, message, details? }, request_id }

All admin endpoints require: valid JWT + role=admin. In production
they also sit behind IP whitelist + MFA at the infra layer — the
frontend does not need to implement IP checks, but MUST implement a
clean "session expired / not authorized" redirect back to
`/admin/login` on any 401/403.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FOLDER STRUCTURE — ACTIVE PROJECT (web/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

web/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx              ← Admin Login (Screen 1)
│   │   ├── layout.tsx                ← Admin Shell: sidebar + topbar +
│   │   │                                auth guard (wraps everything below)
│   │   ├── page.tsx                  ← Dashboard Home (Screen 2)
│   │   ├── users/
│   │   │   ├── page.tsx              ← User List (Screen 3)
│   │   │   └── [id]/
│   │   │       ├── page.tsx          ← User Detail (Screen 4)
│   │   │       └── profile/
│   │   │           └── page.tsx      ← Provider Profile Review (Screen 5)
│   │   ├── kyc/
│   │   │   ├── page.tsx              ← KYC Queue (Screen 6)
│   │   │   └── [userId]/
│   │   │       └── page.tsx          ← KYC Detail + Review (Screen 7)
│   │   └── verification/
│   │       ├── page.tsx              ← Verification Queue (Screen 8)
│   │       └── [recordId]/
│   │           └── page.tsx          ← Verification Record Detail + Review (Screen 9)
│   ├── (public site routes — untouched, out of scope here)
│   ├── layout.tsx                    ← Root layout (Geist fonts, globals)
│   └── globals.css                   ← Tailwind v4 `@theme` tokens live here
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopbar.tsx
│   │   ├── AdminAuthGuard.tsx
│   │   ├── StatusPill.tsx            ← colored status badge (kyc/verification/overall)
│   │   ├── DataTable.tsx             ← generic table shell (header, rows, empty, skeleton)
│   │   ├── Pagination.tsx
│   │   ├── FilterBar.tsx             ← search + select filters row
│   │   ├── EvidenceViewer.tsx        ← renders evidence_payload generically
│   │   ├── ImageLightbox.tsx
│   │   ├── AuditTrailList.tsx
│   │   ├── CompletenessRing.tsx
│   │   └── ReviewActionBar.tsx       ← Approve / Reject / Request Info buttons + reason box
│   └── ui/                            ← shared primitives (Button, Input, Select,
│                                          Card, Badge, Modal, Skeleton, EmptyState, Toast)
├── hooks/
│   ├── useAdminAuth.ts
│   └── useAdminApi.ts                 ← thin wrapper adding admin-specific error handling
├── lib/
│   └── api.ts                         ← already exists, reuse as-is
└── AGENTS.md                          ← existing Tailwind v4 notes, read before styling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SCREEN CONSOLIDATION — HOW MANY ACTUAL FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Following the same "combine states into one screen" philosophy used
on mobile (e.g. `kyc.tsx` holding all 4 KYC states), the admin
dashboard is **9 route screens + 1 shared layout shell**, not one
file per state:

| # | Screen | Route file | States folded in |
|---|---|---|---|
| 1 | Admin Login | `app/admin/login/page.tsx` | idle, submitting, invalid-credentials error, redirect-if-already-authed |
| — | Admin Shell (layout) | `app/admin/layout.tsx` | sidebar, topbar, auth guard, logout — wraps every screen below, not counted as a "screen" |
| 2 | Dashboard Home | `app/admin/page.tsx` | loading, loaded, error |
| 3 | User List | `app/admin/users/page.tsx` | loading (skeleton rows), loaded, empty, error, search-no-results, filter-no-results, page-overflow |
| 4 | User Detail | `app/admin/users/[id]/page.tsx` | loading, loaded, edit-role, ban/deactivate confirm, not-found, error |
| 5 | Provider Profile Review | `app/admin/users/[id]/profile/page.tsx` | loading, loaded (per active track), no-profile-yet (0% completeness), error |
| 6 | KYC Queue | `app/admin/kyc/page.tsx` | loading, loaded, empty ("no pending"), error, status-filter tabs (pending/approved/rejected/all) |
| 7 | KYC Detail | `app/admin/kyc/[userId]/page.tsx` | loading, loaded, image-loading/broken, approve-success, reject-validation, reject-success, action-network-error, not-found |
| 8 | Verification Queue | `app/admin/verification/page.tsx` | loading, loaded, empty, error, SLA-overdue toggle, category filter, status filter, skip/limit pagination |
| 9 | Verification Record Detail | `app/admin/verification/[recordId]/page.tsx` | loading, loaded, evidence-type-specific rendering, auto-check-result badge, audit trail, approve/reject/request-info + validation, 409-non-reviewable disabled state, not-found |

Shared component library (§ below) is built **first**, once, and
reused by all 9 screens — do not re-implement Button/Table/Badge/etc.
per screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## DESIGN TOKENS — CRITICAL — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The admin dashboard MUST use the same confirmed teal/amber system as
the mobile app and public website. **No blue anywhere in the UI** —
this is a non-negotiable, cross-surface rule (mobile, web, admin all
share it). Where a typical admin template would reach for blue
(primary buttons, active nav item, links, info banners, focus rings,
"info" status chips) — use **teal** instead.

Admin is **light-theme only** for v1 (internal tool, not a
dark-mode requirement), but tokens are still defined as CSS variables
in `app/globals.css` under `@theme` so dark mode can be added later
without touching component code.

```css
/* app/globals.css — Tailwind v4 token block */
@import "tailwindcss";

@theme {
  --color-primary:        #1A9E8F;
  --color-primary-mid:    #7ABFB8;
  --color-primary-light:  #E0F4F2;
  --color-primary-dark:   #0D7A6E;
  --color-amber:          #F5A623;
  --color-amber-light:    #FEF3DC;
  --color-success:        #27AE60;
  --color-success-light:  #E8F8F2;
  --color-error:          #E74C3C;
  --color-error-light:    #FDECEA;
  --color-warning:        #F39C12;
  --color-warning-light:  #FEF6E7;
  --color-bg:             #F5F7F7;
  --color-surface:        #FFFFFF;
  --color-border:         #D8E6E4;
  --color-text-primary:   #1A1A1A;
  --color-text-secondary: #5B6664;
  --color-text-hint:      #9AA6A4;
  --color-sidebar-bg:     #0D2624;
  --color-sidebar-text:   #CFEAE6;
  --color-sidebar-active: #1A9E8F;
}
```

Rules for every screen/component:
- NEVER hardcode a hex value inline in a component — always reference
  the Tailwind classes generated from these tokens
  (`bg-primary`, `text-error`, `border-border`, etc.) or the CSS var
  directly (`var(--color-primary)`) if a class doesn't exist for the
  case.
- Primary buttons, active nav links, focus rings, links, and the
  "info" status pill all use `--color-primary` (teal) — never blue.
- Status pill color mapping (used across KYC status, verification
  status, `overall_status`, and ban state):

| Status value | bg token | text token |
|---|---|---|
| `pending` / `pending_review` / `scheduled` | `--color-amber-light` | `--color-amber` |
| `approved` / `verified` / `auto_approved` | `--color-success-light` | `--color-success` |
| `rejected` | `--color-error-light` | `--color-error` |
| `incomplete` / `draft` / `missing` | `--color-border` (bg) | `--color-text-hint` |
| `partially_verified` | `--color-amber-light` | `--color-amber` |
| `expired` | `--color-error-light` | `--color-error` |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Font: Geist (already wired in root layout) — do not swap fonts.

  pageTitle:     24px / 700   ← screen H1 ("KYC Review — John Doe")
  sectionTitle:  18px / 600   ← card/section headers
  tableHeader:   12px / 600, uppercase, tracking-wide, text-secondary
  body:          14px / 400
  small:         13px / 400   ← meta text, timestamps
  micro:         12px / 400   ← badge labels, hints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## LAYOUT / SPACING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sidebar width:            240px, fixed, `bg-sidebar-bg`
Topbar height:             64px, `bg-surface`, bottom border `border`
Content max width:        1280px, centered, `px-8 py-6`
Card padding:              20px, `rounded-2xl`, `border border-border`, `bg-surface`
Section gap:               24px
Table row height:          52px, zebra optional (`odd:bg-bg`)
Button height (primary):   40px
Button height (small):     32px
Input height:               40px
Border radius (cards):     16px
Border radius (buttons/inputs): 10px
Border radius (pills/badges):    9999px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SHARED COMPONENT LIBRARY — BUILD THIS FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Request this from Stitch/OpenCode BEFORE any screen prompt below.
Everything downstream imports from here.

```
@stitch Build the shared admin UI component library for the Do It
admin dashboard.
Files: web/components/ui/Button.tsx, Input.tsx, Select.tsx, Card.tsx,
Badge.tsx, Modal.tsx, Skeleton.tsx, EmptyState.tsx, Toast.tsx (or
sonner wrapper), Table.tsx (generic <table> shell with header/row/
empty/skeleton slots), Pagination.tsx.
Also: web/components/admin/StatusPill.tsx, AdminSidebar.tsx,
AdminTopbar.tsx, AdminAuthGuard.tsx, FilterBar.tsx,
ReviewActionBar.tsx, EvidenceViewer.tsx, ImageLightbox.tsx,
AuditTrailList.tsx, CompletenessRing.tsx.

Design tokens: use the CSS variables and Tailwind v4 @theme block
defined in the master context (teal #1A9E8F primary, amber #F5A623
accent, NO blue anywhere — replace every default "primary blue" a
typical admin template would use with the teal token). Tailwind v4
syntax only (`@import "tailwindcss"`), not v3 @tailwind directives.

Button.tsx: variants `primary` (teal fill, white text), `secondary`
(border, teal text), `danger` (error fill, white text), `ghost`
(no bg/border, text-secondary). Sizes `sm` (32px) / `md` (40px).
Disabled + loading (spinner) states.

Input.tsx / Select.tsx: label above, 40px height, border-border,
focus ring in primary teal, inline error text below (12px, text-error).

StatusPill.tsx: takes a `status` string + a `variant` prop
("kyc" | "verification" | "overall" | "ban"), maps to the color
table in the master context (amber=pending, teal=info/default,
success=approved/verified, error=rejected/expired, gray=
incomplete/draft/missing). Renders as a small pill: dot + label,
uppercase micro text.

Table.tsx: generic shell — `columns` prop, `rows` prop, `loading`
(renders 8 skeleton rows), `empty` (icon + title + subtitle + CTA
slot), `onRowClick`. Sticky header, zebra striping optional.

Pagination.tsx: supports BOTH page-based (page/totalPages) and
skip/limit-based (skip/limit/total) modes via a `mode` prop, since
the User/KYC screens use page pagination and the Verification screen
uses skip/limit pagination per the backend contract.

AdminSidebar.tsx: 240px fixed, dark teal bg (--color-sidebar-bg),
logo/wordmark "Do It Admin" at top, nav links: Dashboard, Users, KYC
Review, Verification, with lucide-react icons (LayoutDashboard,
Users, ShieldCheck, ClipboardCheck). Active link highlighted with
--color-sidebar-active (teal) background pill, NEVER blue. Logout
button pinned at bottom.

AdminTopbar.tsx: 64px, white bg, shows current page title (passed as
prop or derived from route), admin's name/avatar on the right with a
dropdown (Profile placeholder, Logout).

AdminAuthGuard.tsx: client component wrapping admin layout children;
reads auth token via useAdminAuth(); if missing/expired, redirect to
/admin/login; while checking, render a full-page centered spinner
(teal, no layout shell).

FilterBar.tsx: horizontal row — search input (debounced 300ms) +
up to 3 select filters + a "Clear filters" ghost button, wraps to
2 lines on narrow viewports.

ReviewActionBar.tsx: takes `onApprove`, `onReject`, `onRequestInfo`
(the last two optional based on context), a `reasonRequired` flag
per action, renders 2-3 buttons (Approve=success variant custom,
Request Info=secondary, Reject=danger) + a collapsible reason
textarea that's required (min 3 chars) for reject/request-info with
inline validation "Reason is required" — disables the button until
valid. Disables ALL actions if a `disabled` prop is true (e.g.
record status isn't pending_review/scheduled) and shows a small note
why.

EvidenceViewer.tsx: takes an `evidencePayload: Record<string, unknown>`
and `evidenceType` string. Renders each top-level key as a labeled
sub-card. If a value is an array of objects containing a `uri` key →
render as an image/document thumbnail grid (opens ImageLightbox on
click); `uri` may be a `data:` base64 URI OR a `/uploads/...` path —
handle both with a plain <img> (not next/image) and a broken-image
fallback text "Image unavailable". If a value is a primitive
(string/number/boolean) → render as a label:value row. Show
`auto_check_result` (if present, separately passed in) as a
highlighted badge/card above the rest, e.g. "GitHub score: 0.82 ✅".

ImageLightbox.tsx: click-to-enlarge modal for any thumbnail, dark
overlay, close on backdrop click or Escape.

AuditTrailList.tsx: vertical timeline of { admin.fullName, action,
notes, created_at } entries, action pill colored via StatusPill
variant="overall"-like mapping (approved=success, rejected=error,
requested_more_info=amber).

CompletenessRing.tsx: circular progress ring (0-100), teal stroke,
percentage centered, small text label below ("Profile completeness").

Do NOT use blue for any default/focus/info state in any of these
components. Confirm with a visual sweep before finishing: no ring,
border, fill, or icon color other than teal/amber/success/error/
warning/neutral-gray should appear anywhere.
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SCREEN GENERATION RULES — MANDATORY FOR ALL SCREENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. FILE TYPE: Always `.tsx`, never `.js`/`.jsx`.
2. Server vs client: route `page.tsx` files that fetch on mount,
   manage filters/pagination, or handle form state are **client
   components** (`"use client"` at top). Keep data-fetching in the
   page itself via `useEffect` + `apiRequest`, or a small local hook
   — no need for React Query at this scale.
3. Every screen imports its layout wrapper implicitly via
   `app/admin/layout.tsx` (sidebar + topbar + auth guard) — do NOT
   re-implement navigation chrome inside individual screens.
4. ALWAYS handle four states explicitly: loading (skeleton via
   `Table`/`Skeleton`), loaded, empty, error (with a retry button).
   Never leave a bare blank screen for any of these.
5. ALWAYS use `web/lib/api.ts`'s `apiRequest<T>()` — never raw
   `fetch()`.
6. Pagination: match the backend's actual contract per screen —
   User List & KYC List use `page`/`limit`; Verification List uses
   `skip`/`limit`. Do not invent a pagination style that doesn't
   match §9's endpoint contracts.
7. Images that may be `data:` base64 OR `/uploads/...` paths: use
   `<img>` with `max-w-full h-auto object-contain`, wrap in
   `ImageLightbox`, and a broken-image `onError` fallback showing
   "Image unavailable" text.
8. Destructive/consequential actions (reject KYC, reject/request-info
   a verification record, deactivate a user) require the reason field
   validation described in the relevant screen prompt AND show a
   toast on success/failure.
9. Never surface raw backend error codes to the admin; map to a
   short human message + keep `request_id` visible in small gray text
   for support/debugging.
10. Respect the "no blue" rule everywhere — this applies even to
    incidental things like `<a>` link color, focus outlines, and any
    library-default "info" alert color.
11. Every list screen needs pagination controls even if very few
    admins will ever page past screen 1 — build it correctly from day
    one since the dataset will grow.
12. IMPORTS:
    UI primitives from `@/components/ui/ComponentName`
    Admin-specific components from `@/components/admin/ComponentName`
    API client from `@/lib/api`
    Auth hook from `@/hooks/useAdminAuth`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ALL 9 ADMIN SCREENS — FILE PATHS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app/admin/login/page.tsx                    ← 1. Admin Login
  app/admin/layout.tsx                        ← Shell (not a "screen", wraps all)
  app/admin/page.tsx                          ← 2. Dashboard Home
  app/admin/users/page.tsx                    ← 3. User List
  app/admin/users/[id]/page.tsx               ← 4. User Detail
  app/admin/users/[id]/profile/page.tsx       ← 5. Provider Profile Review
  app/admin/kyc/page.tsx                      ← 6. KYC Queue
  app/admin/kyc/[userId]/page.tsx             ← 7. KYC Detail + Review
  app/admin/verification/page.tsx             ← 8. Verification Queue
  app/admin/verification/[recordId]/page.tsx  ← 9. Verification Record Detail + Review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BACKEND ENDPOINT STATUS — READ BEFORE BUILDING SCREENS 3/4/5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Fully built now: KYC (`/kyc/admin/*`) and Verification
   (`/providers/admin/*`) endpoints — Screens 6, 7, 8, 9 can be wired
   to a live backend immediately.

⚠️ NOT built yet: `/admin/users`, `/admin/users/:userId`,
   `/admin/users/:userId` PATCH/DELETE, and
   `/providers/admin/profiles/:providerId`. Screens 3, 4, 5 must still
   be built now (UI + data-fetching code against the contract below),
   but should be wired against typed mock data / MSW until the
   backend ships these routes, so the UI doesn't block on backend
   work. Use the exact response shapes documented per-screen below —
   they are the agreed contract the backend will implement against.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## HOW TO REQUEST EACH SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After pasting this master context once, request each screen with its
full prompt from §"SCREEN PROMPTS" below, one at a time, e.g.:

  @stitch [paste Screen 1 prompt verbatim]

The Stitch MCP will generate the complete .tsx file(s) with:
- Correct client/server component boundary
- All loading/empty/error/success states
- Design tokens applied (teal/amber, no blue)
- Correct imports from the shared component library
- Real API calls via `apiRequest<T>()` against the documented
  endpoint contracts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SCREEN PROMPTS (send one at a time, in this order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--------------------------------------------------------------------
## SCREEN 0 — Admin Shell / Layout (build before any screen below)
--------------------------------------------------------------------

File: `web/app/admin/layout.tsx`

```
@stitch Build the Do It Admin Dashboard shell layout.
File: web/app/admin/layout.tsx
This is a server component that renders <AdminAuthGuard> wrapping a
flex layout: <AdminSidebar> (240px fixed left) + a right column with
<AdminTopbar> on top and the page `children` below in a scrollable
content area (max-w-[1280px] mx-auto px-8 py-6, bg=--color-bg).
The /admin/login route is OUTSIDE this layout (it has no sidebar/
topbar) — structure the route groups so app/admin/login/page.tsx
does NOT inherit this shell (use a route group like
app/admin/(shell)/... for everything except login, or check pathname
inside AdminAuthGuard and skip chrome on /admin/login).
Follow all rules from the master context above (teal/amber tokens,
no blue, Tailwind v4 syntax).
```

--------------------------------------------------------------------
## SCREEN 1 — Admin Login
--------------------------------------------------------------------

File: `web/app/admin/login/page.tsx`

```
@stitch Build the Admin Login screen for Do It platform.
File: web/app/admin/login/page.tsx (client component, no sidebar/
topbar chrome — full-screen centered card).
Follow all rules from the master context above.

Layout: centered card (max-w-[400px]), "Do It" wordmark + "Admin"
subtitle above the card, teal accent bar or icon.

Fields: email (type=email, required), password (type=password,
required, with show/hide toggle icon).

Submit: POST /auth/login via apiRequest<{ user, accessToken,
refreshToken }>('/auth/login', { method: 'POST', body: { email,
password } }). On success: verify returned user.role === 'admin' —
if not, show inline error "This account does not have admin access"
and do NOT store the token. If role is admin, store tokens via
useAdminAuth().login(), then router.push('/admin').

States:
- idle: empty form, submit disabled until both fields non-empty
- submitting: submit button shows spinner, fields disabled
- invalid credentials (401): inline banner above the form,
  "Invalid email or password", red (--color-error), form re-enabled
- non-admin role: inline banner as described above
- network/server error: inline banner "Something went wrong, please
  try again"
- already authenticated: on mount, if a valid token already exists,
  redirect straight to /admin without flashing the form

Use Button/Input from the shared component library. Primary submit
button uses the teal primary variant, full width. No "forgot
password" link needed for v1. No signup link — this is admin-only,
accounts are provisioned manually.
```

--------------------------------------------------------------------
## SCREEN 2 — Dashboard Home
--------------------------------------------------------------------

File: `web/app/admin/page.tsx`

```
@stitch Build the Admin Dashboard Home screen for Do It platform.
File: web/app/admin/page.tsx (client component, rendered inside the
admin shell layout — sidebar/topbar already provided).
Follow all rules from the master context above.

Purpose: a quick-glance operational overview + fast links into the
three work queues (Users, KYC, Verification). This is a lightweight
landing page, not a full analytics dashboard.

Layout: page title "Dashboard". A row of 4 stat cards (use Card):
  - "Pending KYC" — count, teal accent, links to /admin/kyc?status=pending
  - "Pending Verification" — count, amber accent, links to
    /admin/verification?status=pending_review
  - "SLA Overdue" — count, error accent, links to
    /admin/verification?sla_overdue=true
  - "Total Users" — count, neutral, links to /admin/users
Below: two quick-access cards side by side — "Recent KYC Submissions"
(latest 5, from GET /kyc/admin/submissions?status=pending, showing
name + submitted date + a "Review" link) and "Recent Verification
Records" (latest 5, from GET /providers/admin/records?status=
pending_review&limit=5, showing provider + category/skill + a
"Review" link).

Data fetching: fetch KYC pending list and Verification pending-review
list (limit=5 each) on mount via apiRequest; derive the stat counts
from the `total`/array length of those same calls (don't invent a
separate stats endpoint — compute from what's already fetched, and
note in a code comment that a dedicated GET /admin/stats endpoint
would be a future optimization). "Total Users" stat can show a
placeholder "—" with a tooltip "Coming soon" since GET /admin/users
isn't built yet (see backend endpoint status in master context) —
still make the card link to /admin/users.

States: loading (skeleton stat cards + skeleton list rows), loaded,
error per-section (each of the two "Recent..." cards handles its own
fetch error independently with a small retry link, so one failing
section doesn't blank the whole page).
```

--------------------------------------------------------------------
## SCREEN 3 — User List
--------------------------------------------------------------------

File: `web/app/admin/users/page.tsx`

```
@stitch Build the User List screen for Do It Admin Dashboard.
File: web/app/admin/users/page.tsx (client component).
Follow all rules from the master context above.

Purpose: search/filter/browse all platform users (clients, providers,
admins) with pagination. Backend endpoint GET /admin/users is not
built yet — wire this screen to the documented contract below so it
is ready the moment the backend ships; use realistic typed mock data
behind a small `USE_MOCK_USERS` flag/local mock function so the
screen is demoable now.

Contract — GET /admin/users
Query params: page (default 1), limit (default 20, max 100), search
(string, min 2 chars, matches name/email/phone), role (client|
provider|admin|pending), email_verified (bool), phone_verified
(bool), kyc_status (approved|pending|rejected|missing),
overall_status (incomplete|pending|partially_verified|verified|
rejected), track (physical|digital|errand), sort_by (default
createdAt), sort_order (asc|desc, default desc).
Response: { users: [{ id, fullName, email, phone, role, countryCode,
emailVerified, phoneVerified, headline, overall_status, track,
kyc_status, createdAt, updatedAt }], pagination: { page, limit,
total, totalPages } }.

Layout: page title "Users". <FilterBar> with: search input
(debounced), Role select (All/Client/Provider/Admin/Pending), KYC
Status select (All/Approved/Pending/Rejected/Missing), Overall Status
select (All/Incomplete/Pending/Partially Verified/Verified/Rejected),
"Clear filters" button. Below: <Table> with columns: Name (bold) +
email/phone as secondary line, Role (pill), Country, Verified
(two small check/x icons for email/phone), KYC Status (StatusPill
variant="kyc"), Overall Status (StatusPill variant="overall",
provider rows only — blank for clients), Joined (relative date),
row is clickable → router.push(`/admin/users/${id}`).
<Pagination mode="page"> below the table using the response's
`pagination` object.

States:
- loading: 8 skeleton rows
- loaded: table populated
- empty (no users at all): centered user icon + "No users found" +
  "Clear filters" CTA if any filter is active
- search-no-results / filter-no-results: same empty state, message
  adapts to "No users match your search" / "No users match these
  filters"
- error: "Failed to load users" + retry button
- page overflow (page > totalPages after a filter change reduces
  results): auto-clamp to last valid page and refetch

Use Table/Pagination/FilterBar/StatusPill from the shared component
library.
```

--------------------------------------------------------------------
## SCREEN 4 — User Detail
--------------------------------------------------------------------

File: `web/app/admin/users/[id]/page.tsx`

```
@stitch Build the User Detail screen for Do It Admin Dashboard.
File: web/app/admin/users/[id]/page.tsx (client component, reads
`id` via useParams()).
Follow all rules from the master context above.

Purpose: view a single user's full account info, change their role,
and deactivate/ban the account. Backend endpoints (GET/PATCH/DELETE
/admin/users/:userId) are not built yet — wire against the contract
below with the same mock-data fallback approach as Screen 3.

Contract:
GET /admin/users/:userId → same user shape as the list row, plus:
  isActive (bool), isBanned (bool), banReason (string|null),
  lastSeen (date), ipAtRegistration (string).
PATCH /admin/users/:userId → body can include { role } and/or
  { isBanned, banReason } — returns the updated user.
DELETE /admin/users/:userId → soft-deactivate, body { reason }.

Layout: breadcrumb "Users / {fullName}". Header card: avatar
initials circle, full name (page title size), email + phone as
secondary text, Role pill + KYC StatusPill + Overall StatusPill
inline. A "View Provider Profile →" link (only if role=provider),
goes to /admin/users/[id]/profile.

Below, two-column info grid in a Card: Country, Email Verified
(icon), Phone Verified (icon), Joined date, Last Seen, Registration
IP.

Actions section (Card): "Change Role" — Select (client/provider/
admin/pending) + Save button, calls PATCH with { role }, toast on
success/failure. "Account Status" — if active: "Deactivate Account"
button (danger, opens a <Modal> requiring a reason textarea, min 3
chars, confirms via PATCH { isBanned: true, banReason }); if banned:
show the ban reason + a "Reactivate Account" button (secondary,
PATCH { isBanned: false, banReason: null }).

States: loading (skeleton header + skeleton grid), loaded, not-found
(404 → "User not found" + back-to-list link), error (retry button),
role-change-saving (button spinner), deactivate-confirm (modal open),
action-success (toast + refetch), action-error (toast).

Use Card/Select/Button/Modal/StatusPill from the shared component
library.
```

--------------------------------------------------------------------
## SCREEN 5 — Provider Profile Review
--------------------------------------------------------------------

File: `web/app/admin/users/[id]/profile/page.tsx`

```
@stitch Build the Provider Profile Review screen for Do It Admin
Dashboard.
File: web/app/admin/users/[id]/profile/page.tsx (client component,
`id` = providerId via useParams()).
Follow all rules from the master context above.

Purpose: read-only deep view of a provider's completed profile +
active track data + completeness score, for admin QA/support use.
Backend endpoint GET /providers/admin/profiles/:providerId is not
built yet (small addition planned server-side, reusing the existing
`serializeProviderProfile` service function) — wire against the exact
contract below with mock-data fallback like Screens 3/4.

Contract — GET /providers/admin/profiles/:providerId response:
{
  user: { id, fullName, email, phone, role, countryCode,
    emailVerified, phoneVerified, overall_status, createdAt },
  categories: [{ id, name, job_type }],
  provider_profile: { avatar_url, headline, bio, languages: [{code,
    level}], city, availability: { days, shifts, hours_per_week },
    public_profile },
  track: "physical" | "digital" | "errand",
  track_data: { physical?: {...}, digital?: {...}, errand?: {...} }
    — only the key matching `track` is populated, render that one,
  completeness: number (0-100),
  missing_fields: string[]
}

Layout: breadcrumb "Users / {fullName} / Profile". Header: avatar
image (fallback initials), fullName, headline, city, track badge
(pill: Physical/Digital/Errand, teal). On the right: <CompletenessRing
value={completeness} /> + a "Missing fields" list below it (small,
text-hint, bullet list from `missing_fields`, or "All fields
complete ✓" in success color if empty).

Universal section (Card "Profile"): bio (full text), languages (pill
per language, "English — Fluent"), availability (days as pills,
shifts, hours/week), public_profile shown as a small "Public" /
"Private" pill.

Track-specific section (Card, title = "Physical Track Details" /
"Digital Track Details" / "Errand Track Details" based on `track`),
rendering ONLY the fields for the active track as label:value rows
or pill groups:
  physical → years_experience, service_radius_km, tools_equipment
    (pills), hourly_rate, on_site_availability, can_travel (yes/no
    pill), team_size, insurance (covered yes/no + doc thumbnail if
    doc_uri present, opens ImageLightbox), has_transport (yes/no +
    mode).
  digital → skills (pills), tech_stack (pills), hourly_rate,
    project_rate, timezone, english_proficiency, work_history (list
    of role/company/dates), education (list), resume_file_url (link
    "View Resume ↗").
  errand → service_area (city + radius_km), transport_mode, base_fee,
    per_km_fee, working_hours, same_day_express (yes/no), delivery_
    capabilities (pills), max_payload_kg, max_package_size, goods_
    insurance (yes/no).

Categories section (Card): pill list of `categories[].name` with a
small `job_type` sub-label.

States: loading (skeleton header + skeleton cards), loaded (renders
only the active track's card as described), no-profile-yet
(completeness=0, provider_profile fields empty → show a friendly
"Provider has not completed their profile yet" notice instead of
empty cards), error (retry), not-found.

This screen is read-only — no edit actions, no approve/reject here
(that happens on the Verification screens). Use Card/StatusPill/
CompletenessRing/ImageLightbox from the shared component library.
```

--------------------------------------------------------------------
## SCREEN 6 — KYC Queue
--------------------------------------------------------------------

File: `web/app/admin/kyc/page.tsx`

```
@stitch Build the KYC Review Queue screen for Do It Admin Dashboard.
File: web/app/admin/kyc/page.tsx (client component).
Follow all rules from the master context above. This endpoint is
fully built — wire it live, no mocks needed.

Endpoint: GET /kyc/admin/submissions?status={status} (status param
optional: pending|approved|rejected — omit for all).
Response: data = array of { id, userId, userRole, status,
documentType, countryCode, submittedAt, reviewedBy, reviewedAt,
rejectionReason, createdAt, updatedAt }.

Layout: page title "KYC Review". Status filter as tabs (not a select)
— "Pending" (default active), "Approved", "Rejected", "All" — each
refetches with the matching status param (All = no param). Below:
<Table> columns: User (need to resolve display — show userId
truncated with a "view" affordance since this endpoint doesn't
include name/email; add a code comment noting a future backend
enhancement could include user summary fields), Role, Document Type
(Passport/Driving License/National ID — humanize the raw value),
Country, Status (StatusPill variant="kyc"), Submitted (relative
date), row clickable → router.push(`/admin/kyc/${userId}`).

States: loading (skeleton rows), loaded, empty per active tab
("No pending KYC submissions" with a checkmark icon for the Pending
tab specifically — that's the "all caught up" happy path; generic
"No submissions" for other tabs), error (retry).

Use Table/StatusPill from the shared component library. No
pagination needed if the endpoint doesn't paginate (confirm from the
contract — it returns a flat array), but leave a code comment marking
where client-side pagination could be added if volume grows.
```

--------------------------------------------------------------------
## SCREEN 7 — KYC Detail + Review
--------------------------------------------------------------------

File: `web/app/admin/kyc/[userId]/page.tsx`

```
@stitch Build the KYC Detail & Review screen for Do It Admin
Dashboard.
File: web/app/admin/kyc/[userId]/page.tsx (client component, reads
`userId` via useParams()). Live endpoints, no mocks.

Endpoints:
GET /kyc/admin/submissions/:userId → { id, userId, status,
  documentType, documentImages: { front, back }, livenessImages:
  { face_clear, move_left, move_right, smile }, countryCode,
  submittedAt, rejectionReason }.
PATCH /kyc/admin/:userId/approve → no body.
PATCH /kyc/admin/:userId/reject → body { reason } (required).

Layout: breadcrumb "KYC Review / {userId}". Header: "KYC Review —
{userId}" as title (or fetch a display name if available), "Submitted
{relative date}" as subtitle, current StatusPill variant="kyc" next
to it.

Document images section (Card "Identity Document"): two-up grid,
"Front" and "Back" labeled thumbnails (Back may be null — show "Not
required for this document type" placeholder if so), each opens
ImageLightbox on click, broken-image fallback "Image unavailable",
loading spinner while the <img> loads.

Liveness section (Card "Liveness Photos"): 4-up grid — Face, Look
Left, Look Right, Smile — same thumbnail/lightbox/fallback pattern.

Meta row: Document Type (humanized), Country.

Review section (only rendered/enabled if status === "pending"; if
already approved/rejected, show the outcome instead — "Approved by
{reviewedBy} on {reviewedAt}" or "Rejected: {rejectionReason}" with a
StatusPill, and hide the action buttons): <ReviewActionBar> with
Approve (calls PATCH .../approve, no reason needed) and Reject
(reason textarea required, min 3 chars, inline validation "Rejection
reason is required" if submitted empty, calls PATCH .../reject with
{ reason }).

States: loading (skeleton), loaded-pending (actions visible),
loaded-decided (outcome shown, actions hidden), image-loading/broken
per-thumbnail, approve-success (toast "KYC approved" → refetch,
which will flip to loaded-decided), reject-validation-error, reject-
success (toast "KYC rejected" → refetch), action-network-error
(toast "Action failed, please try again", form stays open so admin
can retry), not-found ("KYC submission not found" + back link).

Note in a code comment: images may be `data:` base64 URIs (mobile
camera capture) — the <img> tags must NOT use next/image for these,
plain <img> with max-w-full only.

Use ReviewActionBar/ImageLightbox/StatusPill/Card from the shared
component library.
```

--------------------------------------------------------------------
## SCREEN 8 — Verification Queue
--------------------------------------------------------------------

File: `web/app/admin/verification/page.tsx`

```
@stitch Build the Verification Records Queue screen for Do It Admin
Dashboard.
File: web/app/admin/verification/page.tsx (client component). Live
endpoint, no mocks.

Endpoint: GET /providers/admin/records
Query params: status (draft|pending_review|scheduled|auto_approved|
approved|rejected|expired), category_id (ObjectId), sla_overdue
(bool), limit (default 50, max 200), skip (default 0) — pagination is
SKIP/LIMIT here, not page-based, this is different from the User/KYC
screens, implement accordingly.
Response: { records: [{ id, provider: { fullName, email }, category:
{ name }, skill_item: { name } | null, evidence_type: certificate|
prior_work|portfolio|oauth|digital|physical|errand, status,
sla_due_at, rejection_reason, created_at }], total, limit, skip }.
Note: skill_item is null for the category-level bundle types
(digital/physical/errand evidence_type) — render "—" or the category
name alone for those rows.

Layout: page title "Verification Review". <FilterBar> with: Status
select (All + each status value, humanized), Category select
(fetch categories list if a categories endpoint is available, else a
free-text category_id input as a fallback — add a code comment),
"SLA Overdue only" toggle switch. Below: <Table> columns: Provider
(fullName + email secondary line), Category, Skill Item (or "—" for
bundle types), Evidence Type (pill, humanized), Status (StatusPill
variant="verification"), SLA Due (relative date/time, colored
--color-error and an "OVERDUE" micro-badge if past due and status is
still pending_review/scheduled), Submitted (relative date), row
clickable → router.push(`/admin/verification/${id}`).
<Pagination mode="skip-limit"> below using total/limit/skip from the
response.

States: loading (skeleton rows), loaded, empty ("No verification
records" + checkmark icon when status=pending_review and empty — the
happy path), filter-no-results, error (retry).

Use Table/FilterBar/Pagination/StatusPill from the shared component
library.
```

--------------------------------------------------------------------
## SCREEN 9 — Verification Record Detail + Review
--------------------------------------------------------------------

File: `web/app/admin/verification/[recordId]/page.tsx`

```
@stitch Build the Verification Record Detail & Review screen for Do
It Admin Dashboard.
File: web/app/admin/verification/[recordId]/page.tsx (client
component, reads `recordId` via useParams()). Live endpoints, no
mocks.

Endpoints:
GET /providers/admin/records/:recordId → { id, provider: { fullName,
  email, phone }, category: { name, job_type }, skill_item: { name }
  | null, verification_track: physical|digital|errand, evidence_type,
  evidence_payload: Record<string, unknown>, status, auto_check_
  result: object | null, sla_due_at, rejection_reason, created_at,
  updated_at, audit_trail: [{ id, admin: { fullName, email }, action:
  approved|rejected|requested_more_info, notes, created_at }] }.
POST /providers/admin/records/:recordId/review → body { action:
  "approve"|"reject"|"request_info", reason?: string } — reason
  required (min 3 chars) for reject and request_info, optional for
  approve. Response: { record: { id, status, reviewed_by,
  reviewed_at }, overall_status } — the provider's recomputed overall
  status, show it in a toast, e.g. "Record approved — provider is
  now Verified".
Constraint: only records with status pending_review or scheduled can
  be reviewed — if the backend returns 409 RECORD_NOT_PENDING, show a
  toast "This record is no longer pending review" and refetch to
  sync the UI.

Layout: breadcrumb "Verification / {provider.fullName}". Header:
"Verification Review — {provider.fullName}" title, subtitle line
"{skill_item.name ?? category.name} · {category.name} ·
{verification_track} track", "Submitted {relative date}" +
StatusPill variant="verification", and if sla_due_at is past and
status is still reviewable, an "OVERDUE" badge in error color next
to the SLA date.

Evidence section (Card "Evidence"): <EvidenceViewer
evidencePayload={...} evidenceType={...} /> — must correctly render
both the per-skill shapes (certificate: uri/name list + issuing_body/
credential_id/credential_url; prior_work: uri+caption list; portfolio:
url+description; oauth: connected+username) AND the category-level
bundle shapes (physical bundle: photos[], certificates[],
skill_item_ids[]; digital bundle: portfolio{}, oauth{}, certificates
[], skill_item_ids[]; errand/"Trust Bundle": background_check[],
vehicle_docs[], service_area{}, references[], skill_item_ids[]) per
the master context's EvidenceViewer spec — treat evidence_payload
generically as Record<string, unknown>, do not hardcode a shape.

Auto-check section (only if auto_check_result is not null): highlight
card, e.g. "GitHub score: 0.82 ✅" or URL check status — render
whatever keys are present generically (key: value), same pattern as
EvidenceViewer.

Audit trail section (Card "Audit Trail"): <AuditTrailList
entries={audit_trail} /> — empty state "No review actions yet" if
the array is empty.

Review section: <ReviewActionBar> with Approve / Request Info /
Reject wired to the POST endpoint as described above. `disabled` prop
= true (with note "This record has already been reviewed — status:
{status}") whenever status is NOT pending_review or scheduled.

States: loading (skeleton), loaded-reviewable (actions enabled),
loaded-already-reviewed (actions disabled + note), evidence-type-
specific rendering (as above), auto-check-present vs absent, image-
loading/broken per thumbnail inside EvidenceViewer, reason-validation
-error for reject/request_info, action-success (toast with the new
overall_status → refetch), 409-conflict (toast + refetch + auto-
switch to disabled state), network-error (toast, form stays open),
not-found ("Record not found" + back link).

Use EvidenceViewer/AuditTrailList/ReviewActionBar/StatusPill/Card
from the shared component library.
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## RECOMMENDED BUILD ORDER FOR OPENCODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Paste this entire master context once.
2. Request "Shared Component Library" (the block above §"SHARED
   COMPONENT LIBRARY").
3. Request Screen 0 (Admin Shell layout).
4. Request Screen 1 (Login) — needed to reach anything else.
5. Request Screens 6 → 7 (KYC Queue → KYC Detail) — fully live
   backend, fastest path to a usable admin tool.
6. Request Screens 8 → 9 (Verification Queue → Verification Detail)
   — fully live backend.
7. Request Screen 2 (Dashboard Home) — depends on 6/8's endpoints.
8. Request Screens 3 → 4 → 5 (Users → User Detail → Provider Profile
   Review) — build against the documented contract with mock-data
   fallback since these backend routes aren't shipped yet; swap to
   live data the moment they land.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CONTEXT LOADED. READY TO BUILD.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You now have full awareness of the Do It Admin Dashboard project.
Confirm you have read and understood this context by saying:
"Do It Admin Dashboard context loaded. Ready to build screens."
Then wait for the first screen request.
