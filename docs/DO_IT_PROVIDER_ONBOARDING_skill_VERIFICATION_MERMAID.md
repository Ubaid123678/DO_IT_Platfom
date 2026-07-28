# Do It Platform — Provider Onboarding & Verification System (Mermaid Version)

**Scope:** Complete implementable plan for provider signup → KYC → category/skill selection → physical/digital verification → dashboard access. Extends the existing Do It architecture (`provider_profiles`, `kyc_documents` collections; JWT auth; S3/R2 signed URLs; Bull workers) rather than replacing it.

**Note on diagrams:** This version uses Mermaid syntax — renders as real diagrams in GitHub, GitLab, Obsidian, Typora, Notion, VS Code (with the Mermaid preview extension), or mermaid.live. For a version that renders as ASCII art anywhere with zero setup, use the companion file `DO_IT_PROVIDER_ONBOARDING_VERIFICATION.md`.

---

## 1. Flow Overview

```mermaid
flowchart TB
    Signup["Sign Up (role=provider)"] --> KYC["Identity KYC\n(existing do_it module)"]
    KYC --> CatSel["Category & Skill Selection"]
    CatSel --> Verify["Skill Verification\n(physical OR digital path)"]

    Verify --> AdminQ["Admin Review Queue\n(async)"]
    CatSel -.-> Resume["Resume / Bio\n(parallel, not blocking)"]

    AdminQ --> Approved["APPROVED"]
    AdminQ --> Rejected["REJECTED"]
    AdminQ --> Pending["PENDING\n(more info needed)"]

    Approved --> Aggregator["Provider Status Aggregator\noverall_status = f(kyc_status, skill_verifications)"]
    Rejected --> Aggregator
    Pending --> Aggregator
    Resume --> Aggregator

    Aggregator --> Dashboard["Provider Dashboard\nFull access if verified\nLimited/read-only if pending/rejected"]
```

**Key principle:** identity KYC (who you are) and skill verification (what you can do, and to what trust level) are **separate pipelines that run in parallel**, not one blocking sequence. A provider can browse the app, complete their profile, and see "pending" states while both pipelines resolve — but cannot submit proposals or accept jobs in a given category until that category's skill is verified AND identity KYC is approved.

---

## 2. Screen-by-Screen Storyboard

### 2.1 Provider-Facing Screen Flow

```mermaid
flowchart TD
    S1["1. Splash / Auth Choice"] --> S2["2. Sign Up\nfull_name, email, phone, password, role, country"]
    S2 --> S3["3. Email OTP Verify"]
    S3 --> S4["4. Phone OTP Verify"]
    S4 --> S5["5. Onboarding Intro\n3-card carousel"]
    S5 --> S6["6. KYC - Document Type"]
    S6 --> S7["7. KYC - Document Capture\nfront/back image"]
    S7 --> S8["8. KYC - Selfie / Liveness"]
    S8 --> S9["9. KYC - Review & Submit\nstatus=pending"]
    S9 --> S10["10. Category Selection\nphysical/digital, 1-3 categories"]
    S10 --> S11["11. Skill Item Selection\nper category"]

    S11 -->|physical| P1["12a. Evidence Type Choice"]
    S11 -->|digital| D1["13a. Evidence Type Choice"]

    P1 -->|certificate/license| P2["12b. Upload Certificate/License"]
    P1 -->|prior work| P3["12c. Prior Work Photos"]

    D1 -->|certificate| D2["13b. Upload Certificate"]
    D1 -->|portfolio| D3["13c. Portfolio Link"]
    D1 -->|OAuth| D4["13d. Platform Integration"]

    S11 -.parallel, non-blocking.-> R1["14. Resume/Bio Editor"]
    R1 -.alt path.-> R2["15. Resume Upload -> auto-parse -> pre-fill 14"]

    P2 & P3 & D2 & D3 & D4 --> V1["16. Verification Status Hub"]
    V1 -->|rejected| V2["17. Rejection Detail / Resubmit"]
    V2 --> V1
    V1 --> DB1["18. Dashboard (Locked/Partial)"]
    DB1 -->|category fully verified| DB2["19. Dashboard (Full)"]
```

### 2.2 Field & Validation Reference Table

