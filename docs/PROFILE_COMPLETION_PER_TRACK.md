# Do It Platform — Provider Profile Completion (Per Track)

**Scope:** Complete implementable plan for the provider profile-completion step, replacing the current generic Resume/Bio editor. Profile data is collected **based on the provider's verified job type** — `physical`, `digital`, or `errand` — because each track's hiring decision is driven by different data. Extends the existing Do It architecture (provider fields on the user document, existing verification pipeline, existing `PATCH /providers/profile`) rather than replacing it.

---

## 1. Problem with the Current Step

`ResumeBioStep` (mobile) and `PATCH /providers/profile` (backend) currently present the **same generic form to every provider**: resume upload, headline, bio, years of experience, languages. They ignore the single most important signal already known about the provider: their **verified track**.

A provider is locked to one track (`physical`, `digital`, or `errand`) — up to 3 categories within that track. The track is determinable from `categories_selected` → `SkillCategory.job_type`. The profile step must branch on it.

### Consequences of the current generic form
- Physical providers are asked for education/work-history fields they don't need and never asked for `service_radius_km`, tools, or rates — the fields clients actually hire on.
- Digital providers are never asked for portfolio links, hourly/project rates, tech stack, or timezone availability — the fields Upwork/Fiverr clients filter by.
- Errand providers are never asked for transport mode, per-km fees, payload limits, or delivery capabilities — and the already-verified `service_area` is not surfaced.
- Public profiles look identical regardless of track, so clients cannot compare providers in the way the market expects.

---

## 2. Market Benchmark

| Track | Reference platforms | What drives the client's decision | Profile fields those platforms require |
|---|---|---|---|
| Physical / trades | TaskRabbit, Urban Company, Thumbtack, Airtasker | Experience, tools carried, certifications, travel radius | Skills & Experience description, tools/equipment list, certifications, service radius, background check, on-site availability |
| Digital / knowledge | Upwork, Fiverr, LinkedIn | Portfolio, work history, rate, skills, timezone | Profile photo (required), overview/bio, ≥1 employment history, skills, hourly rate, portfolio, education, certifications, linked accounts, language + proficiency, timezone/availability |
| Errand / delivery | Lalamove, Uber Eats, DoorDash, TaskRabbit errands | Transport mode, service area, vehicle/insurance docs, handling limits | Mode of transport (foot / bike / scooter / car — determines required documents), valid licence + registration + insurance, background check, profile photo |

**Key market fact to replicate:** Upwork reports that freelancers with complete profiles are **~4.5× more likely to be hired**, and its "100% complete profile" model (required 50% + optional 50%, with a visible progress meter) is the closest analog to the per-track completeness scoring proposed here.

---

## 3. Design Principle

> **Verified data drives the profile — never re-collect it.**

Anything already proven by the verification pipeline becomes a **read-only verified badge or pre-fill**, not a re-entered field:

| Track | Verified artifact | How it surfaces in the profile |
|---|---|---|
| Physical | certificates / licenses | read-only "Verified: <certificate>" badges |
| Physical | prior-work photos | auto-populated gallery (provider may add more) |
| Digital | portfolio links + OAuth accounts | read-only verified links / connected-platform section |
| Errand | background check | verified Trust badge |
| Errand | vehicle docs | verified badge + gate on transport mode |
| Errand | service area (city + radius) | read-only service-area card |
| Errand | references | read-only references section |

The profile-completion step only collects the **presentation + matching data** a client needs to choose between providers, plus lets the provider write their own story (headline, bio, availability, pricing).

---

## 4. Universal Profile Layer (all tracks)

These fields are collected for every provider regardless of track.

| # | Field | Required | Validation | Notes |
|---|---|---|---|---|
| U1 | Profile photo | Yes | image, ≤10MB | Gates public profile (matches TaskRabbit/Upwork) |
| U2 | Headline | Yes | ≤120 chars | Placeholder is track-tailored (see §5) |
| U3 | Bio | Yes | ≤500 chars | Required for public profile |
| U4 | Languages | Yes | array of `{ code, level }`, level ∈ basic/intermediate/fluent | Upwork-style language + fluency |
| U5 | City / base location | Yes | free text | |
| U6 | Availability | Yes | `{ days[], shifts[], hours_per_week }` | at least 1 day + 1 shift |
| U7 | Public profile toggle | No | boolean | existing field; off = matchable but hidden |
| U8 | Resume file | No | PDF/DOC ≤5MB | digital track primary; others optional |

---

## 5. Track-Specific Data Matrices

### 5.1 Physical (trades, on-site) — `track_data.physical`

Client decision driver: *experience, tools, certifications, travel radius, on-site availability.*

