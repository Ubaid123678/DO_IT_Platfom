# Do It Platform - Master Documentation

Version: 2.0 (Implementation Handoff)
Last updated: 2026-04-06
Status: Approved for implementation

## 1. Executive Summary

Do It is a global service marketplace mobile platform connecting clients and providers for both:
- Local physical services (transport, cleaning, repairs, etc.)
- Digital remote services (design, development, writing, etc.)

The product is now moving from planning to implementation.

Current implementation scope:
- Build complete mobile app + website + backend + admin API capabilities
- Mobile app and website frontend are separate codebases sharing the same backend services
- Shared database and core backend services must support app and website together without breaking changes

## 2. Product Scope

### 2.1 In Scope (Now)
- React Native mobile app (client + provider experiences)
- Next.js website (public pages + authenticated web experiences as required)
- Authentication and verification
- KYC lifecycle for providers
- Job posting, proposal lifecycle, matching, and completion
- Wallet, escrow, payouts, and transaction ledger
- Notifications (in-app + push + email/SMS events)
- Dispute workflow and admin resolution endpoints
- Fraud flag generation pipeline
- Multi-language and multi-currency behavior
- Production-ready backend API and infrastructure foundations

### 2.2 Out of Scope (Now)
- Native desktop app
- Advanced BI dashboards beyond required operational analytics

### 2.3 Principle
All backend design decisions must preserve forward compatibility for future website and admin web interfaces.

## 3. Users, Roles, and Permissions

### 3.1 Roles
- Client: post jobs, accept proposals, fund escrow, confirm completion, review providers
- Provider: complete KYC, browse/apply jobs, complete work, receive payouts
- Admin: KYC review, dispute resolution, fraud review, moderation and operations

### 3.2 Access Model
- JWT access tokens (short-lived)
- Refresh token rotation
- Role-based authorization middleware
- Admin endpoint hardening: role check + IP whitelist + MFA enforcement at admin auth layer

## 4. Confirmed Technology Stack

- Mobile app: React Native (Expo)
- Backend API: Node.js + Express.js
- Database: MongoDB Atlas
- Cache/queues: Redis + Bull
- Realtime: Socket.io
- File storage: AWS S3 or Cloudflare R2
- Push: Firebase Cloud Messaging (FCM)
- Payments: Stripe (top-up), Wise (payout conversion)
- Email: SendGrid
- SMS/OTP: Twilio
- Geolocation: MaxMind GeoIP2
- Website/admin frontend: Next.js (same program track, separate frontend codebase)

## 5. System Architecture

## 5.1 High-Level Components
- Mobile App (Client + Provider)
- Website Frontend (Next.js)
- API Gateway/Application Server (Express modules)
- Domain services (auth, jobs, wallet, notifications, disputes, fraud)
- MongoDB (source of truth)
- Redis (cache, throttling, queue broker)
- Worker services (Bull consumers for fraud, notifications, FX refresh, scheduled tasks)
- Third-party adapters (Stripe, Wise, FCM, SendGrid, Twilio, MaxMind)

## 5.2 Architectural Style
- Modular monolith first (single deployable backend with clear module boundaries)
- Queue-backed asynchronous workflows for long-running and non-critical operations
- Event-driven internal architecture for side effects:
  - Example: proposal accepted -> emit event -> wallet escrow lock + notifications + analytics update

## 5.3 Frontend Separation and Shared Backend
Keep app and website decoupled through:
- API versioning (/api/v1)
- Shared domain services and repositories
- No frontend-specific logic in persistence layer

Frontend separation rules:
- Mobile frontend and website frontend have separate UI layers, routing, and release cycles
- Shared business rules remain in backend services only
- Frontend-specific data shaping should happen in dedicated response mappers, not in core domain logic

## 5.4 Website Scope Baseline
Website module scope in this program:
- Public pages: home, how it works, categories, trust and safety, support, legal
- Authenticated web flows where required by product roadmap
- Shared auth and profile APIs with mobile
- Shared i18n and currency display rules aligned with backend configuration

## 6. Core Business Flows

## 6.1 Onboarding and Verification
1. User registers with role
2. Email OTP verify
3. Phone OTP verify
4. Provider must complete KYC before full provider actions

## 6.2 Job Lifecycle
States:
- open -> in_progress -> completed -> closed
- open/in_progress -> cancelled
- completed -> disputed -> resolved

