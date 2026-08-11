# Web / Admin Portal — Remaining Work

Last updated: 2026-08-10
Status: **Ready for web development — start with Features 1 + 2 + 3 below** (Phase 3 backend is complete)

> **Full implementation spec → see `docs/ADMIN_DASHBOARD_SPEC.md`**

---

## Priority — Build These First

### Feature 1 — User Management (Phase 1)
- **Backend**: ❌ `GET /admin/users` endpoint not built yet (see spec for contract)
- **Web UI**: ❌ User list page + user detail page
- **Scope**: List users with search/filter/pagination, view email/phone verified status, overall verification status (`overall_status`), KYC status, and `track`; edit role, deactivate

### Feature 2 — KYC Review (Phase 2)
- **Backend**: ✅ Fully built (`GET /kyc/admin/submissions`, detail, approve, reject)
- **Web UI**: ❌ KYC queue list + detail viewer + approve/reject actions
- **Scope**: Document + liveness image review, approve/reject with required reason

### Feature 3 — Verification Records Review (Phase 3)
- **Backend**: ✅ Fully built — `GET /providers/admin/records`, `GET /providers/admin/records/:recordId`, `GET /providers/admin/records/:recordId/audit-trail`, `POST /providers/admin/records/:recordId/review`
- **Web UI**: ❌ Verification queue + record detail (evidence viewer) + audit trail + review actions
- **Scope**: Review per-category/per-skill evidence (physical/digital bundles + errand Trust Bundle), SLA-overdue view, immutable audit trail, approve / reject / request_info with required reason

### Feature 4 — Provider Profile Review (Phase 3)
- **Backend**: ⚠️ One small endpoint to add — `GET /providers/admin/profiles/:providerId` (serialization logic already exists; see spec §5)
- **Web UI**: ❌ Read-only per-track profile view + completeness meter + missing fields
- **Scope**: Inspect a provider's completed profile, active-track data, completeness %, and missing fields; linked from user detail and verification record detail

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
