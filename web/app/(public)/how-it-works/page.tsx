'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

const clientSteps = [
  {
    number: 1,
    title: 'Sign up',
    description: 'Verify email + phone to create your account.',
  },
  {
    number: 2,
    title: 'Post a job',
    description: 'Choose category, write description, set location (physical) or remote (digital), pick fixed or hourly budget, set deadline, attach up to 5 files.',
  },
  {
    number: 3,
    title: 'Get matched',
    description: 'Automatic notifications go to nearby or skill-matched verified providers. You can also browse and invite providers manually.',
  },
  {
    number: 4,
    title: 'Review proposals',
    description: 'Compare bids, estimated time, ratings, and cover messages. Accept exactly one provider.',
  },
  {
    number: 5,
    title: 'Escrow funds the job',
    description: 'Wallet funds are locked automatically. The provider is paid only after you confirm completion.',
  },
  {
    number: 6,
    title: 'Track progress & chat',
    description: 'In-app messaging with your accepted provider for updates, questions, and coordination.',
  },
  {
    number: 7,
    title: 'Confirm completion',
    description: 'Review the work and confirm. Funds release to the provider minus the platform fee.',
  },
  {
    number: 8,
    title: 'Leave a review',
    description: 'Rate the provider and share your experience to help others.',
  },
  {
    number: 9,
    title: 'Dispute (if needed)',
    description: 'Open a dispute within the evidence window. Admin reviews and delivers a fair verdict.',
  },
];

const providerSteps = [
  {
    number: 1,
    title: 'Sign up',
    description: 'Create your account with email and phone verification.',
  },
  {
    number: 2,
    title: 'KYC identity verification',
    description: 'Submit government ID and selfie. Typically approved within ~48 hours.',
  },
  {
    number: 3,
    title: 'Choose categories & skills',
    description: 'Select up to 3 service categories and the specific skills you offer within each.',
  },
  {
    number: 4,
    title: 'Verify skills',
    description: 'Upload certificates, portfolio items, or take skill tests. Some auto-verify; others need ~24–48 hr admin review.',
  },
  {
    number: 5,
    title: 'Build your profile',
    description: 'Add bio, experience, portfolio, availability, and use resume auto-fill to save time.',
  },
  {
    number: 6,
    title: 'Get matched to jobs',
    description: 'Receive notifications for jobs matching your verified skills and location.',
  },
  {
    number: 7,
    title: 'Submit proposals',
    description: 'Bid on matched jobs with your price, timeline, and cover message. Max 10 active proposals at a time.',
  },
  {
    number: 8,
    title: 'Get accepted & work',
    description: 'Client accepts your proposal. Begin work and coordinate via in-app chat.',
  },
  {
    number: 9,
    title: 'Mark job complete',
    description: 'Submit completion for client confirmation.',
  },
  {
    number: 10,
    title: 'Get paid out',
    description: 'Receive payout in your local currency via bank transfer or mobile wallet.',
  },
  {
    number: 11,
    title: 'Build reputation over time',
    description: 'Earn ratings, reviews, and verified badges that increase visibility and trust.',
  },
];

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'provider'>('client');
  const steps = activeTab === 'client' ? clientSteps : providerSteps;

  return (
    <div className="bg-mist">
      {/* PAGE HEADER */}
      <section className="py-16 md:py-24 bg-white border-b border-hairline" aria-labelledby="page-title">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 id="page-title" className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-tight text-primary!">
            How Do It Works
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate max-w-2xl mx-auto">
            Two simple journeys — pick the one that&apos;s you.
          </p>

          {/* SEGMENTED TOGGLE */}
          <div className="mt-10" role="tablist" aria-label="Select journey">
            <div className="inline-flex items-center gap-1 rounded-xl bg-mist p-1 border border-hairline" role="group">
              <button
                role="tab"
                aria-selected={activeTab === 'client'}
                aria-controls="client-panel"
                id="client-tab"
                onClick={() => setActiveTab('client')}
                className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'client'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate hover:text-ink'
                }`}
              >
                For Clients
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'provider'}
                aria-controls="provider-panel"
                id="provider-tab"
                onClick={() => setActiveTab('provider')}
                className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'provider'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate hover:text-ink'
                }`}
              >
                For Providers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="timeline-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="timeline-heading" className="sr-only">
            {activeTab === 'client' ? 'Client Journey' : 'Provider Journey'}
          </h2>

          {/* PROVIDER CALLOUT BOX */}
          {activeTab === 'provider' && (
            <div
              className="mb-12 p-5 md:p-6 rounded-2xl bg-amber-light border border-amber/30 flex gap-4"
              role="alert"
              aria-live="polite"
            >
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-ink">
                  A provider only appears in search and matching for a category once both identity verification AND that category&apos;s skill verification are approved.
                </p>
              </div>
            </div>
          )}

          {/* TIMELINE CONTAINER - centered single column */}
          <div className="mx-auto max-w-3xl space-y-8">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <article
                  key={step.number}
                  className="relative flex gap-6"
                >
                  {/* STEP NUMBER CIRCLE */}
                  <div
                    className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white font-extrabold text-xl"
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>

                  {/* CARD CONTENT */}
                  <div className="flex-1 pt-1">
                    <div className="relative p-6 rounded-2xl bg-white border border-hairline shadow-sm">
                      <h3 className="text-xl font-bold text-primary! tracking-tight">{step.title}</h3>
                      <p className="mt-2 text-sm text-slate leading-relaxed">{step.description}</p>
                    </div>

                    {/* CONNECTOR LINE TO NEXT STEP */}
                    {!isLast && (
                      <div
                        className="absolute left-7 top-[56px] bottom-0 w-0.5 bg-primary/20"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Join thousands of clients and providers already using Do It.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=client"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Post a Job
            </Link>
            <Link
              href="/register?role=provider"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Apply as a Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}