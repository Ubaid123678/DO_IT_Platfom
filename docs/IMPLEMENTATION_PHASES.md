# Do It Platform - Implementation Phases

Version: 1.1
Last updated: 2026-04-10
Purpose: Delivery roadmap to build the complete mobile app and shared backend first, then finalize website and admin portal in the final stage.

## Delivery Model

- Approach: Vertical slices with strong platform foundations
- Cadence: 2-week sprints (adjustable)
- Environments: local -> dev -> staging -> production
- Launch strategy: staged rollout by region
- Execution mode update (2026-04-10): website/admin implementation is deferred until mobile app completion milestone.

## Phase 0 - Program Setup and Architecture Baseline

Duration: 1 sprint

Goals:
- Initialize repositories/workspace structure for mobile app, backend, and deferred website track
- Define coding standards, branching model, PR templates, and CI baseline
- Set up environment configuration and secret management pattern

Deliverables:
- Monorepo or coordinated repos decided and initialized
- Backend service bootstrap (Express modular structure)
- Mobile app bootstrap (Expo + navigation + theme tokens)
- Website bootstrap only (scaffold reserved for final-stage implementation)
- CI pipeline for lint/test/build
- Environment templates (.env.example) for all services

Exit Criteria:
- Fresh clone can run backend and app locally; website scaffold is optional in active delivery
- CI passes on default branch

## Phase 1 - Identity, Auth, and Account Foundation

Duration: 1 sprint

Goals:
- Build secure authentication and user profile foundation
- Implement role handling (client/provider/admin)

Deliverables:
- Register, login, refresh, logout
- Email OTP verification flow
- Phone OTP verification flow
- Password reset flow
- Basic profile read/update endpoints
- Session and token revocation support

Exit Criteria:
- End-to-end onboarding works for both client and provider
- Auth abuse protection baseline active (rate limits, lockouts, audit logs)

## Phase 2 - KYC and Provider Activation

Duration: 1 sprint

Goals:
- Enforce provider trust gating through KYC

Deliverables:
- KYC document upload pipeline (S3/R2 signed URLs)
- KYC status tracking in app
- Admin KYC review endpoints (approve/reject + reason)
- Provider profile setup (skills, categories, radius, availability)

Exit Criteria:
- Non-approved providers blocked from restricted actions
- KYC review process operational for admin users

## Phase 3 - Jobs Core (Create, Browse, Manage)

Duration: 1 sprint

Goals:
- Implement job lifecycle core up to open state management

Deliverables:
- Client post job flow (physical/digital)
- Provider browse feed with filters
- Client job list and detail endpoints
- Geo indexing and query support
- Status transition validations for open/cancel rules

Exit Criteria:
- Jobs can be created, discovered, and managed reliably
- Location and category filtering validated

## Phase 4 - Proposals and Matching Engine

Duration: 1 sprint

Goals:
- Enable provider applications and client selection flow

Deliverables:
- Submit/withdraw proposal
- Client proposal review and accept/reject actions
- Auto-reject other proposals when one is accepted
- Matching algorithm execution for physical and digital jobs
- Notification trigger integration for proposal/job events

Exit Criteria:
- One accepted provider per job rule enforced
- Matching and proposal workflow stable under load tests

## Phase 5 - Wallet, Escrow, and Ledger (Critical)

Duration: 2 sprints

Goals:
- Implement trusted financial core

Deliverables:
- Wallet model and balance operations
- Stripe top-up initiation + webhook reconciliation
- Escrow lock on proposal acceptance
- Escrow release on completion confirmation
- Platform fee deduction logic
- Immutable transaction ledger records

Exit Criteria:
- Money movement paths fully tested (happy + failure paths)
- Idempotency and reconciliation checks passing

## Phase 6 - Payouts, FX, and Multi-Currency

Duration: 1 sprint

Goals:
- Complete provider earnings withdrawal experience

Deliverables:
- Provider payout request flow
- Wise transfer integration
- FX rate cache refresh jobs
- Display currency conversion pipeline
- Earnings and wallet transaction screens complete

Exit Criteria:
- End-to-end payout path validated in staging
- FX display and stored USD consistency checks pass

## Phase 7 - Disputes, Reviews, and Resolution

Duration: 1 sprint

Goals:
- Protect transaction trust and quality signals

Deliverables:
- Dispute creation flow with evidence upload windows
- Admin dispute verdict endpoints and audit logs
- Escrow outcome routing by verdict
- Review submission after completion
- Review moderation support hooks

Exit Criteria:
- Full disputed-job state machine operational
- Auditability confirmed for every dispute outcome

## Phase 8 - Messaging, Notifications, and Realtime

Duration: 1 sprint

Goals:
- Deliver responsive communication and event visibility

Deliverables:
- messages collection and chat APIs
- Socket.io realtime updates for chat and job events
- FCM push events for critical triggers
- In-app notifications center and read state management
- Email/SMS templates and event wiring for key flows

Exit Criteria:
- Real-time chat and notifications functional on both roles
- Notification delivery and retry paths monitored

