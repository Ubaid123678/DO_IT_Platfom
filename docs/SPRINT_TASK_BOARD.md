# Do It Platform - Sprint Task Board

Version: 1.0
Last updated: 2026-04-06
Purpose: Actionable sprint plan for implementation across backend, mobile, website, QA, security, and DevOps.

## Team Lanes

- Product and Design
- Backend
- Mobile (React Native)
- Website (Next.js)
- QA and Automation
- Security and Compliance
- DevOps and Infrastructure

## Working Rules

- Sprint length: 2 weeks
- Done definition per ticket: code complete, tests added, reviewed, documented, deployed to dev
- No sprint closes with unresolved critical defects
- API contracts are versioned and shared before frontend consumption
- Financial and security-sensitive features require threat and failure-path tests

## Sprint 01 - Foundation Setup (Phase 0)

Sprint Goal:
- Set up project foundations for backend, mobile, and website

Backlog by lane:
- Product and Design:
  - Finalize sprint acceptance template and delivery workflow
  - Confirm source-of-truth docs and decision log format
- Backend:
  - Initialize Express modular service structure
  - Add health endpoint and base middleware stack
  - Add config loading and environment validation
- Mobile:
  - Initialize Expo app structure
  - Add navigation shell and theme token scaffolding
  - Add API client foundation and auth storage abstraction
- Website:
  - Initialize Next.js app structure
  - Configure base routing and global theme tokens
  - Add API client foundation shared contract format
- QA and Automation:
  - Configure lint and formatting checks for all codebases
  - Add initial unit test runner setup
- Security and Compliance:
  - Define secret handling policy and local development rules
  - Draft auth and financial threat model v1
- DevOps and Infrastructure:
  - Configure CI for lint, test, and build
  - Prepare dev/staging environment templates

Exit checks:
- Backend, mobile, website run locally
- CI green on default branch

## Sprint 02 - Auth Core APIs and Shared Client Integration (Phase 1)

Sprint Goal:
- Build and integrate secure authentication core

Backlog by lane:
- Product and Design:
  - Finalize auth UX copy and error-state text
- Backend:
  - Implement register, login, refresh, logout
  - Implement password hashing and token rotation
  - Add baseline rate limits for auth endpoints
- Mobile:
  - Build login and register screens with validation
  - Integrate auth APIs and token lifecycle
- Website:
  - Build login and register pages with validation
  - Integrate auth APIs and token lifecycle
- QA and Automation:
  - Add integration tests for register/login/refresh/logout
  - Add frontend smoke tests for auth navigation
- Security and Compliance:
  - Validate lockout and brute-force protections
- DevOps and Infrastructure:
  - Add auth-related environment variables in deployment templates

Exit checks:
- User can register and login from app and website
- Token refresh and logout are stable

## Sprint 03 - OTP Verification and Password Recovery (Phase 1)

Sprint Goal:
- Complete account verification and account recovery

Backlog by lane:
- Backend:
  - Implement email OTP and phone OTP verification flows
  - Implement forgot/reset password APIs
  - Add OTP retry limits and cooldown logic
- Mobile:
  - Build OTP verification screens and reset password flow
- Website:
  - Build OTP verification pages and reset password flow
- QA and Automation:
  - Add tests for OTP expiry, retry, and cooldown paths
- Security and Compliance:
  - Validate OTP abuse controls and log hygiene
- DevOps and Infrastructure:
  - Integrate SendGrid and Twilio credentials in staging

Exit checks:
- Verification and recovery complete on both frontends

## Sprint 04 - KYC Submission and Review (Phase 2)

Sprint Goal:
- Activate provider trust gating through KYC

Backlog by lane:
- Product and Design:
  - Finalize KYC state copy: pending, approved, rejected
- Backend:
  - Implement KYC submit and status endpoints
  - Implement signed URL generation for document uploads
  - Implement admin KYC review endpoints
- Mobile:
  - Build provider KYC upload and status screens
- Website:
  - Build web KYC flow and account status indicators where needed
- QA and Automation:
  - Add tests for document upload and status transitions
- Security and Compliance:
  - Validate storage access controls and retention rules
- DevOps and Infrastructure:
  - Configure storage buckets and encryption settings

Exit checks:
- Provider restrictions enforced until KYC approval

## Sprint 05 - Jobs Core APIs and Client Posting Flow (Phase 3)

Sprint Goal:
- Enable job creation and management baseline

Backlog by lane:
- Backend:
  - Implement create/list/detail/update/cancel job APIs
  - Add job status guardrails for valid transitions
  - Add geo indexes for physical jobs