| # | Screen | Key Fields | Validation Rules | Decision Branches |
|---|---|---|---|---|
| 2 | Sign Up | full_name, email, phone, password, role, country | email unique/format; phone E.164; password ≥8 chars +1 digit +1 symbol; ToS required | role=provider → onboarding wizard; role=client → client home |
| 3–4 | OTP Verify (email/phone) | 6-digit OTP | numeric, expires 10 min, max 5 attempts | success → next step; 5 fails → 60s cooldown |
| 6–9 | KYC (type/capture/selfie/review) | id_type, front/back image, live selfie | image ≥600x400px, ≤10MB, blur/glare check; liveness prompts | submit → status=pending, non-blocking continue to Category Selection |
| 10 | Category Selection | job_type, 1–3 categories | ≥1 category required | physical → physical path; digital → digital path; both allowed |
| 11 | Skill Item Selection | multi-select skill_items per category | ≥1 skill_item per category | continue → per-category verification |
| 12a–12c | Physical evidence | evidence_type + type-specific fields (see §4) | ≥1 evidence type per physical category | certificate/license/photos → upload |
| 13a–13d | Digital evidence | evidence_type + type-specific fields (see §5) | ≥1 evidence type per digital category | certificate w/ URL → auto-verify attempt; else → manual review |
| 14 | Resume/Bio Editor | headline, bio (≤500 chars), years_experience, languages, work_history[], education[] | bio required for public profile | save → non-blocking, anytime |
| 15 | Resume Upload | file (PDF/DOC ≤5MB) | file type/size check | parsed → pre-fills Screen 14, user confirms |
| 16 | Verification Status Hub | status badges per category/skill | — | tap → detail w/ SLA + resubmit option |
| 17 | Rejection Detail | rejection_reason, resubmit CTA | must address reason before resubmit enabled | resubmit → new VerificationRecord, status resets |
| 18–19 | Dashboard (Locked/Full) | banner: "X of Y verifications complete" | — | ≥1 category verified → unlock browse/apply for that category |

### 2.3 Admin-Facing Screens

```mermaid
flowchart LR
    A1["A1. KYC Review Queue\nprovider, submitted_at, doc thumbnails"] -->|approve/reject| KYCdone["KYC status updated"]
    A2["A2. Skill Verification Queue\nprovider, category, skill_item, evidence, SLA countdown"] -->|approve/reject/request-info| VRdone["VerificationRecord status updated"]
    A3["A3. Provider Detail (Admin View)\nfull audit history"] -->|override, logged| VRdone
```

---

## 3. Data Model Sketches

```mermaid
erDiagram
    USERS ||--|| PROVIDER : "extends (role=provider)"
    PROVIDER ||--o{ VERIFICATION_RECORD : "has"
    PROVIDER }o--o{ SKILL_CATEGORY : "selects (categories[])"
    PROVIDER }o--o{ SKILL_ITEM : "selects (skill_items[])"
    SKILL_CATEGORY ||--o{ SKILL_ITEM : "contains"
    VERIFICATION_RECORD }o--|| SKILL_CATEGORY : "for"
    VERIFICATION_RECORD }o--|| SKILL_ITEM : "for"
    VERIFICATION_RECORD ||--o{ ADMIN_REVIEW : "audit trail"
    PROVIDER ||--o{ KYC_DOCUMENT : "via user_id (existing)"
    PROVIDER ||--o| RESUME_PARSE_RESULT : "optional"

    PROVIDER {
        ObjectId _id
        ObjectId user_id FK
        string headline
        string bio "max 500 chars"
        number years_experience
        array languages
        array work_history "embedded WorkHistoryItem"
        array education "embedded EducationItem"
        string resume_file_url
        datetime resume_parsed_at
        string overall_status "incomplete|pending|partially_verified|verified|rejected"
        boolean public_profile
    }
    SKILL_CATEGORY {
        ObjectId _id
        string name
        string job_type "physical|digital"
        string icon_url
        boolean active
    }
    SKILL_ITEM {
        ObjectId _id
        ObjectId category_id FK
        string name
        boolean requires_certificate
        boolean supports_auto_test
    }
    KYC_DOCUMENT {
        ObjectId _id
        ObjectId user_id FK
        string doc_type
        string front_url
        string back_url
        string selfie_url
        string status "pending|approved|rejected"
        string rejection_reason
    }
    VERIFICATION_RECORD {
        ObjectId _id
        ObjectId provider_id FK
        ObjectId category_id FK
        ObjectId skill_item_id FK
        string verification_track "physical|digital"
        string evidence_type
        object evidence_payload "polymorphic"
        string status "draft|pending_review|scheduled|auto_approved|approved|rejected|expired"
        object auto_check_result
        datetime sla_due_at
        ObjectId reviewed_by
        string rejection_reason
    }
    ADMIN_REVIEW {
        ObjectId _id
        ObjectId verification_record_id FK
        ObjectId admin_id FK
        string action "approved|rejected|requested_more_info|escalated"
        string notes
        datetime created_at
    }
    RESUME_PARSE_RESULT {
        ObjectId _id
        ObjectId provider_id FK
        string source_file_url
        object parsed_fields
        number confidence_score
        boolean applied
    }
```