Rules:
- Exactly one accepted proposal per job
- Escrow lock required at transition to in_progress
- Completion payout only after client confirmation or dispute verdict

## 6.3 Matching
Physical jobs:
- Geo radius filter + category + KYC approved + availability + min rating
- Prioritize distance then rating
- Notify top matching providers

Digital jobs:
- Category/skill matching without geo constraints

## 6.4 Wallet and Payments
- Ledger-first model (transactions immutable)
- Internal amount normalization to USD
- Display in user-selected currency via FX rates
- Escrow sub-balance and movement tracking required per job

## 6.5 Dispute Resolution
- Evidence window after dispute creation
- Admin verdict determines escrow release path
- Dispute outcomes and reasons are immutable once finalized (except admin correction flow with audit log)

## 6.6 Fraud Pipeline
- Trigger checks on registration, payment, job milestones, and account security events
- Store flags with severity and review status
- No automatic permanent bans without admin approval (except explicit high-risk rule where policy permits)

## 7. Data Model Baseline

Collections already defined:
- users
- provider_profiles
- jobs
- proposals
- wallets
- transactions
- reviews
- notifications
- categories
- fraud_flags
- kyc_documents
- audit_logs
- messages (to be added now as mandatory for chat)

## 7.1 Mandatory Indexes
- users: email unique, phone unique, role + kyc_status
- provider_profiles: 2dsphere(location), categories, service_type
- jobs: status + created_at, client_id + status, provider_id + status, category_id + status
- proposals: job_id + provider_id unique partial (active statuses)
- wallets: user_id unique
- transactions: job_id, from_wallet_id, to_wallet_id, type + created_at
- notifications: user_id + is_read + created_at
- messages: job_id + created_at, sender_id + created_at
- fraud_flags: user_id + reviewed + severity
- kyc_documents: user_id + status + created_at

## 7.2 Data Integrity Rules
- Never hard delete financial records
- Use status transitions with audit logs for sensitive entities
- Enforce ObjectId references at service layer with existence checks
- Use optimistic concurrency or transactional safeguards where money movement is involved

## 8. API Design Standards

## 8.1 Versioning and Naming
- Prefix all endpoints with /api/v1
- Resource-based route naming
- Consistent plural naming

## 8.2 Response Envelope
Standard success response:
- success: boolean
- data: object or array
- meta: optional pagination or context

Standard error response:
- success: false
- error: { code, message, details? }
- request_id

## 8.3 Validation
- Strict schema validation on every write endpoint
- Reject unknown fields for protected endpoints
- Centralized validation error format

## 8.4 Idempotency
Required for payment-sensitive endpoints:
- wallet top-up confirmation
- escrow lock/release operations
- payout initiation
Use idempotency keys per request source.

## 8.5 Pagination
- Cursor pagination preferred for high-volume feeds
- Offset allowed for small admin lists

## 9. Mobile Frontend Requirements

## 9.1 UI Theme (Confirmed)
Use the confirmed teal/amber system exactly as defined by project decisions:
- Primary Teal: #1A9E8F
- Teal Mid: #7ABFB8
- Teal Light: #E0F4F2
- Teal Dark: #0D7A6E
- Amber Accent: #F5A623
- Amber Light: #FEF3DC
- Success: #27AE60
- Error: #E74C3C
- Warning: #F39C12

No blue palette should be introduced in product UI.

## 9.2 Responsive and Adaptive Design Requirements
Although this is a mobile app, the UI must be responsive across:
- small phones (320-360 width)
- standard phones (375-430 width)
- large phones/phablets
- tablets

Mandatory responsive rules:
- Use fluid spacing scale tokens, not fixed hardcoded per-screen pixel assumptions
- Use SafeArea handling and keyboard-aware layouts
- Support portrait and graceful tablet landscape behavior for major screens
- Ensure long text handling for multilingual expansion
- Keep touch targets >= 44px logical size
- Avoid clipped CTAs on devices with notches/home indicators

## 9.3 Accessibility
- Minimum contrast compliant with theme in both light/dark modes
- Dynamic font scaling support
- Screen reader labels for actionable controls
- State announcements for critical actions (payment success, dispute raised, KYC status update)

## 9.4 Frontend Architecture
Recommended structure:
- app/navigation
- app/screens
- app/components
- app/features/<domain>
- app/services/api
- app/store
- app/theme
- app/i18n
- app/utils

Use feature-based modules for long-term scalability.

