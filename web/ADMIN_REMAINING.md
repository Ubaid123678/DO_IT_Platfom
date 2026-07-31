# Web / Admin Portal — Remaining Work

Last updated: 2026-07-30
Status: **Ready for web development — start with Features 1 + 2 below**

> **Full implementation spec → see `docs/ADMIN_DASHBOARD_SPEC.md`**

---

## Priority — Build These First

### Feature 1 — User Management
- **Backend**: ❌ `GET /admin/users` endpoint not built yet (see spec for contract)
- **Web UI**: ❌ User list page + user detail page
- **Scope**: List users with search/filter/pagination, view email/phone verified status, CRUD operations

### Feature 2 — KYC Review
- **Backend**: ✅ Fully built (`GET /kyc/admin/submissions`, detail, approve, reject)
- **Web UI**: ❌ KYC queue list + detail viewer + approve/reject actions

### Feature 3 — Verification (Categories & Skills)
- **Backend**: ✅ Built but **hold for now** — evidence flow still in development
- **Web UI**: ❌ Do not start yet

---

## Web Scaffold Readiness

| Item | Status |
|------|--------|
| Next.js 16.2.2 + TypeScript | ✅ Installed |
| Tailwind CSS v4 + PostCSS | ✅ Configured |
| API client (`lib/api.ts`) | ✅ Ready |
| Static routes (/, /blog, /admin) | ✅ Placeholder pages |
| Production build | ✅ Passes |
| `.env.local` | ❌ Need to create |
| Auth store + login page | ❌ Not started |
| Shared UI component library | ❌ Not started |

Full details in `docs/ADMIN_DASHBOARD_SPEC.md`.