- Mobile:
  - Build post-a-job flow and client jobs list/detail
- Website:
  - Build web job posting and listing where in scope
- QA and Automation:
  - Add API tests for job lifecycle open and cancel cases
- Security and Compliance:
  - Validate authorization on job ownership operations
- DevOps and Infrastructure:
  - Add seed scripts for categories and baseline reference data

Exit checks:
- Jobs can be created and viewed end-to-end

## Sprint 06 - Matching and Proposal Engine (Phase 4)

Sprint Goal:
- Deliver provider proposals and matching

Backlog by lane:
- Backend:
  - Implement submit/withdraw/accept/reject proposals
  - Implement physical and digital matching query logic
  - Trigger notifications for proposal and acceptance events
- Mobile:
  - Build browse jobs, apply proposal, and review proposals
- Website:
  - Build proposal flows where applicable
- QA and Automation:
  - Add tests for one-accepted-proposal rule
  - Add matching correctness tests
- Security and Compliance:
  - Validate anti-spam constraints on proposal submissions
- DevOps and Infrastructure:
  - Add notification queue and worker baseline

Exit checks:
- One accepted provider per job enforced consistently

## Sprint 07 - Wallet and Escrow Foundation (Phase 5.1)

Sprint Goal:
- Build ledger-safe wallet model and escrow lock path

Backlog by lane:
- Backend:
  - Implement wallet schema and service layer
  - Implement top-up initiation with Stripe payment intents
  - Implement escrow lock on accepted proposal
- Mobile:
  - Build wallet overview and top-up initiation screens
- Website:
  - Build wallet overview pages where in scope
- QA and Automation:
  - Add tests for wallet balance consistency and escrow lock
- Security and Compliance:
  - Validate idempotency requirements for money operations
- DevOps and Infrastructure:
  - Configure Stripe webhooks in staging

Exit checks:
- Escrow lock and wallet updates are consistent and traceable

## Sprint 08 - Escrow Release and Ledger Finalization (Phase 5.2)

Sprint Goal:
- Complete escrow release and immutable transaction trails

Backlog by lane:
- Backend:
  - Implement completion confirmation and escrow release
  - Implement platform fee deduction path
  - Finalize immutable transaction records and reconciliation tasks
- Mobile:
  - Build job completion confirmation flow
- Website:
  - Build completion confirmation where in scope
- QA and Automation:
  - Add failure-path tests for financial operations
- Security and Compliance:
  - Review money movement auditability
- DevOps and Infrastructure:
  - Add webhook replay handling and alerting

Exit checks:
- End-to-end top-up to escrow to release path is stable

## Sprint 09 - Payouts and FX Pipeline (Phase 6)

Sprint Goal:
- Complete provider withdrawals and currency conversion behavior

Backlog by lane:
- Backend:
  - Implement payout request flow with Wise integration
  - Add FX rate refresh jobs and cache handling
  - Normalize storage in USD and display conversion outputs
- Mobile:
  - Build payout request and transaction history screens
- Website:
  - Build payout and transaction history views where in scope
- QA and Automation:
  - Add FX consistency and payout flow tests
- Security and Compliance:
  - Validate payout authorization controls
- DevOps and Infrastructure:
  - Set payout alerts and transfer failure monitoring

Exit checks:
- Payout flow validated in staging with audit logs

## Sprint 10 - Disputes and Reviews (Phase 7)

Sprint Goal:
- Launch trust resolution flow and quality feedback loop

Backlog by lane:
- Backend:
  - Implement dispute create, evidence upload, verdict endpoints
  - Implement review create and listing endpoints
- Mobile:
  - Build raise dispute and leave review flows
- Website:
  - Build dispute and review interfaces where in scope
- QA and Automation:
  - Add tests for dispute state transitions and verdict routing
- Security and Compliance:
  - Validate evidence upload controls and access boundaries
- DevOps and Infrastructure:
  - Add dispute queue monitoring and SLA alerts

Exit checks:
- Dispute outcomes correctly route escrow funds

## Sprint 11 - Messaging and Realtime Notifications (Phase 8)

Sprint Goal:
- Deliver conversation and real-time event layer

Backlog by lane:
- Backend:
  - Add messages collection and chat APIs
  - Implement Socket.io event channels and authorization
  - Implement notifications center APIs
- Mobile:
  - Build chat and notifications screens with real-time updates
- Website:
  - Build web chat and notifications where in scope
- QA and Automation:
  - Add realtime integration tests and delivery retries tests