**Status enums (canonical):**
```
KYCDocument.status:          pending | approved | rejected
VerificationRecord.status:   draft | pending_review | scheduled |
                              auto_approved | approved | rejected | expired
Provider.overall_status:     incomplete | pending | partially_verified |
                              verified | rejected
```

`Provider.overall_status` is a **derived/aggregated field**, recomputed on every KYCDocument or VerificationRecord status change:

```mermaid
flowchart TD
    Start["KYCDocument or VerificationRecord\nstatus changed"] --> Q1{"kyc.status == approved?"}
    Q1 -- No --> S1["overall_status = pending\n(or rejected if kyc rejected)"]
    Q1 -- Yes --> Q2{"Any VerificationRecord\napproved/auto_approved?"}
    Q2 -- No --> S2["overall_status = pending"]
    Q2 -- Yes --> Q3{"ALL selected categories have\nan approved VerificationRecord?"}
    Q3 -- Yes --> S3["overall_status = verified"]
    Q3 -- No --> S4["overall_status = partially_verified"]
```

---

## 4. Physical Skills Verification

**Data collected:** issuing institution/licensing body, credential ID, issue/expiry date, category + skill_item(s) covered, self-reported years of experience, service radius/regions (for regulated trades).

**Evidence submission methods:**
1. Certificate/license photo or PDF upload
2. Prior work photos (3–10, captioned, optional client reference)
3. Video demo (Phase 2)

**Verification workflow:**

```mermaid
flowchart TD
    Submit["Provider submits evidence"] --> Auto["Auto-checks:\nimage quality/tamper check,\ncredential_id format check,\nduplicate-submission check"]
    Auto --> Pass{"Pass automated checks?"}
    Pass -- No --> Flag["Flag for manual review + reason"]
    Pass -- Yes --> Queue["Enter Admin Review Queue\n(priority by category risk tier)"]
    Flag --> Queue
    Queue --> Eval["Admin evaluates:\ndocument authenticity,\ncredential matches skill_item,\nexpiry validity"]
    Eval --> Outcome{"Decision"}
    Outcome -- Approved --> R1["status=approved\ncategory unlocked"]
    Outcome -- Rejected --> R2["status=rejected\nreason required, resubmit allowed"]
    Outcome -- More Info --> R3["status stays pending_review\nprovider notified to supply X"]
```

**Criteria examples by risk tier:**

| Risk tier | Examples | Minimum evidence required |
|---|---|---|
| Low | Cleaning, moving help | 1 of: prior work photos OR self-attestation + rating history |
| Medium | Home repair, tutoring in-person | Certificate/license OR ≥3 prior work photos + reference |
| High (regulated) | Electrical, plumbing (legally licensed trades) | Valid license/certificate mandatory |

**SLA:** target 48 hours for document-based review (configurable per category).

---

## 5. Digital Skills Verification

**Evidence types:** certificates (with optional `credential_url`), portfolio links, OAuth platform integrations (GitHub, Upwork, LinkedIn), skill endorsements (Phase 2).

**Automated checks:** domain/URL reachability, credential-URL auto-verify against issuer's public verify page, OAuth token validity as ownership proof, duplicate/fraud heuristics on portfolio URLs.

**Automation decision logic:**