| # | Field | Required | Validation | Source |
|---|---|---|---|---|
| P1 | years_experience | Yes | 0–100 | manual |
| P2 | service_radius_km | Yes | 1–500 | manual |
| P3 | tools_equipment | Yes | array ≤20 strings + "Other" free tag | manual |
| P4 | hourly_rate | Yes | ≥0 (platform currency) | manual — used for matching/filtering |
| P5 | on_site_availability + `can_travel` | Yes | reuse U6 days/shifts + boolean | manual |
| P6 | team_size | No | `solo` / `with_helper` / `with_team` | manual |
| P7 | insurance / liability coverage | No | boolean + optional doc URI | manual trust booster |
| P8 | has_transport (bike/car) | No | boolean + mode | manual |
| P9 | Certifications | — | — | auto from verified certs (read-only) |
| P10 | Prior-work gallery | — | — | auto from verified photos + optional add |

### 5.2 Digital (knowledge, remote) — `track_data.digital`

Client decision driver: *portfolio, work history, rate, skills, timezone, communication.*

| # | Field | Required | Validation | Source |
|---|---|---|---|---|
| D1 | Specialized skills / tags | Yes | ≤10 tags; seeded from verified skill items + free tags | auto-seed + manual |
| D2 | tech_stack / tools | Yes | ≤20 tags | manual |
| D3 | hourly_rate + project_rate | Yes | ≥0 | manual |
| D4 | timezone + availability overlap | Yes | IANA tz + U6 shifts | manual |
| D5 | english / communication proficiency | Yes | basic/intermediate/fluent | manual |
| D6 | work_history | Yes (≥1) | array: title, company, start_date, end_date?, description | manual — Upwork requires ≥1 for public profile |
| D7 | education | No | array: institution, degree, field?, start_year?, end_year? | manual |
| D8 | resume_file_url | No | PDF/DOC ≤5MB | upload → parse → prefill (Phase 2) |
| D9 | Portfolio links + connected platforms | — | — | auto from verified portfolio/OAuth (read-only) |
| D10 | certifications | — | — | auto from verified certs (read-only) |

### 5.3 Errand (delivery & errands) — `track_data.errand`

Client decision driver: *transport mode, reach, handling capability, fees, reliability.*

| # | Field | Required | Validation | Source |
|---|---|---|---|---|
| E1 | service_area (city + radius) | Yes | — | **auto from verified Trust Bundle (read-only)** |
| E2 | transport_mode | Yes | `on_foot`/`bicycle`/`motorbike`/`car`/`van` | manual, **gated**: if any selected skill has `requires_vehicle`, mode must be motorized and consistent with verified `vehicle_docs` |
| E3 | base_fee + per_km_fee | Yes | ≥0 | manual |
| E4 | working_hours + `same_day_express` | Yes | U6 shifts + boolean | manual |
| E5 | delivery_capabilities | — | confidential_documents, medicines, groceries, bulky/heavy | derived from selected errand skills |
| E6 | max_payload_kg + max package size | No | 0–1000 kg | manual |
| E7 | goods_insurance | No | boolean + optional doc URI | manual |
| E8 | References | — | — | auto from verified Trust Bundle (read-only) |
| E9 | Background check | — | — | auto verified badge (read-only) |

**Validation rule (server-side, hard):** `transport_mode` for an errand provider whose selected skills include a `requires_vehicle` skill must be motorized (`motorbike`/`car`/`van`) and must not contradict the verified vehicle documents. Rejects otherwise.

---

## 6. Data Model

Extend the provider document (user model) with a track-scoped profile block. Only the **active track's object** is stored (single-track provider).

```ts
// On the provider (user) document:
provider_profile: {
  avatar_url: string;
  headline: string;                       // ≤120
  bio: string;                            // ≤500
  languages: { code: string; level: 'basic' | 'intermediate' | 'fluent' }[];
  city: string;
  availability: { days: string[]; shifts: string[]; hours_per_week: number };
  public_profile: boolean;
}

track: 'physical' | 'digital' | 'errand'; // resolved from verified/selected track

track_data: {
  physical?: {
    years_experience: number;
    service_radius_km: number;
    tools_equipment: string[];
    hourly_rate: number;
    on_site_availability: { days: string[]; shifts: string[] };
    can_travel: boolean;
    team_size?: 'solo' | 'with_helper' | 'with_team';
    insurance?: { covered: boolean; doc_uri?: string };
    has_transport?: { yes: boolean; mode?: 'bicycle' | 'motorbike' | 'car' };
  };
  digital?: {
    skills: string[];
    tech_stack: string[];
    hourly_rate: number;
    project_rate?: number;
    timezone: string;
    english_proficiency: 'basic' | 'intermediate' | 'fluent';
    work_history: { title; company; start_date; end_date?; description? }[];
    education: { institution; degree; field?; start_year?; end_year? }[];
    resume_file_url?: string;
  };
  errand?: {
    service_area: { city: string; radius_km: number };   // mirrored from verified bundle
    transport_mode: 'on_foot' | 'bicycle' | 'motorbike' | 'car' | 'van';
    base_fee: number;
    per_km_fee: number;
    working_hours: { days: string[]; shifts: string[] };
    same_day_express: boolean;
    delivery_capabilities: string[];                     // derived from skills
    max_payload_kg?: number;
    max_package_size?: string;
    goods_insurance?: { covered: boolean; doc_uri?: string };
  };
}
```

