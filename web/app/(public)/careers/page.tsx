'use client';

import Link from 'next/link';
import { ShieldCheck, Scale, CheckCircle2, Briefcase, MapPin, ChevronRight, Mail } from 'lucide-react';

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust First',
    description: 'Every decision starts with earning and keeping the trust of our community.',
  },
  {
    icon: Scale,
    title: 'Fair for Everyone',
    description: 'Clients and providers win together — transparent fees, escrow protection, equal voice.',
  },
  {
    icon: CheckCircle2,
    title: 'Verified, Always',
    description: 'Quality isn\'t optional. Every provider, every skill, every interaction is verified.',
  },
];

// Mock open roles data - replace with real data
const openRoles = [
  {
    id: '1',
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
  },
  {
    id: '3',
    title: 'Trust & Safety Operations Lead',
    department: 'Operations',
    location: 'Remote (Americas)',
    type: 'Full-time',
  },
  {
    id: '4',
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
  },
  {
    id: '5',
    title: 'Community Operations Associate',
    department: 'Operations',
    location: 'Remote (Global)',
    type: 'Contract',
  },
];

const hiringSteps = [
  {
    number: 1,
    title: 'Apply',
    description: 'Submit your resume and a short note on why Do It resonates with you. We read every application.',
  },
  {
    number: 2,
    title: 'Conversation',
    description: 'A friendly 30-min call with the hiring manager to explore mutual fit — values, craft, and impact.',
  },
  {
    number: 3,
    title: 'Deep Dive',
    description: 'A practical exercise or portfolio review relevant to the role. Collaborative, not adversarial.',
  },
  {
    number: 4,
    title: 'Offer',
    description: 'We move fast. Competitive package, equity, and a culture where your work genuinely matters.',
  },
];

export default function CareersPage() {
  return (
    <div className="bg-mist">
      {/* PAGE HEADER */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-primary-light" />
        <div className="absolute inset-0 bg-[rgba(13,31,30,0.05)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-32 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 id="hero-title" className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-tight text-primary!">
              Help us connect people who need it done with people who can do it.
            </h1>
<p className="mt-6 text-lg md:text-xl text-slate max-w-2xl mx-auto leading-relaxed">
              We&apos;re building a marketplace where trust is the default, not the exception. Join a mission-driven team that values transparency, fairness, and craftsmanship.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="values-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="values-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              How We Work
            </h2>
<p className="mt-4 text-slate">
              Our values aren&apos;t wall art &mdash; they&apos;re how we build, hire, and ship every day.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value, index) => (
              <article
                key={index}
                className="p-6 md:p-8 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-md hover:border-primary transition-all duration-200"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <value.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-2">{value.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN ROLES SECTION */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="roles-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="roles-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Open Positions
            </h2>
            <p className="mt-4 text-slate">
              We&apos;re looking for curious, craft-obsessed people to help us scale trust.
            </p>
          </header>

          {openRoles.length > 0 ? (
            <div className="space-y-4" role="list" aria-label="Open positions">
              {openRoles.map((role) => (
                <article
                  key={role.id}
                  className="group p-6 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-md hover:border-primary hover:-translate-y-0.5 transition-all duration-200"
                  role="listitem"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary! group-hover:text-primary transition-colors">
                        {role.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
                          <Briefcase className="h-3 w-3" aria-hidden="true" />
                          {role.department}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-light px-2.5 py-0.5 text-xs font-medium text-amber">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {role.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-0.5 text-xs font-medium text-success">
                          {role.type}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/careers/${role.id}`}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      View Role
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            // EMPTY STATE
            <div className="text-center py-16">
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary-light flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-primary! mb-3">
                No open positions right now
              </h2>
              <p className="text-slate mb-8 max-w-md mx-auto">
                Check back soon &mdash; we&apos;re always looking for great people. Or reach out anyway if you think you&apos;d be a great fit.
              </p>
              <Link
                href="/help/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* HOW WE HIRE SECTION */}
      <section className="py-16 md:py-24 bg-white border-y border-hairline" aria-labelledby="hiring-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="hiring-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              How We Hire
            </h2>
            <p className="mt-4 text-slate">
              A transparent, respectful process — no puzzle questions, no ghosting.
            </p>
          </header>

          <div className="space-y-12 md:space-y-16">
            {hiringSteps.map((step) => (
              <article key={step.number} className="relative mx-auto max-w-2xl">
                <div className="relative min-h-32 rounded-2xl border border-hairline bg-white p-6 pl-20 shadow-sm">
                  <div
                    className="absolute left-3 top-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white sm:left-[-28px]"
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-primary! mb-2">{step.title}</h3>
                  <p className="text-sm text-slate leading-relaxed">{step.description}</p>
                </div>
              </article>
            ))}
            </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Don&apos;t see the right role?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            We&apos;re always open to hearing from exceptional people. Tell us what you do and why Do It matters to you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:careers@doit.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email Us
            </a>
            <Link
              href="/help/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Contact Form
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}