```mermaid
flowchart TD
    Submit["Provider submits evidence"] --> Type{"evidence_type"}

    Type -- certificate --> T2{"credential_url
    auto-verify succeeds?"}
    T2 -- Yes --> Auto2["auto_approved"]
    T2 -- No --> Manual2["pending_review"]

    Type -- platform_integration --> T3{"activity signals meet
    category minimum?
    (e.g. >=5 public repos,
    recent commits)"}
    T3 -- Yes --> Auto3["auto_approved"]
    T3 -- No --> Manual3["pending_review"]

    Type -- portfolio_link --> Manual4["pending_review
    (always manual)"]
```

**Verification workflow:**

```mermaid
flowchart TD
    Submit["Provider submits evidence"] --> Rules["Run automation rules"]
    Rules --> Decision{"Auto-approved?"}
    Decision -- Yes --> Instant["auto_approved\ninstant category unlock"]
    Decision -- No --> Queue["Admin Review Queue\nchecks portfolio quality,\nrelevance to skill_item, red flags"]
    Queue --> Out{"Decision"}
    Out -- Approved --> R1["status=approved"]
    Out -- Rejected --> R2["status=rejected"]
    Out -- More Info --> R3["stays pending_review"]
```

**SLA:** auto-approved paths are instant; manual review target 24–48 hours.

---

## 6. Resume / Bio Capture

```mermaid
flowchart LR
    Path1["In-App Structured Editor\nheadline, bio, years_experience,\nlanguages, work_history[], education[]"] --> Store["Provider document fields\n(MongoDB, canonical source of truth)"]
    Path2["File Upload\nPDF/DOC <=5MB"] --> Parse["Resume-parsing worker\n(Bull job)"]
    Parse --> PreFill["Pre-fills structured editor\n(ResumeParseResult stored separately)"]
    PreFill -->|user reviews & confirms| Store
    Store --> Public["Public Profile Display:\nheadline+bio+years prominent,\nwork history reverse-chron,\nverified-skill badges\n(visually distinct from unverified)"]
```

**Storage notes:**
- Structured fields → `Provider` document fields directly.
- Raw uploaded resume file → S3/R2, signed URL in `Provider.resume_file_url`; original retained for re-parsing/audit, not directly public.
- `ResumeParseResult` keeps raw parser output + confidence score separately — parsing never auto-publishes without a user confirm step.
- `public_profile` toggle lets a provider opt out of public visibility while remaining matchable for jobs.

---

## 7. UI/UX Considerations

- **Accessibility:** labeled inputs (not placeholder-only), screen-reader status announcements, ≥44px touch targets, color paired with icon+text for status badges, dynamic font scaling, text instructions alongside camera screens.
- **Progressive disclosure:** one decision at a time in the wizard (category → skill_items → evidence type → upload form); optional fields (credential_id, expiry_date) collapsed by default; resume upload offers parsing but never hides the manual editor.
- **Validation feedback:** inline real-time validation on blur, server errors mapped to specific fields, upload progress + specific failure reasons (not generic errors).
- **Mobile responsiveness:** camera-first capture screens with gallery fallback only where liveness/tamper-resistance isn't required (never for KYC selfie); long forms use list-based add/remove item patterns, consistent with existing Do It mobile conventions.
- **Role-based views:** provider app never surfaces internal admin fields (reviewer identity, risk-tier scoring) — only status + reason + next action. Admin portal (web, aligned with the deferred Phase 11 website/admin build) gets review queues, SLA countdowns, bulk actions, audit trail, logged overrides. Until then, MVP admin review runs through protected `/api/v1/admin/*` endpoints via a lightweight internal tool.

---

## 8. Tech Stack, API Endpoints & Phased Rollout

**Stack (consistent with existing Do It architecture — no new core technology introduced):**

| Concern | Technology |
|---|---|
| Mobile UI | React Native (Expo), TypeScript, existing theme system |
| Backend | Node.js + Express, new `verification` module alongside existing `kyc` module |
| Database | MongoDB Atlas — new `verification_records`, `admin_reviews`, `resume_parse_results` collections |
| File storage | S3/Cloudflare R2, signed URLs (reuse existing KYC document pipeline pattern) |
| Async processing | Bull/Redis — new queues: `verification-auto-check`, `resume-parse`, `credential-url-verify` |
| OAuth integrations | GitHub OAuth (Phase 2), Upwork/LinkedIn (Phase 2, if APIs permit) |
| Resume parsing | Third-party parsing API (e.g. Affinda, Sovren) called from a Bull worker — vendor spike in Phase 2 |

