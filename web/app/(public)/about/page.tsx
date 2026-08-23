'use client';

import Link from 'next/link';
import { ShieldCheck, Scale, CheckCircle2, Users, Star, ArrowRight, Sparkles } from 'lucide-react';
import { publicStats } from '@/lib/public';

export default function AboutPage() {
  return (
    <div className="bg-mist">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[rgba(13,31,30,0.6)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sparkles className="h-12 w-12 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 id="hero-title" className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-tight text-white max-w-3xl mx-auto">
              Connecting people who need it done with people who can do it.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Do It is a marketplace built on trust, transparency, and fairness. Every feature exists to make hiring and working safer, simpler, and more reliable for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="mission-heading">
        <div className="mx-auto max-w-3xl px-6">
          <header className="text-center mb-12">
            <h2 id="mission-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Our Mission
            </h2>
          </header>
          <div className="prose prose-slate max-w-none prose-lg text-center">
            <p className="text-slate leading-relaxed mb-8">
              We started Do It because finding reliable help shouldn&apos;t be a gamble. Whether you&apos;re a homeowner needing a plumber at midnight or a developer looking for steady freelance work, the experience is often frustrating — unverified providers, unclear pricing, payment disputes, and no safety net.
            </p>
            <p className="text-slate leading-relaxed mb-8">
              Our mission is to make every connection on Do It trustworthy by default. That means verifying identity before anyone can offer services, validating skills so clients know what they&apos;re getting, and holding funds in escrow so both sides are protected. No hidden fees, no fake reviews, no surprises.
            </p>
            <p className="text-slate leading-relaxed">
              We&apos;re building a platform where quality work finds fair pay, where safety is baked into every interaction, and where the best providers rise to the top because they deliver — not because they game the system.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="values-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="values-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Our Values
            </h2>
            <p className="mt-4 text-slate">
              Every decision we make comes back to these principles.
            </p>
          </header>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: 'Trust First',
                description: 'Identity and skill verification are mandatory — not optional. Trust is earned before the first job.',
              },
              {
                icon: Scale,
                title: 'Fair for Everyone',
                description: 'Transparent fees, escrow protection, and dispute resolution that treats both sides equally.',
              },
              {
                icon: CheckCircle2,
                title: 'Verified, Always',
                description: 'Every provider, every category, every skill — verified by our team before they appear in search.',
              },
              {
                icon: Users,
                title: 'Community Over Transactions',
                description: 'We build long-term relationships, not one-off gigs. Reputation and reviews reflect real experiences.',
              },
            ].map((value, index) => (
              <article
                key={index}
                className="p-6 md:p-8 rounded-2xl bg-white border border-hairline shadow-sm text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <value.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-2">{value.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="py-12 md:py-16 bg-primary-light border-y border-hairline" aria-labelledby="stats-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="stats-heading" className="sr-only">Platform Statistics</h2>
          <div className="mx-auto max-w-5xl">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8" role="list">
              <div className="text-center" role="listitem">
                <dt className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary">
                  {publicStats.totalProviders.toLocaleString()}+
                </dt>
                <dd className="mt-1 text-sm text-primary/80">Verified Providers</dd>
              </div>
              <div className="text-center border-l border-primary/20 md:border-0" role="listitem">
                <dt className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary">
                  {publicStats.jobsCompleted.toLocaleString()}+
                </dt>
                <dd className="mt-1 text-sm text-primary/80">Jobs Completed</dd>
              </div>
              <div className="text-center border-l border-primary/20 md:border-0" role="listitem">
                <dt className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary">
                  {publicStats.countriesActive}+
                </dt>
                <dd className="mt-1 text-sm text-primary/80">Countries Active</dd>
              </div>
              <div className="text-center border-l border-primary/20 md:border-0" role="listitem">
                <dt className="flex items-center justify-center gap-1.5 text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary">
                  {publicStats.averageRating}
                  <Star className="h-6 w-6 text-amber" aria-hidden="true" fill="currentColor" />
                </dt>
                <dd className="mt-1 text-sm text-primary/80">Average Rating</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* TEAM/STORY SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="story-heading">
        <div className="mx-auto max-w-3xl px-6">
          <header className="text-center mb-12">
            <h2 id="story-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Our Story
            </h2>
          </header>
          <div className="prose prose-slate max-w-none prose-lg space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
                2022
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary! mb-2">Founded</h3>
                <p className="text-slate leading-relaxed">
                  Do It began as a small team frustrated by the lack of trust in existing service marketplaces. We started with a simple idea: what if every provider was verified before they could accept a job?
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
                2023
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary! mb-2">Escrow & Skill Verification Launched</h3>
                <p className="text-slate leading-relaxed">
                  Added escrow protection so funds are held until work is confirmed, and introduced per-category skill verification with certificates, portfolios, and practical tests.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
                2024
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary! mb-2">Global Expansion</h3>
                <p className="text-slate leading-relaxed">
                  Expanded to 47+ countries with local currency payouts, multi-language support, and region-specific verification partners.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
                2025
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary! mb-2">Trust & Safety Platform</h3>
                <p className="text-slate leading-relaxed">
                  Launched automated fraud monitoring, enhanced dispute resolution with evidence windows, and the industry&apos;s first provider reputation portability framework.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Join the Do It community
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Whether you need it done or you can do it — we&apos;re here to make it safe, simple, and fair.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=client"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Post a Job
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/register?role=provider"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Become a Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}