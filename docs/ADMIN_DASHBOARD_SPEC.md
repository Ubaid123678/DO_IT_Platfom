# Admin Dashboard — Implementation Spec & Handoff

**Last updated:** 2026-08-10  
**Status:** Backend APIs built + ready (Phases 1–3); Web UI = **Not started**  
**Target framework:** Next.js 16.2.2 / TypeScript / Tailwind CSS v4

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Feature 1 — User Management (Phase 1)](#2-feature-1--user-management-phase-1)
3. [Feature 2 — KYC Review (Phase 2)](#3-feature-2--kyc-review-phase-2)
4. [Feature 3 — Verification Records Review (Phase 3)](#4-feature-3--verification-records-review-phase-3)
5. [Feature 4 — Provider Profile Review (Phase 3)](#5-feature-4--provider-profile-review-phase-3)
6. [Web Scaffold Readiness](#6-web-scaffold-readiness)
7. [What's Implemented vs What's Left](#7-whats-implemented-vs-whats-left)

---

## 1. Overview & Architecture

### Backend Base URL
```
http://localhost:8080/api/v1
```

### Admin feature areas (by phase)

| Area | Base path | Backend status |
|------|-----------|----------------|
| User management (Phase 1) | `/api/v1/admin/users` | ❌ **Not built yet** — see §2 |
| KYC review (Phase 2) | `/api/v1/kyc/admin/*` | ✅ Built — see §3 |
| Verification records (Phase 3) | `/api/v1/providers/admin/*` | ✅ Built — see §4 |
| Provider profile review (Phase 3) | `/api/v1/providers/admin/profiles/*` | ⚠️ One endpoint to add — see §5 |

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

## 2. Feature 1 — User Management (Phase 1)

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
| `overall_status` | string | — | Filter: `incomplete`, `pending`, `partially_verified`, `verified`, `rejected` |
| `track` | string | — | Filter: `physical`, `digital`, `errand` |
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
        "track": "physical",
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

### 2.5 Note: Phase 3 fields already on the User model

The `User` model (`backend/src/modules/auth/auth.model.ts`) already carries the Phase 3 verification + profile fields, so the user list/detail screens can surface them without backend changes:
- `overall_status` — `incomplete | pending | partially_verified | verified | rejected`
- `categories_selected`, `skill_items_selected`
- `track` — `physical | digital | errand`
- `provider_profile`, `track_data` (see §5)
- `headline`, `bio`, `languages`, `work_history`, `education`, `resume_file_url`, `public_profile`

### 2.6 UI Screens Needed

| Screen | Route | Description |
|--------|-------|-------------|
| User List | `/admin/users` | Table with search, filters by role/verification/KYC status, pagination |
| User Detail | `/admin/users/[id]` | Full profile view, edit role, deactivate |

### 2.7 UI Mock States

**Loading:** Skeleton rows (8 lines of grey pulsing rectangles)  
**Empty:** "No users found" centered with user icon, CTA to clear filters  
**Error:** "Failed to load users" with retry button  
**Edge cases:** Search with no results, filter combo with no results, page overflow (page > totalPages → redirect to last page)

---

## 3. Feature 2 — KYC Review (Phase 2)

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

## 4. Feature 3 — Verification Records Review (Phase 3)

### 4.1 Backend Status: ✅ Fully built

Phase 3 (Provider Onboarding & Verification System) is **complete** on the backend and mobile, including the per-track profile completion flow (see `docs/PROFILE_COMPLETION_PER_TRACK.md`). The mobile evidence flow has stabilized, so the admin verification UI can be built now.

The verification router is mounted at `/providers`, so all admin endpoints below are at `/api/v1/providers/admin/*` (auth: `Admin` role required).

### 4.2 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers/admin/records` | List verification records (filters + skip/limit pagination) |
| GET | `/providers/admin/records/:recordId` | Record detail — evidence payload + embedded audit trail |
| GET | `/providers/admin/records/:recordId/audit-trail` | Admin action history for a record |
| POST | `/providers/admin/records/:recordId/review` | Approve / reject / request_info |

### 4.3 GET /providers/admin/records — Query Params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter: `draft`, `pending_review`, `scheduled`, `auto_approved`, `approved`, `rejected`, `expired` |
| `category_id` | ObjectId | — | Filter by skill category |
| `sla_overdue` | boolean | — | `true` → only records past their SLA due date |
| `limit` | int | 50 | Items per page (max 200) |
| `skip` | int | 0 | Offset — pagination uses **skip/limit**, not `page` |

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "...",
        "provider": { "fullName": "John Doe", "email": "john@example.com" },
        "category": { "name": "Home Services" },
        "skill_item": { "name": "Electrical" },
        "evidence_type": "certificate",   // certificate | prior_work | portfolio | oauth | digital | physical | errand
        "status": "pending_review",        // draft | pending_review | scheduled | auto_approved | approved | rejected | expired
        "sla_due_at": "2026-08-02T10:00:00.000Z",
        "rejection_reason": null,
        "created_at": "2026-07-31T09:12:00.000Z"
      }
    ],
    "total": 42,
    "limit": 50,
    "skip": 0
  }
}
```

> **Note:** the list response does **not** include `evidence_payload` — open the detail view to inspect the evidence. `skill_item` is `null` for bundle evidence types (`digital`, `physical`, `errand`), which are category-level records.

### 4.4 GET /providers/admin/records/:recordId — Response Shape

```json
{
  "success": true,
  "data": {
    "id": "...",
    "provider": { "fullName": "John Doe", "email": "john@example.com", "phone": "+1234567890" },
    "category": { "name": "Home Services", "job_type": "physical" },
    "skill_item": { "name": "Electrical" },
    "verification_track": "physical",     // physical | digital | errand
    "evidence_type": "physical",
    "evidence_payload": { ... },
    "status": "pending_review",
    "auto_check_result": null,            // populated for auto-verified evidence (OAuth score, URL check)
    "sla_due_at": "2026-08-02T10:00:00.000Z",
    "rejection_reason": null,
    "created_at": "2026-07-31T09:12:00.000Z",
    "updated_at": "2026-07-31T09:12:00.000Z",
    "audit_trail": [
      {
        "id": "...",
        "admin": { "fullName": "Admin User", "email": "admin@do-it.app" },
        "action": "requested_more_info",  // approved | rejected | requested_more_info
        "notes": "Please add a photo of the equipment.",
        "created_at": "2026-08-01T14:00:00.000Z"
      }
    ]
  }
}
```

### 4.5 Evidence Payload — What the Reviewer Sees

`evidence_payload` is a free-form object; its keys depend on `evidence_type`. The current mobile flow submits **category-level bundles** via `POST /verification-records/submit-batch`:

**`physical` bundle:**
```json
{
  "photos": [ { "uri": "...", "caption": "Work site" } ],
  "certificates": [ { "uri": "...", "name": "Electrical License" } ],
  "skill_item_ids": [ "...", "..." ]
}
```

**`digital` bundle:**
```json
{
  "portfolio": { "url": "https://...", "description": "..." },
  "oauth": { "connected": true, "username": "githubuser" },
  "certificates": [ { "uri": "...", "name": "AWS Certification" } ],
  "skill_item_ids": [ "...", "..." ]
}
```

**`errand` bundle (Trust Bundle):**
```json
{
  "background_check": [ { "uri": "...", "name": "...", "issuing_authority": "...", "record_number": "...", "issued_on": "..." } ],
  "vehicle_docs": [ { "uri": "...", "name": "...", "type": "..." } ],
  "service_area": { "city": "Nairobi", "radius_km": 15, "experience_years": 3 },
  "references": [ { "name": "Jane", "contact": "+2547..." } ],
  "skill_item_ids": [ "...", "..." ]
}
```

**Per-skill records** (`evidence_type` = `certificate`, `prior_work`, `portfolio`, `oauth`) carry the same sub-objects keyed directly:
- `certificate` → `{ uri / name list, issuing_body?, credential_id?, credential_url? }`
- `prior_work` → `{ uri + caption list }`
- `portfolio` → `{ url, description }`
- `oauth` → `{ connected, username }` + `auto_check_result` with the GitHub verification score (0–1)

**Rendering rules for the UI:**
- Treat `evidence_payload` as `Record<string, unknown>`; render each key as a labeled card.
- Any value that is an array of `{ uri, ... }` objects → image/document thumbnails.
- `uri` values may be `data:` base64 (mobile camera) or `/uploads/...` paths — same static-serving caveat as §3.9.
- Show `auto_check_result` prominently for auto-verified evidence (e.g. GitHub score, URL HTTP status).

### 4.6 Review Actions — POST /providers/admin/records/:recordId/review

**Body:**
```json
{ "action": "approve", "reason": "..." }
```
| `action` | `reason` | Resulting status |
|----------|----------|------------------|
| `approve` | optional | `approved` |
| `reject` | **required** (min 3 chars) | `rejected` (reason saved to `rejection_reason`) |
| `request_info` | **required** (min 3 chars) | stays `pending_review` (flagged for more info) |

**Constraints:**
- Only records in `pending_review` or `scheduled` status can be reviewed (otherwise `409 RECORD_NOT_PENDING`).
- Every review appends an immutable `AdminReview` record (audit trail) and recomputes the provider's `overall_status`.

**Response:**
```json
{
  "success": true,
  "data": {
    "record": { "id": "...", "status": "approved", "reviewed_by": "...", "reviewed_at": "..." },
    "overall_status": "verified"   // incomplete | pending | partially_verified | verified | rejected
  }
}
```

### 4.7 UI Screens Needed

| Screen | Route | Description |
|--------|-------|-------------|
| Verification Queue | `/admin/verification` | Records table with status filter, SLA-overdue toggle, category filter, skip/limit pagination |
| Record Detail | `/admin/verification/[recordId]` | Evidence viewer + provider context + audit trail + review actions |

### 4.8 Record Detail Screen — Layout

```
┌───────────────────────────────────────────────┐
│  Verification Review — John Doe               │
│  Electrical · Home Services · Physical track  │
│  Submitted: 2026-07-31 09:12 UTC              │
│  SLA due: 2026-08-02 10:00 UTC [OVERDUE]      │
├───────────────────────────────────────────────┤
│  Evidence (physical)                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Photo1│ │Photo2│ │Cert1 │ │Cert2 │         │
│  │[img] │ │[img] │ │[img] │ │[img] │         │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
│                                               │
│  Auto-check: GitHub score 0.82 ✅ (if oauth)  │
│                                               │
│  Audit trail                                  │
│  • 2026-08-01 Admin User requested_more_info  │
│                                               │
│  Review decision:                             │
│  [Approve]  [Request Info]  [Reject]          │
│  Reason (required for reject/request_info):   │
│  ┌───────────────────────────────────────┐    │
│  │                                       │    │
│  └───────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
```

### 4.9 UI Mock States

**Loading:** Skeleton table rows + spinner for detail evidence  
**Empty (queue):** "No verification records" with checkmark icon  
**Empty (detail):** "Record not found"  
**Error:** "Failed to load verification data" with retry  
**Images:** Spinner while loading, broken-image fallback  
**Approve success:** Toast "Record approved" → auto-refresh queue  
**Reject / request_info without reason:** Inline validation "Reason is required"  
**Review on non-reviewable status:** Disable actions when status ≠ `pending_review` / `scheduled`; toast on 409  
**Network error on action:** Toast "Action failed, please try again"

---

## 5. Feature 4 — Provider Profile Review (Phase 3)

### 5.1 Backend Status: ⚠️ One small endpoint to add

Phase 3 added per-track profile completion with a live completeness score (`provider_profile`, `track_data`, `track` on the User model). However, the profile endpoint `GET /providers/profile` is **self-scoped** — it reads the authenticated user's id. There is currently **no admin endpoint to inspect another provider's profile + track data + completeness**. (`GET /providers/:providerId/public` is privacy-gated by `public_profile` and returns a reduced shape for the public viewer — not suitable for admin review.)

The serialization logic already exists as `serializeProviderProfile(user, track)` in `backend/src/modules/verification/verification.service.ts` — the new endpoint is mostly a route + thin handler.

### 5.2 Recommended API Contract (backend to add)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/providers/admin/profiles/:providerId` | Admin | Full provider profile + track data + completeness + selected categories |

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "provider",
      "countryCode": "US",
      "emailVerified": true,
      "phoneVerified": true,
      "overall_status": "verified",
      "createdAt": "2026-07-01T00:00:00.000Z"
    },
    "categories": [ { "id": "...", "name": "Home Services", "job_type": "physical" } ],
    "provider_profile": {
      "avatar_url": "/uploads/avatar/....jpg",
      "headline": "Certified Electrician",
      "bio": "5+ years residential wiring",
      "languages": [ { "code": "en", "level": "fluent" } ],
      "city": "Nairobi",
      "availability": { "days": ["Tue", "Wed"], "shifts": ["Afternoon"], "hours_per_week": 35 },
      "public_profile": true
    },
    "track": "physical",
    "track_data": {
      "physical": {
        "years_experience": 6,
        "service_radius_km": 25,
        "tools_equipment": ["Multimeter", "Drill"],
        "hourly_rate": 25,
        "on_site_availability": { "days": ["Tue", "Wed"], "shifts": ["Afternoon"], "hours_per_week": 35 },
        "can_travel": true,
        "team_size": "solo",
        "insurance": { "covered": true, "doc_uri": null },
        "has_transport": { "yes": true, "mode": "car" }
      }
    },
    "completeness": 95,
    "missing_fields": ["Profile photo"]
  }
}
```

**Implementation note:** the provider row in `listForAdmin` (§4.3) already exposes `provider.id` — link the record detail → profile review directly. `track_data` uses only the active track's key (`physical` | `digital` | `errand`).

### 5.3 UI Screens Needed

| Screen | Route | Description |
|--------|-------|-------------|
| Provider Profile Review | `/admin/users/[id]/profile` | Read-only per-track view + completeness meter + missing fields; linked from user detail and verification record detail |

### 5.4 Per-Track Sections (render the active track only)

**Universal (`provider_profile`):** avatar, headline, bio, languages, city, availability (`days` / `shifts` / `hours_per_week`), `public_profile` toggle state.

**`physical` (`track_data.physical`):** years_experience, service_radius_km, tools_equipment, hourly_rate, on_site_availability, can_travel, team_size, insurance (covered + doc_uri), has_transport (yes + mode).

**`digital` (`track_data.digital`):** skills, tech_stack, hourly_rate, project_rate, timezone, english_proficiency, work_history, education, resume_file_url.

**`errand` (`track_data.errand`):** service_area (city, radius_km), transport_mode, base_fee, per_km_fee, working_hours, same_day_express, delivery_capabilities, max_payload_kg, max_package_size, goods_insurance.

### 5.5 UI Mock States

**Loading:** Skeleton profile card  
**Error:** "Failed to load provider profile" with retry  
**No profile data:** "Provider has not completed their profile" (completeness 0)  
**Completeness meter:** Ring/progress bar always visible; `missing_fields` listed under it  
**Documents:** avatar / insurance doc / resume rendered with `max-width: 100%` and broken-image fallback (see §3.9 static-serving note)

---

## 6. Web Scaffold Readiness

### 6.1 Current State ✅

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

### 6.2 Missing — Needs Setup Before Development

| Item | Recommendation |
|------|----------------|
| `.env.local` | Create with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1` |
| Auth store | Add token management (cookie or zustand store) |
| Auth guard | HOC/middleware to redirect unauthenticated users to `/admin/login` |
| Shared UI library | Button, Input, Table, Modal, Badge, Card, Pagination components |
| Layout | Admin sidebar + top bar layout with nav links |
| Toast/notification | Add `react-hot-toast` or `sonner` for action feedback |

