# Do It Platform — Stitch Screen Prompts (Public Website)

Built from `DO_IT_PUBLIC_WEBSITE_DOCUMENTATION.md` — every prompt below uses only the pages, data fields, copy points, and color tokens defined in that doc (§1, §2, §3, §6, §9). Paste each one into Stitch as its own screen generation. Run the **Global Style Prompt** first (or paste its style block into your Stitch project's theme/description field) so every screen after it stays visually consistent.

---

## 0. Global Style Prompt (run first / use as project style guide)

```
Design system for "Do It" — a service marketplace connecting clients with verified physical-trade and digital-skill providers. Web platform (Next.js), desktop-first with mobile-responsive breakpoints.

BRAND FEEL: Trustworthy, warm, professional service marketplace — think Upwork/TaskRabbit hybrid, verification-forward, not flashy or "startup neon." Editorial and calm, not busy.

COLOR TOKENS (use exactly — never introduce blue anywhere in the UI):
- Primary teal: #1A9E8F (CTAs, links, active nav, icon accents)
- Primary dark: #0D7A6E (hover/pressed states)
- Primary mid: #7ABFB8 (secondary accents, borders on teal surfaces)
- Primary light: #E0F4F2 (light section backgrounds, badge fills)
- Amber: #F5A623 (ratings/stars, highlight badges, secondary CTA) — decorative use only
- Amber dark: #C97F0F (amber used as readable text, AA-compliant)
- Amber light: #FEF3DC (callout/testimonial backgrounds)
- Success green: #27AE60 (verified badges, success states)
- Error red: #E74C3C (form errors, disputed-state badges)
- Warning orange: #F39C12 (pending/warning badges)
- Ink (headings): #0F1F1E — near-black, teal-tinted
- Slate (body copy): #4A5B59 — teal-tinted gray
- Mist (page background): #F7FAF9
- Paper (card/surface background): #FFFFFF
- Hairline (dividers/borders): #E3EEEC
- Hero gradient: from #0D7A6E (top-left) to #1A9E8F (bottom-right)
- Overlay on hero images: rgba(13,31,30,0.6), teal-tinted not black

TYPOGRAPHY:
- Hero headline (desktop): 48px, weight 800
- Hero headline (mobile): 32px, weight 800
- Clean sans-serif throughout (Inter-style), generous line height on body copy
- Body copy in slate (#4A5B59), never pure black

COMPONENT STYLE:
- Rounded corners (12–16px) on cards, buttons, badges
- Soft shadows, no heavy drop shadows
- Verified badge: small teal or success-green pill with checkmark icon, never a raw status label
- Rating display: amber stars + numeric rating + review count
- Primary buttons: solid teal #1A9E8F, white text, rounded, hover to #0D7A6E
- Secondary buttons: amber #F5A623 fill or teal outline, depending on context
- Generous whitespace, editorial magazine-like spacing for marketing/blog sections
- Sticky header with logo left, nav center, "Download App" + language switcher right
- Footer: dark teal background (#0D1F1E), multi-column links, store badges, legal links, social icons — light text (#E8F8F6)

DARK MODE: background #0D1F1E, card #152E2C, card border #1F4A47, primary text #E8F8F6 — same teal/amber accents carried through.

ACCESSIBILITY: WCAG-aligned contrast, visible focus states, alt text placeholders on all imagery, keyboard-navigable nav and forms.
```

---

## 1. Home (`/`)

```
Design the homepage for "Do It," a service marketplace website. Desktop-first, responsive.

STICKY HEADER: Logo left ("Do It"), center nav — How It Works, Categories, Pricing, Trust & Safety, Blog, Help — right side: language switcher icon, "Log In" text link, "Download App" solid teal button.

HERO SECTION: Full-width, teal gradient background (#0D7A6E → #1A9E8F) with a subtle dark overlay over a background photo of a tradesperson/freelancer at work. Large headline (48px/800, white): something like "Get it done — by a verified pro." Subheading in lighter teal-white. Two CTA buttons side by side: "Post a Job" (white/amber solid) and "Become a Provider" (outlined white). Below the CTAs, a horizontal stat bar on a semi-transparent white card showing 4 stats pulled live: Total Providers, Jobs Completed, Countries Active, Average Rating (amber stars).

VALUE PROPS SECTION: Mist background (#F7FAF9). Three-column icon + heading + short text block: "Verified Providers" (KYC + skill verification), "Escrow Protection" (funds held safely until confirmed), "Rated & Reviewed" (real reviews only).

FEATURED CATEGORIES SECTION: Heading "Browse Categories." A responsive grid of category cards (4 per row desktop, 2 per row mobile) — each card: icon, category name, "X verified providers" subtext, on a white card with hairline border, hover lifts with teal border glow.

HOW IT WORKS SUMMARY: Two-tab toggle at top ("For Clients" / "For Providers"), below it 3–4 numbered step cards in a horizontal row (numbered circle in teal, short title, one-line description), ending with a "See full journey" link to the How It Works page.

TESTIMONIALS SECTION: Amber-light (#FEF3DC) background band. Horizontal scroll/carousel of testimonial cards — quote text, first-name only + role (e.g. "Amina, Client"), amber star rating. No photos unless consented.

APP DOWNLOAD CTA: Teal card band near footer — "Take Do It with you" headline, App Store + Google Play badge buttons, QR code graphic on the right.

FOOTER: Dark teal (#0D1F1E) background, four columns (Company/About, For Clients, For Providers, Legal), store badges, social icons, language switcher, copyright line — light mint text (#E8F8F6).
```

---

## 2. How It Works (`/how-it-works`)

```
Design the "How It Works" page for Do It. Header/footer per global style.

PAGE HEADER: Centered title "How Do It Works," subtitle "Two simple journeys — pick the one that's you." Below it a prominent segmented toggle/tab control, two options: "For Clients" and "For Providers," teal active state, pill-shaped.

CLIENT JOURNEY VIEW (default active tab): A vertical timeline layout, 9 numbered steps, alternating left/right on desktop (stacked on mobile), each step a card with a numbered teal circle, bold step title, and 1–2 line description:
1. Sign up — verify email + phone
2. Post a job — category, description, physical (location + radius) or digital (remote), budget (fixed/hourly), deadline, up to 5 attachments
3. Get matched — automatic notifications to nearby/skill-matched verified providers, or browse manually
4. Review proposals — bid, estimated time, rating, cover message; accept exactly one
5. Escrow funds the job — wallet funds locked automatically, provider paid only after confirmation
6. Track progress & chat — in-app messaging with accepted provider
7. Confirm completion — review and confirm, funds release minus platform fee
8. Leave a review — rate the provider
9. Dispute (if needed) — evidence window, admin review, fair verdict

PROVIDER JOURNEY VIEW (second tab): Same timeline style, 11 steps covering: sign up, KYC identity verification (~48hrs), choose up to 3 categories + skills, verify skills (certificate/portfolio/test — some auto-verify, some ~24-48hr admin review), build profile (bio, experience, portfolio, availability, resume auto-fill), get matched to jobs, submit proposal (max 10 active at a time), get accepted & work, mark job complete, get paid out (local currency, bank/mobile wallet), build reputation over time.

CALLOUT BOX (provider view only): Amber-light background card with warning-icon, bold text: "A provider only appears in search and matching for a category once both identity verification AND that category's skill verification are approved." Styled as an important-notice banner, not buried in the timeline.

BOTTOM CTA: Teal band, "Ready to get started?" with two buttons — "Post a Job" and "Apply as a Provider."
```

---

## 3. Categories (`/categories`)

```
Design the all-categories browse page for Do It.

PAGE HEADER: Title "Explore Categories," subtitle "From home repairs to web development — find a verified pro for any job." Search bar below (icon + placeholder "Search categories...").

FILTER BAR: Optional pill toggles — "All," "Physical Trades," "Digital Skills."

CATEGORY GRID: Responsive grid (4 columns desktop, 2 tablet, 1 mobile) of category cards on white/paper background with hairline borders. Each card: category icon in a teal-light circle, category name (bold, ink color), subcategory count as small subtext, hover state lifts card with teal border. No pricing or provider count needed here (that's category detail) — keep this page a clean visual index.

SIDE NOTE SECTION at bottom: "Don't see your category? Contact us" link to help/contact.
```

---

## 4. Category Detail (`/categories/[slug]`)

```
Design a single category landing page for Do It (example: "Plumbing" or "Web Development" — use a generic physical-trade example).

BREADCRUMB: Home / Categories / [Category Name]

HERO BAND: Teal-light background (#E0F4F2). Category icon large on left, on right: category name as H1, short description paragraph, and a trust-signal stat row: "X Verified Providers," "★ Avg Rating," "Starting from $X" — three stat chips inline.

CTA ROW: "Post a Job in this Category" (primary teal button) and "Browse All Providers" (outline button).

SAMPLE PROVIDERS SECTION: Heading "Top Providers in [Category]." Grid of up to 6 provider cards (3 per row desktop) — each card: circular profile photo, name, verified badge (teal checkmark pill), star rating + review count, one-line headline/bio snippet, "View Profile" link. Cards are white with hairline border and soft shadow on hover.

SUBCATEGORY CHIPS SECTION (optional): row of pill-shaped subcategory tags below the intro.

BOTTOM CTA: "Can't find the right provider? Post a job and get matched automatically" — teal card band with button.
```

---

## 5. Public Provider Profile (`/providers/[username]`)

```
Design a public provider profile page for Do It. This page must ONLY show: full name, profile photo, headline, bio, verified categories/skills, rating, review count, portfolio (if public_profile enabled), a single "Identity Verified" badge, and city/region-level location. It must NEVER show phone, email, exact GPS, wallet, dispute history, or raw KYC status — do not design fields for any of these.

PROFILE HEADER BAND: Mist background. Large circular profile photo on left. Right side: full name (H1, bold), headline text below name, a row of badges — teal "Identity Verified" pill with checkmark icon, plus small verified-category badges. Star rating + numeric average + "(X reviews)" text. City/region only (e.g. "Lahore, Pakistan") with a small pin icon — no exact address. A "Contact via App" button (teal, disabled-looking or linking to app download, since direct contact only happens after in-app job engagement).

ABOUT SECTION: "About" heading, bio paragraph in slate text.

SKILLS & CATEGORIES SECTION: Row of pill badges for each verified category/skill — small teal checkmark icon per pill to reinforce "verified," never showing unverified skills.

PORTFOLIO SECTION (only if public_profile = true): Masonry or grid gallery of portfolio images/work samples with optional captions.

REVIEWS SECTION: Heading "Reviews (X)." List of review cards — reviewer first name only, star rating, review text, relative date. Only visible/non-flagged reviews — no moderation UI on this public page.

SIDEBAR (desktop, sticky): Small card repeating rating summary, verified badge, and a "Download the app to hire" CTA.

Do not include any admin, KYC document, or internal-status elements anywhere on this page.
```

---

## 6. Pricing (`/pricing`)

```
Design the Pricing page for Do It — explains fees and escrow, not a checkout flow.

PAGE HEADER: Title "Simple, transparent pricing," subtitle about no hidden fees.

FEE EXPLAINER SECTION: Two-column comparison layout — "For Clients" card and "For Providers" card, side by side, each on white card with teal-light header band. Each lists: platform fee range/percentage, what it covers, any payment processing note. Use placeholder ranges (e.g. "5–15% platform fee") styled as editable stat text, not hardcoded numbers.

HOW ESCROW WORKS SECTION: Horizontal 3-step visual (icons + short text): "1. Funds are locked when a proposal is accepted" → "2. Provider completes the work" → "3. Funds release once you confirm." Connected by a dotted line/arrow between steps.

CURRENCY CONVERSION EXPLAINER: Simple card explaining local currency payout at withdrawal, teal info-icon callout.

FAQ MINI-SECTION: 3–4 accordion items answering common pricing questions, linking to full Help Center FAQ.

BOTTOM CTA: "Questions about fees? Contact Support" button.
```

---

## 7. Trust & Safety (`/trust-and-safety`)

```
Design the Trust & Safety explainer page for Do It. Plain-language, reassuring, no technical/internal detail.

PAGE HEADER: Trust-forward hero — teal gradient band, shield/checkmark iconography, headline "Your safety is built into every job."

FIVE-PILLAR GRID SECTION: Five cards (icon + title + 2-3 sentence plain-language explanation) for:
1. Identity Verification (KYC) — ID + selfie reviewed by a trained team
2. Skill Verification — certificates, portfolios, tests, admin review
3. Escrow Protection — payment held safely until work is confirmed complete
4. Dispute Resolution — evidence window, admin review, fair verdict
5. Fraud Protection — automated monitoring described only at a high level ("we continuously monitor for suspicious activity to keep the marketplace safe" — no specifics)

Cards arranged in a responsive grid (3+2 or 5-across on wide desktop), each on a white card with teal icon circle at top.

TRUST BADGE LEGEND: A small horizontal strip showing what each badge means visually (e.g. "Identity Verified" badge sample, star rating sample) so visitors recognize them elsewhere on the site.

BOTTOM CTA: "Report a Safety Issue" outline button + "Learn more in Help Center" link.
```

---

## 8. Blog Listing (`/blog`)

```
Design the Blog listing page for Do It. Editorial, magazine-style layout.

PAGE HEADER: Title "Do It Blog," subtitle "Tips, platform updates, and category spotlights."

FEATURED ARTICLE: Large hero card at top — cover image left/full-width, title overlay or beside image, excerpt text, author name, published date, category tag pill.

FILTER/TAG BAR: Horizontal scrollable pill row of categories/tags to filter articles.

ARTICLE GRID: 3-column responsive grid of article cards below the featured one — cover image (16:9), category tag pill (amber or teal depending on category), title (bold, ink), excerpt (2 lines, slate), author + date footer row. White cards, hairline border, hover lift.

PAGINATION: Simple numbered pagination or "Load More" button at bottom, teal accent.
```

---

## 9. Blog Single Article (`/blog/[slug]`)

```
Design a single blog article page for Do It.

BREADCRUMB: Home / Blog / [Article Title]

ARTICLE HEADER: Category tag pill, large H1 title (ink color), author name + avatar + published date row, full-width cover image below.

ARTICLE BODY: Single-column, comfortable reading width (max ~680px centered), generous line height, slate body text, styled H2/H3 subheadings in ink, blockquote style with teal left border, inline images with captions.

SHARE ROW: Small social share icons (teal outline) below the header or floating on the left margin (desktop only).

RELATED ARTICLES SECTION: "You might also like" — 3-card row at the bottom, same card style as blog listing grid.

BOTTOM CTA BAND: Teal card — "Ready to get started with Do It?" with Post a Job / Download App buttons.
```

---

## 10. About (`/about`)

```
Design the About page for Do It — company story and mission, editorial tone.

HERO SECTION: Full-width image or teal gradient band, headline "Connecting people who need it done with people who can do it."

MISSION SECTION: Centered narrow-column text block — mission statement, 2-3 paragraphs, generous whitespace.

VALUES SECTION: 3-4 column grid — icon + short value title + one-sentence description (e.g. "Trust First," "Fair for Everyone," "Verified, Always").

STATS BAND: Teal-light background, horizontal stat row reusing the same stat style as the homepage hero (providers, jobs completed, countries).

TEAM/STORY SECTION (optional): Simple text block or timeline of company milestones, minimal styling, no fabricated team photos.

CLOSING CTA: "Join the Do It community" band with Post a Job / Become a Provider buttons.
```

---

## 11. Help Center Home (`/help`)

```
Design the Help Center home page for Do It.

PAGE HEADER: Centered, large search bar as the focal point — "How can we help?" placeholder, teal search icon/button.

QUICK LINK CARDS: Grid of 4 cards below search — "Browse FAQ," "Contact Us," "Report a Safety Issue," "Download the App for full support" — each with icon, short label, and one-line description, linking to respective pages.

POPULAR TOPICS SECTION: List of 5-6 commonly-linked FAQ article titles as simple text links with chevron icons, grouped under a "Popular Topics" heading.

BOTTOM BANNER: Mist card — "Have an account? Get richer support in the app" with app download CTA, since ticket history and live chat history live in-app.
```

---

## 12. Help — FAQ List (`/help/faq`)

```
Design the FAQ list page for Do It.

PAGE HEADER: Title "Frequently Asked Questions," search bar to filter FAQs.

CATEGORY SIDEBAR (desktop, left column): Vertical list of FAQ categories (e.g. Getting Started, Payments & Escrow, Verification, Disputes, Account) as clickable filter items, active category highlighted in teal-light background.

FAQ LIST (right column): Accordion-style list of questions — each row shows the question in ink/bold with a chevron, expands to show answer text in slate. Sorted per category, hairline dividers between items.

EMPTY/NO-RESULTS STATE: Simple centered message with a "Contact Support" button when search returns nothing.
```

---

## 13. Help — FAQ Article (`/help/faq/[slug]`)

```
Design a single FAQ article page for Do It.

BREADCRUMB: Home / Help / FAQ / [Question]

ARTICLE CARD: White card, centered narrow column — question as H1, answer body text in slate, clean paragraph/list formatting.

"WAS THIS HELPFUL?" WIDGET: Below the answer — thumbs up/down buttons in teal outline style, tied to a helpful-count.

RELATED FAQ SECTION: 3-4 related question links below, simple list with chevrons.

BOTTOM CTA: "Still need help?" with Contact Us button.
```

---

## 14. Help — Contact Form (`/help/contact`)

```
Design the Contact Us page for Do It.

PAGE HEADER: Title "Get in Touch," short subtitle.

TWO-COLUMN LAYOUT: Left column — the form itself, on a white card: Name (text input), Email (text input), Subject (text input), Category (dropdown: General / Billing / Partnership / Press), Message (large textarea), a subtle bot-protection checkbox/captcha placeholder area, and a solid teal "Send Message" submit button.

Right column: reassurance content — "We typically respond within 24-48 hours," small icons for alternative help paths (FAQ link, Report a Safety Issue link, Download app for live chat).

FORM VALIDATION STATE: Show example inline error styling on one field (red border #E74C3C, small error text) to demonstrate the error state design.

SUCCESS STATE (separate screen variant): Centered confirmation card with teal checkmark icon, "Message sent!" heading, and a "Back to Help Center" link.
```

---

## 15. Help — Report a Safety Issue (`/help/report`)

```
Design the "Report a Safety Issue" page for Do It. Serious, reassuring tone — no login required.

PAGE HEADER: Title "Report a Safety Issue," subtitle reassuring the visitor this goes directly to the Trust & Safety team, styled with a calm shield icon rather than alarming red.

FORM (single column, white card, max width ~600px):
- Job ID or Provider Username (optional text input, helper text "if known")
- Your name (text input)
- Your email (text input, for follow-up)
- Description of the issue (large textarea, required)
- Evidence upload (drag-and-drop file upload zone, accepts images/docs, shows "securely uploaded" note)
- Bot-protection placeholder
- Submit button: "Submit Report" — use warning/amber-dark tone rather than playful teal, to signal seriousness while staying on-brand (no red button)

REASSURANCE SIDEBAR/FOOTNOTE: Small text block: "Reports are reviewed with elevated priority by our Trust & Safety team. You do not need an account to submit a report."

CONFIRMATION STATE (separate screen variant): Centered card, checkmark icon, "Report received" heading, reference number display, note that the team will follow up by email.
```

---

## 16. Download (`/download`)

```
Design the App Download page for Do It.

HERO SECTION: Split layout — left side: headline "Do It, wherever you are," subheading, App Store and Google Play badge buttons stacked or side by side, right side: large QR code card on a white surface with teal border, label "Scan to download."

FEATURE HIGHLIGHTS: Below hero, 3-column icon + short text row: "Post jobs on the go," "Chat with your provider," "Track escrow & payments in real time."

PHONE MOCKUP VISUAL: Center or right-aligned illustration/mockup frame area (placeholder phone frame) showing the app's home screen, for visual appeal.

BOTTOM SECTION: Simple restatement of store badges + QR code for visitors who scroll past the hero.
```

---

## 17–19. Legal Pages (`/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy`)

```
Design a legal document page template for Do It (use for Privacy Policy, Terms of Service, and Cookie Policy — same layout, different content).

LAYOUT: Two-column on desktop — left sidebar: sticky table of contents (auto-generated section links, teal active-state indicator as user scrolls), right/main column: document content — H1 title (e.g. "Privacy Policy"), "Last updated: [date]" subtext, then numbered H2 sections with body paragraphs in slate text, generous line height, max reading width ~700px.

STYLE: Minimal, plain, no marketing elements — this is a reference document, not a sales page. Hairline dividers between major sections. Simple footer note: "Questions? Contact us" link.

Mobile variant: table of contents collapses into a dropdown/accordion above the content.
```

---

## 20. Login (`/login`) — Option A: Deep-link only

```
Design the web Login page for Do It as a deep-link redirect page (per Option A — no in-browser authenticated session yet).

CENTERED CARD LAYOUT: On a mist background, a centered white card, max-width ~440px. Do It logo at top. Headline "Log in with the Do It app." Short explanatory text: "For your security, account access happens in the app." App Store + Google Play badge buttons stacked. Below that, a QR code for quick mobile access, labeled "Scan to open the app."

SECONDARY LINK: Small text at bottom — "New to Do It? Learn how it works" linking to /how-it-works.

Keep this screen simple and calm — no form fields, since this phase is deep-link only.
```

---

## 21. Register (`/register`) — Option A: Deep-link only

```
Design the web Register/Sign-up page for Do It as a deep-link redirect page (per Option A).

CENTERED CARD LAYOUT: Same structure as Login page for visual consistency. Headline "Get started with Do It." Short text: "Create your account in the app to post jobs or offer your services." Two large tappable choice cards side by side (or stacked mobile): "I need something done" (Client path) and "I want to offer my services" (Provider path) — each with icon, then leads to the same App Store/Google Play badges + QR code below.

SECONDARY LINK: "Already have an account? Log in" text link at the bottom.
```

---

## 22. Shared Component — Header

```
Design a reusable sticky website header component for Do It.

LAYOUT: Full-width, white/paper background with a hairline bottom border, height ~72px. Left: Do It logo (wordmark, teal). Center: horizontal nav links — How It Works, Categories, Pricing, Trust & Safety, Blog, Help — ink-colored text, teal underline on active/hover state. Right: language switcher (globe icon + dropdown), "Log In" text link, "Download App" solid teal rounded button.

MOBILE VARIANT: Logo left, hamburger icon right, nav collapses into a full-screen slide-in menu with the same links stacked, plus Log In and Download App buttons at the bottom of the menu.
```

---

## 23. Shared Component — Footer

```
Design a reusable website footer component for Do It.

LAYOUT: Full-width, dark teal background (#0D1F1E), light mint text (#E8F8F6). Four-column layout on desktop (stacked accordion on mobile):
- Column 1: Do It logo + one-line tagline + social icons (teal-tinted icons)
- Column 2 "Company": About, Blog, Careers, Press
- Column 3 "For Clients / Providers": How It Works, Categories, Pricing, Trust & Safety
- Column 4 "Support": Help Center, Contact Us, Report a Safety Issue, FAQ

Below the columns: App Store + Google Play badges, then a hairline divider, then bottom row — copyright text, Legal links (Privacy Policy, Terms of Service, Cookie Policy) inline, and a language switcher dropdown, all in small muted mint-gray text.
```

---

## Notes on using these in Stitch

- **Order matters:** run the Global Style Prompt (§0) first so Stitch locks in the teal/amber palette and typography before generating individual screens — this keeps every page visually consistent, which is the whole point of §9 in the doc.
- **Header/Footer:** generate §22 and §23 once, then reference "use the existing header/footer component" in each page prompt if Stitch supports component reuse in your plan tier — otherwise just repeat the header/footer style lines briefly at the top of each page prompt.
- **Never-show fields:** the Provider Profile prompt (§5) deliberately omits phone, email, exact GPS, wallet, dispute history, and raw KYC status per §2/§3.3 of the doc — don't add them back in even if Stitch suggests a "contact" field with an email input.
- **Login/Register:** these follow Option A (deep-link only) since that's the doc's recommended default (§5). If you later confirm Option B (lightweight authenticated dashboard), those two prompts will need to be rewritten as real form + dashboard screens.
- **Placeholder data:** stat numbers, fee percentages, and testimonial content are intentionally described as placeholder/example values — swap in real figures once `/api/v1/public/stats` and the fee schedule are finalized (see §11 Open Items).
