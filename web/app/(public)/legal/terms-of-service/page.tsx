'use client';

import LegalDocument from '../components/LegalDocument';

export default function TermsOfServicePage() {
  const sections = [
    {
      id: 'introduction',
      level: 1 as const,
      title: 'Terms of Service',
      content: (
        <p>
          These Terms of Service ("Terms") govern your access to and use of the Do It platform, website, and mobile application (collectively, the "Services"). By creating an account or using the Services, you agree to these Terms. If you do not agree, you may not use the Services.
        </p>
      ),
    },
    {
      id: 'definitions',
      level: 2 as const,
      title: '1. Definitions',
      content: (
        <>
          <ul>
            <li><strong>"Client"</strong> — A user who posts jobs on the platform.</li>
            <li><strong>"Provider"</strong> — A user who offers services and submits proposals.</li>
            <li><strong>"Job"</strong> — A work request posted by a Client.</li>
            <li><strong>"Proposal"</strong> — A Provider's offer to complete a Job.</li>
            <li><strong>"Escrow"</strong> — Funds held by Do It on behalf of the Client until the Job is completed and confirmed.</li>
            <li><strong>"Platform Fee"</strong> — The fee Do It charges on each completed transaction.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'eligibility',
      level: 2 as const,
      title: '2. Eligibility',
      content: (
        <>
          <p>You must be at least 18 years old and have the legal capacity to enter into contracts. By using the Services, you represent and warrant that you meet these requirements. Certain jurisdictions may impose additional requirements.</p>
        </>
      ),
    },
    {
      id: 'accounts',
      level: 2 as const,
      title: '3. Accounts and Verification',
      content: (
        <>
          <p>You must provide accurate, complete, and current registration information. You are responsible for safeguarding your password and for all activity under your account.</p>
          <p><strong>Providers</strong> must complete identity verification (KYC) and skill verification for each category before submitting proposals. Do It may suspend or terminate accounts with incomplete, fraudulent, or outdated verification.</p>
        </>
      ),
    },
    {
      id: 'jobs-and-proposals',
      level: 2 as const,
      title: '4. Jobs, Proposals, and Hiring',
      content: (
        <>
          <p><strong>Clients:</strong> You may post Jobs with accurate descriptions, budgets, timelines, and locations. You may accept one Proposal per Job. Once accepted, a binding agreement is formed between you and the Provider.</p>
          <p><strong>Providers:</strong> You may submit Proposals to Jobs matching your verified skills. You may have up to 10 active Proposals at a time. Accepted Proposals create a binding agreement to complete the Job as described.</p>
          <p>Do It is not a party to the Client-Provider agreement. We provide the platform, escrow, and dispute resolution — we do not employ Providers or guarantee Job outcomes.</p>
        </>
      ),
    },
    {
      id: 'escrow-and-payments',
      level: 2 as const,
      title: '5. Escrow, Payments, and Fees',
      content: (
        <>
          <p><strong>Escrow:</strong> When a Proposal is accepted, the Client funds the Job amount (plus Platform Fee) into Escrow. Funds are held by Do It until the Client confirms completion or a dispute is resolved.</p>
          <p><strong>Platform Fee:</strong> Clients pay 5\u201315% (varies by category); Providers pay 10\u201320% of earnings (varies by category). Payment processing fees (~2.9% + $0.30) are passed through. All fees are shown before commitment.</p>
          <p><strong>Payouts:</strong> Providers withdraw to bank, mobile wallet, or local methods in their currency. Conversion uses mid-market rate + small margin. Payout times vary by method (typically 1\u20133 business days).</p>
          <p><strong>Refunds:</strong> Full refund if cancelled before acceptance. After acceptance, refunds depend on Job stage — see Help Center.</p>
        </>
      ),
    },
    {
      id: 'completion-and-disputes',
      level: 2 as const,
      title: '6. Completion, Reviews, and Disputes',
      content: (
        <>
          <p><strong>Completion:</strong> Providers mark Jobs complete; Clients have 7 days to confirm or open a dispute. After 7 days, completion is auto-confirmed.</p>
          <p><strong>Reviews:</strong> Both parties may leave one review per completed Job. Reviews must be truthful and non-defamatory. Do It may remove reviews violating policy.</p>
          <p><strong>Disputes:</strong> Either party may open a dispute within 7 days of completion. Both sides submit evidence; Do It's Trust & Safety team reviews and issues a binding decision. Funds remain locked until resolution.</p>
        </>
      ),
    },
    {
      id: 'prohibited-conduct',
      level: 2 as const,
      title: '7. Prohibited Conduct',
      content: (
        <>
          <p>You agree not to:</p>
          <ul>
            <li>Violate laws, infringe intellectual property, or violate these Terms.</li>
            <li>Post fraudulent, misleading, or illegal Jobs/Proposals.</li>
            <li>Circumvent Escrow, Platform Fees, or verification.</li>
            <li>Harass, threaten, or discriminate against other users.</li>
            <li>Scrape, reverse-engineer, or interfere with the Services.</li>
            <li>Use the Services for illegal activities (fraud, money laundering, etc.).</li>
          </ul>
          <p>Violations may result in account suspension, termination, and legal action.</p>
        </>
      ),
    },
    {
      id: 'intellectual-property',
      level: 2 as const,
      title: '8. Intellectual Property',
      content: (
        <>
          <p>Do It owns all rights to the Services, including software, design, trademarks, and content (except user-generated content). You grant Do It a worldwide, royalty-free license to host, display, and distribute your content (profiles, proposals, reviews, uploads) solely for operating the Services. You retain ownership of your content.</p>
        </>
      ),
    },
    {
      id: 'disclaimers',
      level: 2 as const,
      title: '9. Disclaimers and Limitation of Liability',
      content: (
        <>
          <p>The Services are provided "as is" and "as available" without warranties of any kind. Do It does not warrant that the Services will be uninterrupted, error-free, or secure. To the maximum extent permitted by law, Do It is not liable for indirect, incidental, consequential, or punitive damages, or for any loss of data, profits, or goodwill. Total liability is limited to fees paid in the 12 months preceding the claim.</p>
        </>
      ),
    },
    {
      id: 'indemnification',
      level: 2 as const,
      title: '10. Indemnification',
      content: (
        <>
          <p>You agree to indemnify and hold Do It harmless from claims, damages, and expenses (including attorney fees) arising from your use of the Services, violation of these Terms, or infringement of third-party rights.</p>
        </>
      ),
    },
    {
      id: 'termination',
      level: 2 as const,
      title: '11. Termination',
      content: (
        <>
          <p>You may close your account at any time. Do It may suspend or terminate your account for violations of these Terms, fraud, inactivity (12+ months), or legal requirements. Upon termination, your license to use the Services ends, but surviving provisions (fees, liability, indemnification) continue.</p>
        </>
      ),
    },
    {
      id: 'governing-law',
      level: 2 as const,
      title: '12. Governing Law and Dispute Resolution',
      content: (
        <>
          <p>These Terms are governed by the laws of Singapore. Disputes will be resolved through good-faith negotiation, then binding arbitration under SIAC rules in Singapore, in English. Each party bears its own costs. This clause does not prevent seeking injunctive relief in court.</p>
        </>
      ),
    },
    {
      id: 'general',
      level: 2 as const,
      title: '13. General Provisions',
      content: (
        <>
          <ul>
            <li><strong>Entire Agreement:</strong> These Terms, Privacy Policy, and Cookie Policy constitute the entire agreement.</li>
            <li><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect.</li>
            <li><strong>No Waiver:</strong> Failure to enforce a right does not waive it.</li>
            <li><strong>Assignment:</strong> You may not assign these Terms. Do It may assign freely.</li>
            <li><strong>Force Majeure:</strong> No liability for delays due to events beyond reasonable control.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'contact',
      level: 2 as const,
      title: '14. Contact Us',
      content: (
        <>
          <p>Questions about these Terms? Contact:</p>
          <address className="not-italic">
            <p>Do It Legal Team</p>
            <p>Email: <a href="mailto:legal@doit.com" className="text-primary hover:underline">legal@doit.com</a></p>
            <p>{'In-app: Help \u003E Contact Support'}</p>
          </address>
        </>
      ),
    },
  ];

  return (
    <LegalDocument
      title="Terms of Service"
      lastUpdated="January 15, 2025"
      description="These Terms govern your use of the Do It platform. Please read them carefully."
      sections={sections}
    />
  );
}