---

## 7. What's Implemented vs What's Left

### 7.1 Backend

| Feature | Backend | Notes |
|---------|---------|-------|
| User CRUD + list + search | ❌ **Not built** | Needs new route in `auth` or new `admin` module — see §2 |
| KYC list + detail | ✅ Done | `GET /kyc/admin/submissions`, `GET /kyc/admin/submissions/:userId` |
| KYC approve / reject | ✅ Done | `PATCH /kyc/admin/:userId/approve`, `PATCH /kyc/admin/:userId/reject` |
| Verification records queue/detail/audit | ✅ Done | `GET /providers/admin/records`, `GET .../:recordId`, `GET .../audit-trail` — see §4 |
| Verification record review | ✅ Done | `POST /providers/admin/records/:recordId/review` — approve / reject / request_info |
| Provider profile admin view | ⚠️ Small addition | Add `GET /providers/admin/profiles/:providerId` — see §5 |
| Admin login | ✅ Done | Shared `POST /auth/login` with admin role check |

### 7.2 Web UI

| Screen | Status | Priority |
|--------|--------|----------|
| Admin login page | ❌ Not started | P0 — needed to access anything |
| User list + filters + pagination | ❌ Not started | P0 |
| User detail + edit role | ❌ Not started | P1 |
| KYC submissions queue | ❌ Not started | P0 |
| KYC detail with image viewer | ❌ Not started | P0 |
| KYC approve/reject actions | ❌ Not started | P0 |
| Verification records queue (Phase 3) | ❌ Not started | P1 |
| Verification record detail + evidence viewer + audit trail (Phase 3) | ❌ Not started | P1 |
| Verification review actions (approve/reject/request_info) (Phase 3) | ❌ Not started | P1 |
| Provider profile review + completeness meter (Phase 3) | ❌ Not started | P2 |
| Admin dashboard home | ❌ Not started | P2 |
| Shared component library | ❌ Not started | P0 — build first, reuse everywhere |

### 7.3 Recommended Build Order

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

Week 4 (Phase 3):
  11. Backend: Add GET /providers/admin/profiles/:providerId
  12. Verification records queue page (status filter, SLA overdue, pagination)
  13. Verification record detail page — evidence viewer + audit trail + review actions
  14. Provider profile review page (completeness meter + per-track view)
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
