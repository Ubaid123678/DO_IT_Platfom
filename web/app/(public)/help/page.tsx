'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, AlertTriangle, Download, ChevronRight, LifeBuoy, MessageCircle, ShieldCheck, Sparkles, Briefcase, CreditCard, UserCog } from 'lucide-react';

const quickLinks = [
  {
    icon: BookOpen,
    label: 'Browse FAQ',
    description: 'Search answers to common questions',
    href: '/help/faq',
  },
  {
    icon: LifeBuoy,
    label: 'Contact Us',
    description: 'Get in touch with our support team',
    href: '/help/contact',
  },
  {
    icon: Briefcase,
    label: 'About Us',
    description: 'Learn more about Do It and our mission',
    href: '/about',
  },
  {
    icon: AlertTriangle,
    label: 'Report a Safety Issue',
    description: 'Report concerns confidentially',
    href: '/help/report',
  },
  {
    icon: Download,
    label: 'Download the App',
    description: 'Full support features in-app',
    href: '/download',
  },
];

const popularTopics = [
  { title: 'How do I post a job?', href: '/help/faq#post-job' },
  { title: 'How does escrow protect me?', href: '/help/faq#escrow' },
  { title: 'How do I verify my skills?', href: '/help/faq#skill-verification' },
  { title: 'What if something goes wrong?', href: '/help/faq#disputes' },
  { title: 'How do payouts work for providers?', href: '/help/faq#payouts' },
  { title: 'Account & profile settings', href: '/help/faq#account' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="bg-mist min-h-screen">
      {/* PAGE HEADER WITH SEARCH */}
      <section className="py-16 md:py-24 bg-white border-b border-hairline" aria-labelledby="help-title">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 id="help-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
            Help Center
          </h1>
          <p className="mt-4 text-lg text-slate max-w-xl mx-auto">
            Find answers, get support, or report an issue — we&apos;re here to help.
          </p>

          {/* LARGE SEARCH BAR */}
          <div className="mt-10 mx-auto max-w-2xl">
            <form className="relative" role="search" aria-label="Search help articles">
              <Search className="absolute left-5 top-1/2 h-6 w-6 text-text-hint -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                placeholder="How can we help?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-14 pr-4 text-lg text-ink placeholder:text-text-hint rounded-xl border border-hairline bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                aria-label="Search help articles"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
            <p className="mt-3 text-sm text-text-hint">Try keywords like &ldquo;escrow,&rdquo; &ldquo;verification,&rdquo; &ldquo;payout&rdquo;</p>
          </div>
        </div>
      </section>

      {/* QUICK LINK CARDS */}
      <section className="py-16 md:py-20 bg-mist" aria-labelledby="quick-links-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="quick-links-heading" className="sr-only">Quick Links</h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="group p-6 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all duration-200"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <link.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-primary! mb-1 group-hover:text-primary transition-colors">{link.label}</h3>
                <p className="text-sm text-slate">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR TOPICS */}
      <section className="py-16 md:py-20 bg-white border-y border-hairline" aria-labelledby="popular-heading">
        <div className="mx-auto max-w-3xl px-6">
          <header className="mb-10">
            <h2 id="popular-heading" className="text-2xl md:text-3xl font-extrabold text-primary!">
              Popular Topics
            </h2>
            <p className="mt-2 text-slate">Most frequently asked questions</p>
          </header>

          <div className="space-y-3" role="list" aria-label="Popular help topics">
            {popularTopics.map((topic, index) => (
              <Link
                key={index}
                href={topic.href}
                className="group flex items-center justify-between gap-4 p-4 rounded-xl bg-mist border border-hairline hover:bg-primary-light hover:border-primary transition-colors"
                role="listitem"
              >
                <span className="text-slate group-hover:text-primary transition-colors">{topic.title}</span>
                <ChevronRight className="flex-shrink-0 h-5 w-5 text-text-hint group-hover:text-primary transition-colors" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/help/faq"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              View all FAQ articles
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY SECTIONS */}
      <section className="py-16 md:py-20 bg-mist" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="categories-heading" className="text-2xl md:text-3xl font-extrabold text-primary!">
              Browse by Category
            </h2>
            <p className="mt-2 text-slate">Find help for specific areas</p>
          </header>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Getting Started', icon: Sparkles, description: 'Account setup, first job, first gig', href: '/help/faq#getting-started' },
              { title: 'For Clients', icon: BookOpen, description: 'Posting jobs, hiring, escrow, reviews', href: '/help/faq#for-clients' },
              { title: 'For Providers', icon: Briefcase, description: 'Verification, proposals, payouts, reputation', href: '/help/faq#for-providers' },
              { title: 'Trust & Safety', icon: ShieldCheck, description: 'Verification, disputes, reporting, fraud', href: '/help/faq#trust-safety' },
              { title: 'Payments & Billing', icon: CreditCard, description: 'Fees, refunds, payment methods, invoices', href: '/help/faq#payments' },
              { title: 'Account & Privacy', icon: UserCog, description: 'Profile, settings, data, deletion', href: '/help/faq#account' },
            ].map((cat, index) => (
              <Link
                key={index}
                href={cat.href}
                className="group p-6 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all duration-200"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <cat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-primary! mb-1 group-hover:text-primary transition-colors">{cat.title}</h3>
                <p className="text-sm text-slate">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM BANNER */}
      <section className="py-12 md:py-16 bg-mist" aria-labelledby="app-banner-heading">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative rounded-2xl bg-white border border-hairline p-6 md:p-8 lg:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary-light flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
              </div>
              <h2 id="app-banner-heading" className="text-2xl md:text-3xl font-extrabold text-primary! mb-3">
                Have an account?
              </h2>
              <p className="text-slate mb-8 max-w-md mx-auto">
                Get richer support in the app — ticket history, live chat, and faster responses all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  Download the App
                </Link>
                <Link
                  href="/help/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Contact Support
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}