## 9.5 Website Frontend Requirements
Website design and engineering requirements:
- Build in Next.js with a separate frontend codebase
- Reuse the same backend APIs and auth model used by the app
- Responsive behavior required for mobile web, tablet, laptop, and desktop breakpoints
- Keep design language aligned with the confirmed teal/amber system
- Maintain accessibility baseline (semantic structure, keyboard navigation, contrast)

Recommended website structure:
- web/app or web/pages
- web/components
- web/features/<domain>
- web/services/api
- web/theme
- web/i18n
- web/utils

## 10. Realtime and Messaging

## 10.1 Socket Events (Baseline)
- job:new_matching
- proposal:new
- proposal:accepted
- job:status_changed
- message:new
- notification:new
- wallet:updated

## 10.2 Message Collection (Mandatory Add)
messages schema baseline:
- _id
- job_id (nullable for support/general chats)
- conversation_id
- sender_id
- receiver_id
- body
- attachments[]
- message_type (text, image, file, system)
- read_by[]
- created_at
- updated_at
- deleted_at (soft delete)

## 11. Security Requirements

## 11.1 Core
- OWASP-aligned secure coding practices
- Helmet, CORS allowlist, rate limiting, payload limits
- Input sanitization and output encoding where needed
- Secure secret management through environment and vault

## 11.2 Authentication
- Access token short TTL
- Refresh token rotation with revocation tracking
- Device/session tracking for suspicious activity handling

## 11.3 Sensitive Data
- Encrypt KYC and payout-sensitive fields at rest
- Signed URLs for file access with strict expiry
- Never log secrets, OTP codes, or raw KYC payloads

## 11.4 Financial Controls
- Double-entry style ledger checks (logical, if not full accounting implementation yet)
- Atomic balance updates with transaction boundaries
- Reconciliation jobs for Stripe/Wise callback consistency

## 12. Performance and Optimization Requirements

## 12.1 Backend
- Redis caching for read-heavy endpoints (categories, settings, FX rates)
- Queue offloading for expensive side effects
- Query profiling and index optimization before launch
- Circuit breaker/retry policy for third-party integrations

## 12.2 Mobile
- Paginated feeds and lazy loading
- Image optimization and caching strategy
- Avoid heavy rerenders through memoized selectors/components
- Offline-tolerant UX for retryable actions where practical

## 12.3 Targets (Initial)
- p95 API latency under 400ms for core read endpoints
- p95 app screen interactive readiness under 2.5s on mid-tier device
- Crash-free sessions >= 99.5%

## 13. Observability and Operations

## 13.1 Logging
- Structured JSON logs with request_id and user_id context
- Domain event logs for money movement and status transitions

## 13.2 Monitoring
- API health, queue depth, worker failure rate, DB latency, Redis memory
- Alerting on payment webhook failures and dispute backlog growth

## 13.3 Audit
- Immutable admin action logs
- Security event timeline for account takeover patterns

## 14. Testing Strategy

## 14.1 Backend
- Unit tests for services and validation
- Integration tests for auth, jobs, proposals, wallet, disputes
- Contract tests for third-party adapters (mock + staging smoke)

## 14.2 Mobile
- Component tests for critical UI paths
- E2E flows for registration, posting, proposal acceptance, payout request, dispute

## 14.3 Release Gates
No production deployment unless:
- All critical flow tests pass
- No open high severity security findings
- Payment webhooks and idempotency checks validated

## 15. Environments and DevOps

Environments:
- local
- dev
- staging
- production

Rules:
- Separate DB and Redis per environment
- Feature flags for risky rollouts (payments, fraud actions)
- Blue/green or rolling deploy strategy for backend

## 16. Open Items to Resolve Early

- Exact platform fee defaults per region and category
- KYC provider choice for automated verification (if moving beyond manual review)
- Chargeback and refund policy edge cases
- Country-specific legal compliance for payouts and wallet holding
- Data retention policy for KYC and chat attachments

## 17. Definition of Done (Program Level)

The app is considered complete when:
- All core client/provider flows are implemented and production-tested
- Wallet/escrow/dispute flows pass reconciliation and audit checks
- KYC and fraud review operations are usable by admin team
- Realtime messaging and notifications are stable under load
- Responsive behavior validated across target device classes
- Security baseline and performance SLOs are met in staging and production

## 18. Immediate Next Action

After your review and approval of this documentation, implementation starts with Phase 0 and Phase 1 from the phase plan document:
- docs/IMPLEMENTATION_PHASES.md
