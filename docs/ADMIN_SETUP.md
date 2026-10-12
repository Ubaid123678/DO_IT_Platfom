# Admin Web Setup

This guide starts the Do It backend and Next.js admin console locally. Use
development-only credentials and secrets; do not deploy the sample values from
`backend/.env.example`.

## Prerequisites

- Node.js and npm versions supported by the backend and web package manifests
- MongoDB reachable from the backend
- Redis reachable at `REDIS_URL` if verification background jobs are required

## Environment

### Backend

From PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Set these values in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Use `development` locally. |
| `PORT` | Backend HTTP port; defaults to `8080`. |
| `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_DB_NAME` | Database name. |
| `REDIS_URL` | Redis connection string for background jobs. |
| `JWT_SECRET` | Secret used to sign access tokens. |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens. |
| `JWT_EXPIRES_IN` | Access-token lifetime, for example `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime, for example `30d`. |
| `WEB_ORIGIN` | Allowed browser origin; defaults to `http://localhost:3000`. |
| `ADMIN_EMAIL` | Email address for the initial administrator. |
| `ADMIN_PASSWORD` | Strong password for the initial administrator. |
| `ADMIN_PHONE` | Phone number for the initial administrator. |
| `ADMIN_COUNTRY_CODE` | Country code for the initial administrator. |

The application also supports optional integration settings such as
`OTP_DEBUG_MODE`, Stripe, email, SMS, and storage credentials. Configure them
in `backend/.env` only when exercising those integrations. Never commit `.env`.

Login attempts are limited to 10 per IP address in a 15-minute window. A
limited request returns HTTP 429 with error code `LOGIN_RATE_LIMITED`.

### Web

From the repository root:

```powershell
cd web
Copy-Item .env.local.example .env.local
```

Set `NEXT_PUBLIC_API_BASE_URL` in `web/.env.local` to the backend API root:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Seed and migration

Install the backend dependencies and run the KYC-status backfill before using
the admin KYC status filters:

```powershell
cd backend
npm ci
npm run migrate:kyc-status
npm run seed:admin
```

`seed:admin` creates the configured admin only if one does not already exist.
It reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment and is safe to
run more than once. The backend startup also ensures the configured admin
account exists.

Run the KYC migration again after restoring a database that predates the
`kyc_status` user field. It initializes users without KYC documents to
`missing` and copies the latest KYC document status to each user who has a
document.

## Start the services

In separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd web
npm ci
npm run dev
```

Open `http://localhost:3000/admin/login`. Sign in using `ADMIN_EMAIL` and
`ADMIN_PASSWORD`. The backend is available at `http://localhost:8080`; its
health endpoint is `http://localhost:8080/health`.

## Admin API endpoints

All endpoints below are under `/api/v1`. Admin endpoints require an access
token in the `Authorization: Bearer <token>` header and an admin role; missing
or invalid authentication returns 401 and a non-admin role returns 403.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Authenticate; returns the user role and access/refresh tokens. |
| `GET` | `/admin/dashboard/stats` | Dashboard totals, review counts, and recent activity. |
| `GET` | `/admin/users` | Search, filter, sort, and paginate users. |
| `GET` | `/admin/users/:userId` | Read user and provider profile details. |
| `PATCH` | `/admin/users/:userId` | Change role or active status, with optional reason. |
| `DELETE` | `/admin/users/:userId` | Soft-delete (deactivate) a user. |
| `GET` | `/kyc/admin/submissions` | Search, filter, sort, and paginate KYC submissions. |
| `GET` | `/kyc/admin/submissions/:userId` | Read a user's KYC submission detail. |
| `PATCH` | `/kyc/admin/:userId/approve` | Approve a pending KYC submission. |
| `PATCH` | `/kyc/admin/:userId/reject` | Reject a pending KYC submission with a reason. |
| `GET` | `/providers/admin/profiles/:providerId` | Read a provider's admin profile and active-track data. |
| `GET` | `/providers/admin/records` | Search and paginate verification records. |
| `GET` | `/providers/admin/records/:recordId` | Read verification evidence and review detail. |
| `GET` | `/providers/admin/records/:recordId/audit-trail` | Read the verification review audit trail. |
| `POST` | `/providers/admin/records/:recordId/review` | Approve, reject, or request more information. |

KYC image files under `/uploads/kyc/*` also require an admin Bearer token.
Other upload folders retain their existing public access behavior.

## Admin end-to-end checklist

Use a local database with test users and pending review records. The checklist
does not approve/reject live customer records automatically.

- [ ] Sign in at `/admin/login` as the configured admin; confirm the dashboard
  opens and refresh preserves the session.
- [ ] Open Users, apply a role/search/filter combination, and confirm the URL
  and list reflect the backend response.
- [ ] Open a test user and change its role; confirm the update and audit trail.
- [ ] Open a pending KYC test submission; approve it, and separately verify
  rejection with a reason on another pending test submission.
- [ ] Open a pending verification test record; review it with a valid action
  and reason where required.
- [ ] Open a provider profile and confirm completeness, missing fields, and
  active-track data load.
- [ ] Return to Dashboard; confirm the updated review counts/activity appear
  after manual refresh or within the 60-second refresh interval.
- [ ] Sign out and confirm protected admin routes return to the login screen.

Automated API authorization, login, admin endpoint, and response-contract
checks can be run with `cd backend; npm test -- --run`. The browser checklist
requires the backend, web app, local database, seeded admin, and appropriate
test records to be running.
