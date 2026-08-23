'use client';

import Link from 'next/link';
import { Download, Mail, FileText, Image, Palette, Monitor, ChevronRight } from 'lucide-react';

const brandAssets = [
  {
    id: 'logo-pack',
    title: 'Logo Pack',
    description: 'Primary, secondary, and icon variants in full color, monochrome, and reversed.',
    formats: ['SVG', 'PNG'],
    icon: Image,
  },
  {
    id: 'brand-colors',
    title: 'Brand Colors',
    description: 'Official color palette with hex, RGB, and CMYK values for print and digital.',
    formats: ['PDF', 'ASE'],
    icon: Palette,
  },
  {
    id: 'product-screenshots',
    title: 'Product Screenshots',
    description: 'High-resolution app and web screenshots for key flows (home, job posting, provider profile).',
    formats: ['PNG', 'ZIP'],
    icon: Monitor,
  },
];

export default function PressPage() {
  return (
    <div className="bg-mist">
      {/* PAGE HEADER */}
      <section className="py-16 md:py-24 bg-white border-b border-hairline" aria-labelledby="page-title">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 id="page-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
            Press
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate max-w-2xl mx-auto">
            Resources for journalists and media covering Do It.
          </p>
        </div>
      </section>

      {/* COMPANY BOILERPLATE */}
      <section className="py-16 md:py-20 bg-mist" aria-labelledby="boilerplate-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-10">
            <h2 id="boilerplate-heading" className="sr-only">Company Boilerplate</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary mb-4 block w-fit mx-auto">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Company Boilerplate
            </span>
          </header>

          <div className="mx-auto max-w-3xl">
            <blockquote className="border-l-4 border-primary pl-6 md:pl-8 py-4 bg-white rounded-r-xl">
              <p className="text-primary! leading-relaxed font-mono text-base md:text-lg">
                &ldquo;Do It is a verified marketplace connecting people who need jobs done with skilled providers &mdash; backed by identity verification, skill validation, and escrow protection so every job is safe, fair, and transparent.&rdquo;
              </p>
            </blockquote>
            <p className="mt-4 text-center text-sm text-slate">
              <span className="font-medium">Last updated:</span> January 2025
            </p>
          </div>
        </div>
      </section>

      {/* BRAND ASSETS / PRESS KIT */}
      <section className="py-16 md:py-24 bg-white border-y border-hairline" aria-labelledby="assets-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="assets-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Press Kit & Brand Assets
            </h2>
            <p className="mt-4 text-slate">
              Approved assets for editorial use. All files are downloadable in high resolution.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {brandAssets.map((asset) => (
              <article
                key={asset.id}
                className="group p-6 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-md hover:border-primary transition-all duration-200"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <asset.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-1">{asset.title}</h3>
                <p className="text-slate text-sm mb-4 leading-relaxed">{asset.description}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {asset.formats.map((format) => (
                    <span
                      key={format}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {format}
                    </span>
                  ))}
                </div>
                <Link
                  href={`#${asset.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Download
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/press/kit.zip"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary-light hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Download className="h-5 w-5" aria-hidden="true" />
              Download Full Press Kit (ZIP)
            </Link>
          </div>
        </div>
      </section>

      {/* MEDIA CONTACT SECTION */}
      <section className="py-16 md:py-20 bg-mist" aria-labelledby="contact-heading">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl">
            <div className="bg-white border border-hairline rounded-2xl p-8 md:p-12 text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-14 w-14 rounded-xl bg-primary-light flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-primary! mb-3">
                Press Inquiries
              </h2>
              <p className="text-slate mb-6">
                We&apos;re happy to help with story ideas, fact-checking, interview requests, and asset requests.
              </p>

              <div className="mb-6 p-5 rounded-xl bg-primary-light border border-primary/20 text-left">
                <p className="font-semibold text-primary-dark mb-2">Email:</p>
                <p className="text-primary mb-2">
                  <a href="mailto:press@doit.com" className="font-mono text-primary hover:underline">
                    press@doit.com
                  </a>
                </p>
                <p className="text-sm text-primary/80">
                  We typically respond within 24&ndash;48 hours.
                </p>
              </div>

              <p className="text-slate text-sm">
                For urgent safety-related inquiries, please use our{' '}
                <Link href="/help/report" className="text-primary hover:underline">
                  Report a Safety Issue
                </Link>
                {' '}form instead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Writing about Do It?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            We&apos;d love to help. Get in touch and we&apos;ll get you everything you need.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:press@doit.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email Press Team
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