Existing flat fields `headline`, `bio`, `years_experience`, `languages`, `work_history`, `education`, `resume_file_url`, `public_profile` are migrated into `provider_profile`/`track_data` (one-time backfill for existing providers).

---

## 7. Backend Changes

1. **Model** — add `provider_profile`, `track`, `track_data` fields to the provider (user) document. Keep backward-compatible reads.
2. **Track resolution** — helper `resolveProviderTrack(userId)`: reads `categories_selected` → `SkillCategory.job_type`. If multiple distinct job_types are found, the most recently verified category wins (defensive). Returns `'physical' | 'digital' | 'errand' | null`.
3. **Enforce single track in `selectCategories`** — today only the mobile UI blocks mixing tracks; the backend must reject a selection spanning more than one `job_type` (defensive consistency).
4. **Validation** — per-track Joi schemas (see matrices above). `PATCH /providers/profile` accepts `provider_profile` (universal) + `track_data.<track>`; it **rejects** data for a non-active track. Hard validation: errand `transport_mode` gate (§5.3), required-by-track fields, numeric bounds.
5. **`getProfile`** — returns `provider_profile`, `track`, `track_data`, plus `completeness` (0–100) and a `missing_fields` list (drives the mobile progress meter).
6. **Public profile endpoint** — `GET /providers/:id/public` renders a track-aware public profile (only the active track's sections) and respects `public_profile`.
7. **Completeness scoring** — computed server-side (§9).

---

## 8. Mobile Changes

1. **Replace `ResumeBioStep`** with a track-aware `ProfileCompletionStep`. It reads `isPhysicalCategory / isDigitalCategory / isErrandCategory` from the wizard context and renders the matching section set (§5). Universal section (photo, headline, bio, languages, availability) always shows first.
2. **Reuse the same form** from the provider **Profile tab** ("Edit Profile"), so completion is non-blocking and editable anytime (matches existing "optional, anytime" promise).
3. **Completeness meter** — Upwork-style progress ring/bar on the profile tab and the status hub, with a "Complete profile" nudge when below ~80%.
4. **Public profile viewer** — render per-track sections: errand → service area + transport mode + fees; digital → portfolio + work history + skills; physical → tools + certifications + gallery + radius.
5. **Skip behavior preserved** — profile completion stays optional/non-blocking; verified providers can browse and apply regardless of profile completeness.

---

## 9. Completeness Scoring (per track)

Mirrors Upwork's required + optional model.

| Block | Weight | Contents |
|---|---|---|
| Required (~60%) | — | photo, headline, bio, languages, city, availability + all track-mandatory fields (§5 "Required = Yes") |
| Optional (~40%) | — | portfolio/gallery, education, insurance, transport, team_size, references, resume, express toggle |

- <80% → in-app nudge only (non-blocking).
- 80–99% → "almost complete" suggestion with missing-field list.
- 100% → "Profile complete" state.

---

## 10. API Endpoints (delta vs. existing)

```
PATCH /providers/profile                     accepts provider_profile + track_data.<track>
GET  /providers/profile                      returns provider_profile, track, track_data, completeness, missing_fields
GET  /providers/:id/public                   track-aware public profile render
POST /providers/categories                   now enforces a single job_type across the selection
```

---

## 11. Phased Rollout

### MVP (Phase A)
- Track-aware `ProfileCompletionStep` for all three tracks; universal + required track fields (§5).
- Per-track validation, single-track enforcement in `selectCategories`, completeness scoring, public profile render.
- Verified artifacts surfaced as read-only badges/prefills.

### Phase 2 (post-MVP)
- Resume upload with automated parsing + pre-fill/confirm for the digital track.
- Richer profile: portfolio gallery uploads, endorsement counts, verified-badge tiers.
- Third-party background-check API re-screening reflected live on errand profiles.
- `provider_profiles` collection migration (currently provider fields live on the user document).

---

## 12. Deliverables Checklist

| Deliverable | Where covered |
|---|---|
| Problem statement / why generic form fails | §1 |
| Market benchmark (3 tracks) | §2 |
| "Verified data drives profile" principle | §3 |
| Universal profile layer | §4 |
| Per-track data matrices + validation | §5 |
| Data model | §6 |
| Backend changes + track resolution + single-track enforcement | §7 |
| Mobile UX changes | §8 |
| Completeness scoring | §9 |
| API delta | §10 |
| Phased rollout | §11 |