| Notifications | Existing FCM/SendGrid/Twilio pipeline — new event types for verification status changes |

**API endpoints (new, under `/api/v1`):**
```
POST   /providers/categories                          select categories + skill_items
GET    /providers/categories                           list current selections

POST   /providers/verification-records                  submit new evidence (any track/type)
GET    /providers/verification-records                   list own records + statuses
GET    /providers/verification-records/:id                detail + status + reason
POST   /providers/verification-records/:id/resubmit       resubmit after rejection

POST   /providers/resume/upload                          upload resume file -> triggers parse job
GET    /providers/resume/parse-result/:id                  fetch parsed fields for review
PATCH  /providers/profile                                 update bio/headline/work_history/education

POST   /providers/oauth/github/connect                     initiate OAuth
GET    /providers/oauth/github/callback                      handle callback, pull signals

--- Admin (role + IP-whitelist + MFA hardened, per existing security model) ---
GET    /admin/verification-records?status=pending_review&category=&sla_overdue=
POST   /admin/verification-records/:id/approve
POST   /admin/verification-records/:id/reject           { reason }
POST   /admin/verification-records/:id/request-info      { message }
GET    /admin/verification-records/:id/audit-trail
```

**Example end-to-end data flow (digital, certificate with auto-verify):**

```mermaid
sequenceDiagram
    participant P as Provider (Mobile)
    participant API as Backend API
    participant Q as Bull Worker
    participant Ext as Issuer's Verify Page

    P->>API: POST /providers/verification-records\n{category_id, skill_item_id, evidence_type:"certificate",\nevidence_payload:{issuing_body, credential_id, credential_url}}
    API->>API: Create VerificationRecord (status=pending_review)
    API->>Q: enqueue "credential-url-verify" job
    API-->>P: 202 Accepted + record id
    Q->>Ext: fetch credential_url
    Ext-->>Q: page content
    Q->>Q: match name + credential_id
    alt match found
        Q->>API: update record: status=auto_approved, auto_check_result={...}
    else no match / unreachable
        Q->>API: status stays pending_review, flagged for admin
    end
    API-->>P: socket event "verification:updated"
    API->>API: recompute Provider.overall_status
    Note over P,API: If category now verified,\nprovider can browse/apply in that category
```

**Phased rollout:**

### MVP (Phase A — ships alongside/after existing Phase 2 "KYC & Provider Activation" in the master roadmap)
- Signup → identity KYC (existing pipeline, unchanged)
- Category + skill_item selection (up to 3 categories)
- Physical track: certificate/license + prior-work-photo upload only (manual admin review)
- Digital track: certificate + portfolio link only (manual admin review, no auto-verify/OAuth yet)
- Structured bio/resume editor (manual entry or plain file upload, no auto-fill yet)
- Admin review via lightweight internal tool consuming `/admin/verification-records`
- Provider dashboard with locked/partial/full states
- Basic status notifications (in-app + push)

### Phase 2 (post-MVP enhancement)
- Automated credential-URL verification
- OAuth platform integrations (GitHub first)
- Resume file upload with automated parsing + pre-fill/confirm flow
- Skill endorsements from completed jobs
- Richer public profile (portfolio gallery, endorsement counts, verified-badge tiers)
- Dedicated admin web portal (aligns with master roadmap's deferred Phase 11), replacing the MVP's lightweight internal tool

---

## 9. Summary Table — Deliverables Checklist

| Deliverable | Where covered |
|---|---|
| Flow overview diagram | §1 |
| Screen-by-screen storyboard (provider) | §2.1, §2.2 |
| Screen-by-screen storyboard (admin) | §2.3 |
| Data models (Provider, VerificationRecord, AdminReview, etc.) | §3 |
| Physical verification: data, evidence, workflow | §4 |
| Digital verification: evidence, automation, workflow | §5 |
| Resume/Bio capture and storage | §6 |
| UI/UX: accessibility, progressive disclosure, validation, responsiveness, role-based views | §7 |
| Tech stack | §8 |
| API endpoints | §8 |
| Status enums | §3 |
| Example data flow | §8 |
| Phased rollout (MVP vs Phase 2) | §8 |
