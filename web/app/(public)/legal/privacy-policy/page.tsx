'use client';

import LegalDocument from '../components/LegalDocument';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: 'introduction',
      level: 1 as const,
      title: 'Privacy Policy',
      content: (
        <p>
          Welcome to Do It ("we," "our," "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website, and mobile application (collectively, the "Services"). Please read this policy carefully. If you do not agree with the terms of this policy, please do not access the Services.
        </p>
      ),
    },
    {
      id: 'information-we-collect',
      level: 2 as const,
      title: '1. Information We Collect',
      content: (
        <>
          <p>We collect information you provide directly to us, information we collect automatically, and information from third parties.</p>
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email, phone number, password, profile photo, bio, location, and verification documents (government ID, selfie) when you create an account.</li>
            <li><strong>Job & Proposal Data:</strong> Job descriptions, budgets, locations, messages, proposals, reviews, ratings, and payment details.</li>
            <li><strong>Verification Documents:</strong> Government-issued IDs, selfies, certificates, portfolios, and test results for skill verification.</li>
            <li><strong>Payment Information:</strong> Bank account details, mobile wallet info, and transaction history for payouts and escrow.</li>
          </ul>
          <h3>Automatically Collected Information</h3>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent, device type, operating system, and IP address.</li>
            <li><strong>Location Data:</strong> Approximate location (city/region) for job matching; precise GPS only with explicit consent.</li>
            <li><strong>Cookies & Similar Technologies:</strong> See our Cookie Policy for details.</li>
          </ul>
          <h3>Third-Party Sources</h3>
          <ul>
            <li>Social login providers (Google, Apple) when you sign up via OAuth.</li>
            <li>Verification partners for identity and credential checks.</li>
            <li>Payment processors (Stripe, local providers) for transaction data.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'how-we-use-information',
      level: 2 as const,
      title: '2. How We Use Your Information',
      content: (
        <>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Services.</li>
            <li>Verify identities and skills for trust and safety.</li>
            <li>Match clients with providers and facilitate job posting, proposals, and hiring.</li>
            <li>Process payments, manage escrow, and handle payouts.</li>
            <li>Communicate with you (support, notifications, updates, marketing with consent).</li>
            <li>Detect and prevent fraud, abuse, and security incidents.</li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'information-sharing',
      level: 2 as const,
      title: '3. Information Sharing and Disclosure',
      content: (
        <>
          <p>We do not sell your personal information. We may share information in the following circumstances:</p>
          <ul>
            <li><strong>With Other Users:</strong> Name, profile photo, verified badges, ratings, reviews, and portfolio items visible to matched clients/providers. Phone, email, and exact address are never shared.</li>
            <li><strong>Service Providers:</strong> Payment processors, cloud hosting, verification partners, analytics, and communication platforms — only as needed to perform services on our behalf under strict contracts.</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights, safety, or property.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice and subject to this policy.</li>
            <li><strong>With Your Consent:</strong> For any other purpose disclosed at the time of collection.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'data-retention',
      level: 2 as const,
      title: '4. Data Retention',
      content: (
        <>
          <p>We retain your information as long as your account is active or as needed to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements. After account deletion, we anonymize or delete data within 30 days, except where retention is required by law (e.g., financial records for 7 years).</p>
        </>
      ),
    },
    {
      id: 'data-security',
      level: 2 as const,
      title: '5. Data Security',
      content: (
        <>
          <p>We implement appropriate technical and organizational measures to protect your information, including:</p>
          <ul>
            <li>Encryption in transit (TLS 1.2+) and at rest (AES-256).</li>
            <li>Regular security assessments and penetration testing.</li>
            <li>Access controls, audit logs, and employee training.</li>
            <li>Verified partners meeting SOC 2 / ISO 27001 standards.</li>
          </ul>
          <p>No method of transmission or storage is 100% secure. We cannot guarantee absolute security.</p>
        </>
      ),
    },
    {
      id: 'your-rights',
      level: 2 as const,
      title: '6. Your Rights and Choices',
      content: (
        <>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access, correct, or delete your personal data.</li>
            <li>Restrict or object to processing.</li>
            <li>Data portability (receive your data in a structured format).</li>
            <li>Withdraw consent for marketing communications.</li>
            <li>Opt out of non-essential cookies (see Cookie Policy).</li>
            <li>Lodge a complaint with a supervisory authority.</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:privacy@doit.com" className="text-primary hover:underline">privacy@doit.com</a> or use the in-app account settings. We respond within 30 days.</p>
        </>
      ),
    },
    {
      id: 'international-transfers',
      level: 2 as const,
      title: '7. International Data Transfers',
      content: (
        <>
          <p>Do It operates globally. Your data may be transferred to and processed in countries other than your own, including the United States and Singapore, where our servers and partners are located. We ensure appropriate safeguards (Standard Contractual Clauses, adequacy decisions) for cross-border transfers.</p>
        </>
      ),
    },
    {
      id: 'childrens-privacy',
      level: 2 as const,
      title: '8. Children\'s Privacy',
      content: (
        <>
          <p>The Services are not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe we have collected data from a child, contact us immediately and we will delete it.</p>
        </>
      ),
    },
    {
      id: 'changes',
      level: 2 as const,
      title: '9. Changes to This Policy',
      content: (
        <>
          <p>We may update this policy periodically. Material changes will be posted on this page with a revised "Last updated" date. Continued use of the Services after changes constitutes acceptance.</p>
        </>
      ),
    },
    {
      id: 'contact',
      level: 2 as const,
      title: '10. Contact Us',
      content: (
        <>
          <p>If you have questions about this Privacy Policy or our data practices, contact:</p>
          <address className="not-italic">
            <p>Do It Trust & Safety Team</p>
            <p>Email: <a href="mailto:privacy@doit.com" className="text-primary hover:underline">privacy@doit.com</a></p>
            <p>{'In-app: Help \u003E Contact Support'}</p>
          </address>
        </>
      ),
    },
  ];

  return (
    <LegalDocument
      title="Privacy Policy"
      lastUpdated="January 15, 2025"
      description="This Privacy Policy explains how Do It collects, uses, and protects your personal information."
      sections={sections}
    />
  );
}