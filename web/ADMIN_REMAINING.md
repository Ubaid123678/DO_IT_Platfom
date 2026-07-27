# Web / Admin Portal — Remaining Work

Last updated: 2026-07-27
Status: Deferred until mobile app completion (see Phase 12 in docs/IMPLEMENTATION_PHASES.md)

---

## Overview

The web folder (`web/`) currently contains a Next.js scaffold with TypeScript, Tailwind CSS, and ESLint — nothing more. All delivery focus is on the mobile app + shared backend. This file tracks everything still needed for the public website and private admin portal.

---

## Public Website Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Home / Landing | `/` | Not started | Hero, features, CTA, stats |
| How It Works | `/how-it-works` | Not started | Step-by-step for clients and providers |
| Categories | `/categories` | Not started | Browse service categories |
| Trust & Safety | `/trust-safety` | Not started | KYC, escrow, dispute process |
| Help / FAQ | `/help` | Not started | Common questions, support |
| Legal (Privacy, Terms) | `/legal/privacy`, `/legal/terms` | Not started | Legal documents |
| Auth pages | `/login`, `/register`, `/forgot-password`, `/reset-password` | Not started | Shared with mobile but web-specific UI |
| Provider listing | `/providers` | Not started | Browse/search providers (future) |
| Job detail (public) | `/jobs/[id]` | Not started | Public job view |

---

## Admin Portal Pages

All admin endpoints exist on the backend (`/api/v1/admin/*`, `/api/v1/kyc/admin/*`). The admin UI needs to be built.

| Page | Route | Backend Status | Admin UI Status |
|------|-------|---------------|-----------------|
| Admin login | `/admin/login` | Done (shared auth) | Not started |
| Dashboard | `/admin` | — | Not started (stats/overview) |
| Submissions (KYC) | `/admin/kyc` | Done | Not started |
| KYC detail + approve/reject | `/admin/kyc/[userId]` | Done | Not started |
| Skill Verification queue | `/admin/verification-records` | Phase 3 | Not started |
| Verification detail + approve/reject/request-info | `/admin/verification-records/[id]` | Phase 3 | Not started |
| Verification audit trail | `/admin/verification-records/[id]/audit-trail` | Phase 3 | Not started |
| In-person test result entry | `/admin/in-person-tests/[id]/result` | Phase 3 | Not started |
| User management | `/admin/users` | Partially done | Not started |
| Job management | `/admin/jobs` | Not started | Not started |
| Dispute management | `/admin/disputes` | Not started | Not started |
| Fraud flags | `/admin/fraud` | Not started | Not started |
| Audit logs | `/admin/audit` | Backend ready | Not started |
| Settings | `/admin/settings` | — | Not started |

---

## Backend Admin Endpoints Already Built

These endpoints exist and are ready for web/admin UI consumption:

KYC:
- `GET /api/v1/kyc/admin/submissions` — List KYC submissions (optional status filter)
- `GET /api/v1/kyc/admin/submissions/:userId` — KYC submission detail with images
- `PATCH /api/v1/kyc/admin/:userId/approve` — Approve KYC
- `PATCH /api/v1/kyc/admin/:userId/reject` — Reject KYC (reason required)

Skill Verification (Phase 3 - Provider Onboarding & Verification):
- `GET /api/v1/admin/verification-records` — List verification records (status, category, SLA filters)
- `POST /api/v1/admin/verification-records/:id/approve` — Approve verification
- `POST /api/v1/admin/verification-records/:id/reject` — Reject verification (reason required)
- `POST /api/v1/admin/verification-records/:id/request-info` — Request more info from provider
- `GET /api/v1/admin/verification-records/:id/audit-trail` — Full admin action history
- `POST /api/v1/admin/in-person-tests/:id/result` — Record in-person test pass/fail

Shared:
- `GET /api/v1/auth/me` — Current admin user info
- `POST /api/v1/auth/login` — Admin login (same auth)

---

## Shared Components Needed

React component library for both public website and admin portal:

- Button, Input, Select, Modal, Table, Card, Badge
- Layout: Header, Footer, Sidebar (admin)
- Auth guard wrapper (redirect to login if not authenticated)
- API service layer with token management
- Theme tokens (matching mobile)
- Loading, empty, error state components

---

## Integration Points

The web frontend will consume the same backend as mobile:

- Same REST API endpoints under `/api/v1/`
- Same JWT auth (access + refresh tokens)
- Same envelope response format (`{ success, data, meta }`)
- Same validation rules (shared Joi schemas)

---

## Order of Implementation (Phase 12)

1. **Admin login** — reuse auth API, admin-only gate
2. **KYC review dashboard** — submissions list + detail + approve/reject actions
3. **Skill Verification review dashboard** — verification records list + detail + approve/reject/request-info
4. **User management** — list/search users, view details
5. **Public website pages** — home, how it works, categories, trust & safety
6. **Job management** — list/edit/remove jobs
7. **Dispute management** — review disputes, issue verdicts
8. **Fraud management** — review fraud flags
9. **Responsive QA** — mobile web, tablet, laptop, desktop
10. **SEO + Performance** — meta tags, structured data, Lighthouse score
