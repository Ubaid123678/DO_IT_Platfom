# Admin Dashboard — Implementation Spec & Handoff

**Last updated:** 2026-07-30  
**Status:** Backend APIs built + ready; Web UI = **Not started**  
**Target framework:** Next.js 16.2.2 / TypeScript / Tailwind CSS v4

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Feature 1 — User Management](#2-feature-1--user-management)
3. [Feature 2 — KYC Review](#3-feature-2--kyc-review)
4. [Feature 3 — Verification (Categories & Skills) — Coming Soon](#4-feature-3--verification-categories--skills--coming-soon)
5. [Web Scaffold Readiness](#5-web-scaffold-readiness)
6. [What's Implemented vs What's Left](#6-whats-implemented-vs-whats-left)

---

## 1. Overview & Architecture

### Backend Base URL
```
http://localhost:8080/api/v1
```

### Authentication
Same JWT auth as mobile. Admin logs in via `POST /auth/login` (same endpoint, admin role required). Token stored client-side (cookie or localStorage), sent as `Authorization: Bearer <token>`.

### Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": { "message": "..." }
}
```

### API Client (already exists)
`web/lib/api.ts` provides `apiRequest<T>(path, options)` — uses `NEXT_PUBLIC_API_BASE_URL` env variable, handles auth token, parses envelope.

---

## 2. Feature 1 — User Management

### 2.1 Backend Status: ⚠️ Endpoint NOT built yet

There is currently **no admin user listing endpoint**. The route needs to be added.

### 2.2 Recommended API Contract

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | Admin | List users with pagination + filters |
| GET | `/admin/users/:userId` | Admin | Get single user detail |
| PATCH | `/admin/users/:userId` | Admin | Update user (role, ban, etc.) |
| DELETE | `/admin/users/:userId` | Admin | Soft-delete / deactivate user |

### 2.3 GET /admin/users — Proposed Design

**Query parameters (all optional, designed to avoid server load):**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `search` | string | — | Search by name, email, or phone (uses regex, min 2 chars) |
| `role` | string | — | Filter: `client`, `provider`, `admin`, `pending` |
| `email_verified` | bool | — | Filter by email verification status |
| `phone_verified` | bool | — | Filter by phone verification status |
| `kyc_status` | string | — | Filter: `approved`, `pending`, `rejected`, `missing` |
| `sort_by` | string | `createdAt` | Field to sort by |
| `sort_order` | `asc`/`desc` | `desc` | Sort direction |

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "role": "provider",
        "countryCode": "US",
        "emailVerified": true,
        "phoneVerified": true,
        "headline": "Certified Electrician",
        "overall_status": "verified",
        "kyc_status": "approved",
        "createdAt": "2026-07-01T00:00:00.000Z",
        "updatedAt": "2026-07-28T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 152,
      "totalPages": 8
    }
  }
}
```

**Efficiency notes:**
- Uses MongoDB indexes: `role`, `emailVerified`, `phoneVerified`, `createdAt` are already indexed
- Search uses `$regex` with `^` anchor for performance on indexed fields
- KYC status is looked up from the latest `KycDocument` per user — use aggregation pipeline with `$lookup` limited to 1 doc per user, or cache on the User model for faster queries
- Pagination uses `.skip().limit()` with a `.countDocuments()` for total

### 2.4 Recommended: Add `kyc_status` field to User model

To avoid an expensive `$lookup` every time users are listed, add a lightweight `kyc_status` field on the User model that gets updated when KYC is submitted/approved/rejected. This is a denormalization trade-off that saves a join on every list query.

### 2.5 UI Screens Needed

| Screen | Route | Description |
|--------|-------|-------------|
| User List | `/admin/users` | Table with search, filters by role/verification/KYC status, pagination |
| User Detail | `/admin/users/[id]` | Full profile view, edit role, deactivate |

### 2.6 UI Mock States

**Loading:** Skeleton rows (8 lines of grey pulsing rectangles)  
**Empty:** "No users found" centered with user icon, CTA to clear filters  
**Error:** "Failed to load users" with retry button  
**Edge cases:** Search with no results, filter combo with no results, page overflow (page > totalPages → redirect to last page)

---

## 3. Feature 2 — KYC Review

### 3.1 Backend Status: ✅ Fully built

All KYC admin endpoints are ready. Routes are at `/api/v1/kyc/admin/*`.

### 3.2 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/kyc/admin/submissions?status=pending` | List all KYC submissions (optional status filter) |
| GET | `/kyc/admin/submissions/:userId` | Single user's KYC detail with image URLs |
| PATCH | `/kyc/admin/:userId/approve` | Approve KYC (no body) |
| PATCH | `/kyc/admin/:userId/reject` | Reject KYC `{ "reason": "..." }` (reason required) |

### 3.3 GET /kyc/admin/submissions — Response Shape

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "userRole": "provider",
      "status": "pending",          // pending | approved | rejected
      "documentType": "passport",   // pass | driving_license | passport
      "countryCode": "US",
      "submittedAt": "2026-07-28T...",
      "reviewedBy": null,
      "reviewedAt": null,
      "rejectionReason": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### 3.4 GET /kyc/admin/submissions/:userId — Response Shape

Same as above but includes image URLs:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "status": "pending",
    "documentType": "passport",
    "documentImages": {
      "front": "data:image/...",
      "back": null
    },
    "livenessImages": {
      "face_clear": "data:image/...",
      "move_left": "data:image/...",
      "move_right": "data:image/...",
      "smile": "data:image/..."
    },
    "countryCode": "US",
    "submittedAt": "...",
    "rejectionReason": null
  }
}
```

### 3.5 Approval / Rejection

**Approve:** `PATCH /kyc/admin/:userId/approve` — No body. Sets status to `approved`, promotes user role to `provider` if needed.  
**Reject:** `PATCH /kyc/admin/:userId/reject` — Body: `{ "reason": "Document illegible, please resubmit with clearer photo" }`. Sets status to `rejected`.

### 3.6 UI Screens Needed

| Screen | Route | Description |
|--------|-------|-------------|
| KYC List | `/admin/kyc` | Queue of pending submissions with user info + doc type |
| KYC Detail | `/admin/kyc/[userId]` | Full document viewer + approve/reject actions |

### 3.7 KYC Detail Screen — Layout

```
┌─────────────────────────────────────────┐
│  KYC Review — John Doe                  │
│  Submitted: 2026-07-28 14:32 UTC        │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Document    │  │  Document   │       │
│  │  Front       │  │  Back       │       │
│  │  [image]     │  │  [image]    │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  Liveness Photos:                       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Face  │ │Left  │ │Right │ │Smile │  │
│  │[img] │ │[img] │ │[img] │ │[img] │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  Document: Passport                     │
│  Country: US                            │
│                                         │
│  Rejection reason (textarea):           │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Approve]              [Reject]        │
└─────────────────────────────────────────┘
```

### 3.8 UI Mock States

**Loading:** Skeleton for the list table + spinner for detail images  
**Empty (list):** "No pending KYC submissions" with checkmark icon  
**Empty (detail):** "KYC submission not found"  
**Error:** "Failed to load KYC data" with retry  
**Images:** Show loading spinner while image loads, broken image fallback with "Image unavailable" text  
**Approve success:** Toast "KYC approved" → auto-refresh list  
**Reject success:** Toast "KYC rejected" → auto-refresh list  
**Reject without reason:** Inline validation "Rejection reason is required"  
**Network error on action:** Toast "Action failed, please try again"

### 3.9 Important Implementation Notes

- Images may be returned as `data:` URIs (base64) — set proper `max-width: 100%` CSS to prevent overflow  
- Some images may be multipart file paths (`/uploads/kyc/...`) — these won't be accessible from the web UI unless a static file server is configured. For development, either:
  a. Upload a proxy route on the backend to serve files  
  b. Or configure Express `express.static()` to serve the uploads directory  
- Rejection reason is **required** for reject action (validated on backend) — enforce in UI  
- After approval, the user's role becomes `provider` automatically — no additional action needed

---

## 4. Feature 3 — Verification (Categories & Skills) — Coming Soon

The Provider Onboarding & Verification system (Phase 3) is implemented on the backend but is under active development for the correct evidence flow. Admin endpoints exist but should be integrated after the mobile flow stabilizes:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers/admin/records?status=pending_review` | List verification records |
| GET | `/providers/admin/records/:recordId` | Record detail |
| GET | `/providers/admin/records/:recordId/audit-trail` | Admin action history |
| POST | `/providers/admin/records/:recordId/review` | Approve/reject/request-info |

**Do not build UI for these yet** — wait until the mobile evidence flow is finalized.

---

## 5. Web Scaffold Readiness

### 5.1 Current State ✅

| Item | Status | Notes |
|------|--------|-------|
| Next.js 16.2.2 | ✅ Installed | Latest with Turbopack |
| TypeScript | ✅ Configured | Strict mode, path alias `@/*` |
| Tailwind CSS v4 | ✅ Configured | Using `@import "tailwindcss"` syntax (NOT v3 `@tailwind` directives) |
| PostCSS | ✅ Configured | Using `@tailwindcss/postcss` v4 plugin |
| ESLint | ✅ Configured | `eslint-config-next` |
| API client | ✅ Ready | `lib/api.ts` with token support |
| Root layout | ✅ Ready | Geist fonts, globals |
| / route | ✅ Static page | Links to /admin and /blog |
| /blog route | ✅ Static page | Placeholder |
| /admin route | ✅ Static page | Placeholder — needs full UI |
| Production build | ✅ Passes | `npm run build` compiles cleanly |

### 5.2 Missing — Needs Setup Before Development

| Item | Recommendation |
|------|----------------|
| `.env.local` | Create with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1` |
| Auth store | Add token management (cookie or zustand store) |
| Auth guard | HOC/middleware to redirect unauthenticated users to `/admin/login` |
| Shared UI library | Button, Input, Table, Modal, Badge, Card, Pagination components |
| Layout | Admin sidebar + top bar layout with nav links |
| Toast/notification | Add `react-hot-toast` or `sonner` for action feedback |

---

## 6. What's Implemented vs What's Left

### 6.1 Backend

| Feature | Backend | Notes |
|---------|---------|-------|
| User CRUD + list + search | ❌ **Not built** | Needs new route in `auth` or new `admin` module |
| KYC list + detail | ✅ Done | `GET /kyc/admin/submissions`, `GET /kyc/admin/submissions/:userId` |
| KYC approve / reject | ✅ Done | `PATCH /kyc/admin/:userId/approve`, `PATCH /kyc/admin/:userId/reject` |
| Verification records | ✅ Done | See §4 — wait for mobile flow to stabilize |
| Admin login | ✅ Done | Shared `POST /auth/login` with admin role check |

### 6.2 Web UI

| Screen | Status | Priority |
|--------|--------|----------|
| Admin login page | ❌ Not started | P0 — needed to access anything |
| User list + filters + pagination | ❌ Not started | P0 |
| User detail + edit role | ❌ Not started | P1 |
| KYC submissions queue | ❌ Not started | P0 |
| KYC detail with image viewer | ❌ Not started | P0 |
| KYC approve/reject actions | ❌ Not started | P0 |
| Verification records (skills) | ❌ Hold | Wait for mobile flow to stabilize |
| Admin dashboard home | ❌ Not started | P2 |
| Shared component library | ❌ Not started | P0 — build first, reuse everywhere |

### 6.3 Recommended Build Order

```
Week 1:
  1. .env.local + configure API base URL
  2. Auth store + login page (/admin/login)
  3. Auth guard wrapper (redirect if not logged in)
  4. Shared components: Button, Input, Select, Table, Badge, Card, Pagination, Modal, Toast
  5. Admin layout with sidebar navigation

Week 2:
  6. Backend: Build GET /admin/users endpoint (list + search + filters)
  7. User list page with search + filters + pagination
  8. User detail page

Week 3:
  9. KYC submissions list page
  10. KYC detail page with image viewer + approve/reject
```

---

## Appendix: Quick Start for Web Developer

```bash
# 1. Create .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1" > .env.local

# 2. Backend must be running
cd ../backend && npm run dev

# 3. Start web dev server
cd ../web && npm run dev

# 4. Open http://localhost:3000
```

**Note about Next.js 16:** This uses Tailwind CSS v4 with the `@import "tailwindcss"` syntax — NOT the v3 `@tailwind` directives. Read the guide at `node_modules/next/dist/docs/` before writing any code (see `web/AGENTS.md`).
