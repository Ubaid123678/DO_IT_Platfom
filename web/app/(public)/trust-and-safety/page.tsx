'use client';

import { ShieldCheck, UserCheck, GraduationCap, Lock, Scale, Search, CheckCircle2, Star, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const pillars = [
  {
    icon: UserCheck,
    title: 'Identity Verification',
    description: 'Every provider submits a government ID and a live selfie. Our trained review team verifies each one — so you know the person you\'re hiring is who they say they are.',
  },
  {
    icon: GraduationCap,
    title: 'Skill Verification',
    description: 'Providers prove their skills with certificates, portfolios, or practical tests. Each category skill is reviewed — some auto-verified, others by our admin team within 24–48 hours.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'When you hire, your payment is held safely by Do It. The provider only gets paid after you confirm the work is complete. Your money is never released without your approval.',
  },
  {
    icon: Scale,
    title: 'Dispute Resolution',
    description: 'If something goes wrong, open a dispute within the evidence window. Both sides share proof, our admin team reviews fairly, and funds are released according to the verdict.',
  },
  {
    icon: Search,
    title: 'Fraud Protection',
    description: 'We continuously monitor for suspicious activity to keep the marketplace safe. Automated systems flag unusual patterns, and our team investigates promptly — without compromising your privacy.',
  },
];

export default function TrustAndSafetyPage() {
  return (
    <div className="bg-mist">
      {/* PAGE HEADER - TRUST-FORWARD HERO */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[rgba(13,31,30,0.7)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-32 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <ShieldCheck className="h-10 w-10 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 id="hero-title" className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-tight text-white">
              Your safety is built into every job.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              From identity checks to escrow protection — every layer is designed so you can hire and work with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* FIVE-PILLAR GRID SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="pillars-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="pillars-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              How we protect you
            </h2>
            <p className="mt-4 text-slate">
              Five pillars that make Do It a safer place for clients and providers.
            </p>
          </header>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={index}
                  className="group h-full p-6 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-lg hover:border-primary transition-all duration-200"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary! mb-2">{pillar.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST BADGE LEGEND */}
      <section className="py-16 md:py-20 bg-mist border-y border-hairline" aria-labelledby="badges-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="badges-heading" className="text-2xl md:text-3xl font-extrabold text-primary!">
              Trust badges you&apos;ll see
            </h2>
            <p className="mt-3 text-slate">
              Recognize these badges across the site — they mean the same thing everywhere.
            </p>
          </header>

          <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-stretch justify-center gap-4 p-6 bg-white rounded-2xl border border-hairline shadow-sm">
              {/* IDENTITY VERIFIED BADGE */}
              <div className="flex min-h-40 flex-1 basis-[320px] items-center gap-4 p-4 sm:p-6 rounded-xl bg-primary-light border border-primary/20">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Identity Verified
                  </span>
                </div>
                <div className="text-sm text-slate">
                  ID + selfie reviewed by our team
                </div>
              </div>

              {/* SKILL VERIFIED BADGE */}
              <div className="flex min-h-40 flex-1 basis-[320px] items-center gap-4 p-4 sm:p-6 rounded-xl bg-primary-light border border-primary/20">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary border border-primary/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Skill Verified
                  </span>
                </div>
                <div className="text-sm text-slate">
                  Certificates, portfolio, or tests approved
                </div>
              </div>

              {/* STAR RATING */}
              <div className="flex min-h-40 flex-1 basis-[320px] items-center gap-4 p-4 sm:p-6 rounded-xl bg-primary-light border border-primary/20">
                <div className="flex shrink-0 items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-amber fill-current" aria-hidden="true" />
                    <Star className="h-5 w-5 text-amber fill-current" aria-hidden="true" />
                    <Star className="h-5 w-5 text-amber fill-current" aria-hidden="true" />
                    <Star className="h-5 w-5 text-amber fill-current" aria-hidden="true" />
                    <Star className="h-5 w-5 text-amber fill-current" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-primary!">4.9</span>
                  <span className="text-slate text-sm">(127 reviews)</span>
                </div>
                <div className="text-sm text-slate">
                  Real reviews from verified clients
                </div>
              </div>

              {/* ESCROW PROTECTED */}
              <div className="flex min-h-40 flex-1 basis-[320px] items-center gap-4 p-4 sm:p-6 rounded-xl bg-primary-light border border-primary/20">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Escrow Protected
                  </span>
                </div>
                <div className="text-sm text-slate">
                  Funds held until you confirm completion
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Have a safety concern?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            We take every report seriously. Our team investigates promptly and confidentially.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help/report"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Report a Safety Issue
            </Link>
            <Link
              href="/help/trust-safety"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Learn more in Help Center
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}