- Security and Compliance:
  - Validate socket auth and message access controls
- DevOps and Infrastructure:
  - Scale Redis/pub-sub settings for realtime load

Exit checks:
- Realtime chat and notifications are reliable

## Sprint 12 - Fraud Engine and Security Hardening (Phase 9)

Sprint Goal:
- Operationalize fraud detection and finalize core hardening

Backlog by lane:
- Backend:
  - Implement fraud rule evaluation jobs and fraud flag storage
  - Add admin fraud review actions
  - Harden request validation and file upload protections
- Mobile:
  - Add user-facing security state handling and warning states
- Website:
  - Add user-facing security state handling and warning states
- QA and Automation:
  - Add abuse and suspicious-flow regression tests
- Security and Compliance:
  - Execute security review and close high-risk findings
- DevOps and Infrastructure:
  - Add security alerting dashboards

Exit checks:
- Fraud flags visible and actionable by admins
- No unresolved high-severity findings

## Sprint 13 - Mobile Frontend Completion and Responsive QA (Phase 10)

Sprint Goal:
- Complete all mobile screens and responsive behavior

Backlog by lane:
- Mobile:
  - Implement and connect all remaining mobile screens
  - Validate small/standard/large/tablet layouts
  - Complete accessibility and dark theme verification
- Backend:
  - Support missing contract fields discovered during final integration
- QA and Automation:
  - Run full regression for mobile critical journeys
- Security and Compliance:
  - Validate mobile secure storage and sensitive screen behavior
- DevOps and Infrastructure:
  - Improve mobile crash and performance telemetry

Exit checks:
- Mobile app is feature-complete and QA signed

## Sprint 14 - Website Completion and Web QA (Phase 11)

Sprint Goal:
- Complete website scope and web quality gates

Backlog by lane:
- Website:
  - Finish public pages and in-scope authenticated pages
  - Responsive validation across mobile web/tablet/laptop/desktop
  - Accessibility and SEO baseline completion
- Backend:
  - Final API contract tune-up for web consumption
- QA and Automation:
  - Run web regression and performance checks
- Security and Compliance:
  - Validate web auth/session and CSRF controls where applicable
- DevOps and Infrastructure:
  - Add website performance monitoring and error tracking

Exit checks:
- Website is production-ready and QA signed

## Sprint 15 - Stabilization and Performance (Phase 12)

Sprint Goal:
- Reach launch quality for reliability and performance

Backlog by lane:
- Backend:
  - Optimize critical queries and indexes
  - Tune caches and queue retry/backoff policies
- Mobile:
  - Fix high-priority performance and crash issues
- Website:
  - Fix high-priority performance and rendering issues
- QA and Automation:
  - Execute load, soak, and reliability test suites
- Security and Compliance:
  - Run final launch security checklist
- DevOps and Infrastructure:
  - Finalize dashboards, alerts, and incident playbooks

Exit checks:
- Performance targets met in staging
- Reliability gates passed

## Sprint 16 - Launch and Hypercare (Phase 13)

Sprint Goal:
- Controlled go-live with fast issue response

Backlog by lane:
- Product and Design:
  - Final go/no-go review and launch communication
- Backend:
  - Launch support and hotfix handling
- Mobile:
  - Publish release build and monitor crashes/events
- Website:
  - Publish release and monitor web vitals/errors
- QA and Automation:
  - Run post-deploy smoke tests and rollback checks
- Security and Compliance:
  - Monitor production abuse and incident handling
- DevOps and Infrastructure:
  - Execute launch runbook and monitor system health

Exit checks:
- Production launch stable
- Hypercare metrics within thresholds

## Cross-Sprint Mandatory Outputs

Every sprint must produce:
- Updated API and architecture notes
- Test report and known-issues list
- Security review notes for changed modules
- Demo recording or walkthrough

## Quick Ownership Matrix

- Product and Design: scope clarity, acceptance criteria, UX consistency
- Backend: business logic, data integrity, integrations
- Mobile: app UX, responsiveness, integration completeness
- Website: web UX, responsiveness, SEO and accessibility baseline
- QA and Automation: regression quality and release confidence
- Security and Compliance: risk reduction and policy adherence
- DevOps and Infrastructure: stability, deployment safety, observability

## Kickoff Order

1. Execute Sprint 01 setup immediately
2. Start Sprint 02 with auth and contract-first API definitions
3. Keep mobile and website in parallel from Sprint 02 onward
4. Treat Sprints 07-12 as critical path due to finance and trust features
5. Enter launch only after Sprint 15 gates are objectively met
