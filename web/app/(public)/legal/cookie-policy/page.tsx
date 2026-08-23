'use client';

import LegalDocument from '../components/LegalDocument';

export default function CookiePolicyPage() {
  const sections = [
    {
      id: 'introduction',
      level: 1 as const,
      title: 'Cookie Policy',
      content: (
        <p>
          This Cookie Policy explains how Do It ("we," "our," "us") uses cookies and similar tracking technologies on our website and mobile application. By using our Services, you agree to the use of cookies as described in this policy. You can manage your preferences at any time via the cookie banner or your browser settings.
        </p>
      ),
    },
    {
      id: 'what-are-cookies',
      level: 2 as const,
      title: '1. What Are Cookies',
      content: (
        <>
          <p>Cookies are small text files stored on your device (computer, phone, tablet) when you visit a website. They help websites remember your preferences, recognize you on return visits, and enable certain functionality. "Cookies" in this policy also refers to similar technologies like local storage, session storage, and tracking pixels.</p>
        </>
      ),
    },
    {
      id: 'categories',
      level: 2 as const,
      title: '2. Categories of Cookies We Use',
      content: (
        <>
          <h3>Essential Cookies (Always Active)</h3>
          <p>These cookies are necessary for the Services to function and cannot be switched off. They do not store personally identifiable information.</p>
          <ul>
            <li><strong>Session & Authentication:</strong> Keep you logged in, maintain session security, prevent fraud.</li>
            <li><strong>Security:</strong> Detect malicious activity, enforce rate limits, protect against CSRF.</li>
            <li><strong>Escrow & Payments:</strong> Maintain transaction state during checkout and payout flows.</li>
            <li><strong>Load Balancing:</strong> Distribute traffic across servers for reliability.</li>
          </ul>

          <h3>Preferences Cookies</h3>
          <p>Remember your choices to provide a personalized experience.</p>
          <ul>
            <li><strong>Language & Region:</strong> Remember your selected language and country.</li>
            <li><strong>Theme:</strong> Light/dark mode preference.</li>
            <li><strong>Cookie Consent:</strong> Record your consent choices.</li>
          </ul>

          <h3>Analytics Cookies</h3>
          <p>Help us understand how visitors interact with the Services so we can improve them.</p>
          <ul>
            <li><strong>Usage Statistics:</strong> Pages visited, features used, time spent, error tracking.</li>
            <li><strong>Funnel Analysis:</strong> Identify drop-off points in job posting, hiring, verification flows.</li>
            <li><strong>Performance Monitoring:</strong> Page load times, API latency, error rates.</li>
          </ul>
          <p>We use privacy-friendly analytics (no cross-site tracking, IP anonymization).</p>

          <h3>Marketing Cookies (Opt-In)</h3>
          <p>Used to deliver relevant advertisements and measure campaign effectiveness.</p>
          <ul>
            <li><strong>Attribution:</strong> Track which channels bring new users (referral, organic, paid).</li>
            <li><strong>Retargeting:</strong> Show Do It ads on partner platforms to previous visitors.</li>
            <li><strong>Conversion Tracking:</strong> Measure sign-ups, first job posted, first proposal submitted.</li>
          </ul>
          <p>These are only set with your explicit consent via the cookie banner.</p>
        </>
      ),
    },
    {
      id: 'third-party',
      level: 2 as const,
      title: '3. Third-Party Cookies',
      content: (
        <>
          <p>We integrate with trusted partners who may set cookies on our domains:</p>
          <ul>
            <li><strong>Stripe / Payment Partners:</strong> Payment processing, fraud detection (essential).</li>
            <li><strong>Google Analytics / Mixpanel:</strong> Aggregated usage analytics (analytics).</li>
            <li><strong>Sentry:</strong> Error tracking and performance monitoring (essential/analytics).</li>
            <li><strong>Intercom / Customer.io:</strong> In-app messaging and email automation (preferences).</li>
            <li><strong>Social Login (Google, Apple):</strong> OAuth authentication (essential).</li>
          </ul>
          <p>Each partner has their own privacy policy. We only share data necessary for the service they provide.</p>
        </>
      ),
    },
    {
      id: 'duration',
      level: 2 as const,
      title: '4. Cookie Duration',
      content: (
        <>
          <p>Cookies may be session-based (expire when you close your browser) or persistent (remain until deleted or after a set period). Typical durations:</p>
          <ul>
            <li><strong>Session cookies:</strong> Duration of your visit.</li>
            <li><strong>Authentication tokens:</strong> 30 days (refreshable).</li>
            <li><strong>Preferences:</strong> 1 year.</li>
            <li><strong>Analytics:</strong> 13 months (per GDPR ePrivacy guidance).</li>
            <li><strong>Marketing:</strong> 90 days (or per partner policy).</li>
          </ul>
        </>
      ),
    },
    {
      id: 'managing',
      level: 2 as const,
      title: '5. Managing Your Cookie Preferences',
      content: (
        <>
          <p>You can control cookies in several ways:</p>
          <ul>
            <li><strong>Cookie Banner:</strong> Accept all, reject non-essential, or customize by category on first visit. Reopen via the footer "Cookie Preferences" link.</li>
            <li><strong>Browser Settings:</strong> Block, delete, or alert for cookies. Note: disabling essential cookies will break core functionality.</li>
            <li><strong>Mobile App:</strong> iOS/Android system settings for tracking (Limit Ad Tracking, App Tracking Transparency).</li>
            <li><strong>Opt-Out Tools:</strong> <a href="https://optout.networkadvertising.org/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">NAI Opt-Out</a>, <a href="https://www.aboutads.info/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">DAA Opt-Out</a>.</li>
          </ul>
          <p>Withdrawing consent does not affect the lawfulness of processing before withdrawal.</p>
        </>
      ),
    },
    {
      id: 'gdpr',
      level: 2 as const,
      title: '6. Your Rights (GDPR, CCPA, LGPD, PDPA)',
      content: (
        <>
          <p>If you are in the EU/EEA, UK, California, Brazil, Singapore, or other jurisdictions with data protection laws, you have rights regarding cookies that process personal data:</p>
          <ul>
            <li>Access, rectification, erasure, restriction, portability.</li>
            <li>Object to processing based on legitimate interests.</li>
            <li>Withdraw consent at any time (for consent-based cookies).</li>
            <li>Lodge a complaint with a supervisory authority.</li>
          </ul>
          <p>Exercise these rights via <a href="mailto:privacy@doit.com" className="text-primary hover:underline">privacy@doit.com</a> or the cookie banner.</p>
        </>
      ),
    },
    {
      id: 'changes',
      level: 2 as const,
      title: '7. Changes to This Policy',
      content: (
        <>
          <p>We may update this Cookie Policy to reflect changes in our practices, technologies, or legal requirements. Material changes will be posted here with a revised "Last updated" date and highlighted in the cookie banner. Continued use after changes constitutes acceptance.</p>
        </>
      ),
    },
    {
      id: 'contact',
      level: 2 as const,
      title: '8. Contact Us',
      content: (
        <>
          <p>Questions about this Cookie Policy or your cookie choices? Contact:</p>
          <address className="not-italic">
            <p>Do It Privacy Team</p>
            <p>Email: <a href="mailto:privacy@doit.com" className="text-primary hover:underline">privacy@doit.com</a></p>
            <p>{'In-app: Help \u003E Contact Support'}</p>
          </address>
        </>
      ),
    },
  ];

  return (
    <LegalDocument
      title="Cookie Policy"
      lastUpdated="January 15, 2025"
      description="This Cookie Policy explains how Do It uses cookies and similar tracking technologies."
      sections={sections}
    />
  );
}