## Phase 9 - Fraud Detection and Security Hardening

Duration: 1 sprint

Goals:
- Raise trust and resilience before scale

Deliverables:
- Bull-based fraud rules engine (initial rule set)
- fraud_flags creation and admin review actions
- Security hardening pass (auth, input validation, logging hygiene, SSRF/file upload checks)
- Abuse controls for OTP, payment attempts, and suspicious sessions

Exit Criteria:
- Fraud alerts visible and actionable
- Security checklist completed with no unresolved high-risk gaps

## Phase 10 - Frontend Completion and Responsive QA

Duration: 1-2 sprints

Goals:
- Complete all 51 mobile screens and ensure responsive quality

Deliverables:
- All screens implemented with confirmed light/dark theme tokens
- Cross-device responsive validation (small phone, standard phone, phablet, tablet)
- Accessibility pass (font scaling, contrast, semantics)
- UX polish for loading/empty/error/success states

Exit Criteria:
- Full screen inventory complete and connected to live APIs
- QA sign-off for responsiveness and interaction quality

## Phase 11 - Website and Admin Portal Finalization (Deferred Until App Complete)

Duration: 1-2 sprints

Goals:
- Build and finalize public website and private admin portal after app completion

Deliverables:
- Public website pages implemented (home, how it works, categories, trust and safety, help, legal)
- Private admin portal pages implemented for admin workflows
- Admin UI connected to existing backend admin endpoints
- Responsive QA across mobile web, tablet, laptop, and desktop
- Performance and SEO baseline setup for public pages

Exit Criteria:
- Website pages and private admin portal are production-ready and content complete
- Responsive and accessibility QA sign-off achieved

## Phase 12 - Performance, Reliability, and Pre-Launch Stabilization

Duration: 1 sprint

Goals:
- Ensure scale-readiness and operational confidence

Deliverables:
- DB query and index optimization pass
- Cache strategy tuning for high-traffic endpoints
- Queue backpressure and retry policy tuning
- Load test and soak test execution
- Crash and error monitoring thresholds in place

Exit Criteria:
- Target p95 API and app performance metrics met in staging
- Website/admin performance baseline met in staging
- Stability metrics pass release threshold

## Phase 13 - Production Launch and Post-Launch Operations

Duration: 1 sprint + monitoring window

Goals:
- Controlled production rollout and rapid feedback loops

Deliverables:
- Production deployment runbook
- Incident response and rollback procedures
- Feature flags for phased regional enablement
- Post-launch dashboards and daily health review routine

Exit Criteria:
- Successful initial rollout with no critical unresolved incidents
- Post-launch hotfix pipeline validated

## Cross-Phase Workstreams (Run Continuously)

## A) QA and Test Automation
- Build and maintain unit/integration/E2E suites from Phase 1 onward
- Block merges for critical flow regressions

## B) Documentation
- Keep API specs, architecture docs, and runbooks updated each sprint
- Capture major decisions as ADRs

## C) Security and Compliance
- Threat modeling updates at major feature milestones
- Dependency and secret scanning in CI

## D) Analytics and Product Insight
- Event tracking instrumentation for core conversion funnel
- Track onboarding completion, job success rate, dispute frequency

## Recommended Team Sequencing

- Backend team starts Phases 0-3 quickly with mobile consuming mocks where needed
- Website/admin implementation starts after app core completion (Phase 11)
- Payments/disputes/fraud are treated as critical-path features
- Mobile frontend progresses continuously by module while backend contracts stabilize
- Final pre-launch requires full-stack hardening together including deferred website/admin stage

## Milestone View (High Level)

- Milestone M1: Auth + KYC + Job Core (Phases 0-3)
- Milestone M2: Matching + Escrow + Payout (Phases 4-6)
- Milestone M3: Disputes + Realtime + Fraud (Phases 7-9)
- Milestone M4: Mobile completion + Website/Admin finalization + Stabilization + Launch (Phases 10-13)

## Dependency and Risk Notes

Top dependencies:
- Stripe and Wise account readiness
- FCM, Twilio, SendGrid production credentials
- MaxMind license and legal region checks
- Cloud storage compliance for KYC data

Top risks:
- Payment reconciliation complexity
- KYC operational bottlenecks
- Realtime scaling and notification reliability
- Geolocation quality and edge-case matching logic
- Contract drift when deferred website/admin implementation begins late

Mitigations:
- Early staging integrations
- Idempotent financial operations and replay-safe webhooks
- Queue-based retries with dead-letter handling
- Admin override tools with audit logs
- Shared API schema checks in CI for app and website

## Phase Completion Checklist Template

Use this checklist at the end of every phase:
- Scope items implemented
- Test coverage updated
- Security review completed
- Documentation updated
- Demo accepted by stakeholders
- Rollback plan validated

## Next Step After Approval

Begin implementation with:
- Phase 0 task board creation
- Sprint breakdown for Phase 0 + Phase 1
- Repository scaffolding and CI bootstrap

Detailed sprint execution board:
- docs/SPRINT_TASK_BOARD.md
