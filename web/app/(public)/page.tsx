'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Star, Globe, ArrowRight, ChevronRight } from 'lucide-react';
import {
  publicStats,
  valueProps,
  featuredCategories,
  howItWorksSteps,
  testimonials,
  icons,
} from '@/lib/public';

type IconName = keyof typeof icons;

function Icon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  const path = icons[name];
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function StarRating({ rating = 5, className = 'h-4 w-4' }: { rating?: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={className}
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'client' | 'provider'>('client');
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = testimonialsRef.current;
    if (!carousel) return;

    const rotateTestimonials = () => {
      const firstCard = carousel.firstElementChild as HTMLElement | null;
      if (!firstCard) return;

      const cardDistance = firstCard.getBoundingClientRect().width + 24;
      const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;

      if (atEnd) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: cardDistance, behavior: 'smooth' });
      }
    };

    const rotation = window.setInterval(rotateTestimonials, 4000);
    return () => window.clearInterval(rotation);
  }, []);

  return (
    <div className="bg-mist">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[rgba(13,31,30,0.6)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-40 lg:py-48">
          <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-tight text-white max-w-3xl">
            Get it done — by a verified pro.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            From home repairs to web development — find skilled, verified providers you can trust. Post a job in minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Post a Job
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Become a Provider
            </Link>
          </div>

          {/* STAT BAR */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 md:p-6">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8" role="list">
                <div className="text-center" role="listitem">
                  <dt className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    {publicStats.totalProviders.toLocaleString()}+
                  </dt>
                  <dd className="mt-1 text-sm text-white/70">Verified Providers</dd>
                </div>
                <div className="text-center border-l border-white/10 md:border-0" role="listitem">
                  <dt className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    {publicStats.jobsCompleted.toLocaleString()}+
                  </dt>
                  <dd className="mt-1 text-sm text-white/70">Jobs Completed</dd>
                </div>
                <div className="text-center border-l border-white/10 md:border-0" role="listitem">
                  <dt className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    {publicStats.countriesActive}+
                  </dt>
                  <dd className="mt-1 text-sm text-white/70">Countries Active</dd>
                </div>
                <div className="text-center border-l border-white/10 md:border-0" role="listitem">
                  <dt className="flex items-center justify-center gap-1.5 text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    {publicStats.averageRating}
                    <Star className="h-6 w-6 text-amber" aria-hidden="true" fill="currentColor" />
                  </dt>
                  <dd className="mt-1 text-sm text-white/70">Average Rating</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS SECTION */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="value-props-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="value-props-heading" className="mb-10 text-center text-3xl md:text-4xl font-extrabold text-primary!">Why Choose Do It</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {valueProps.map((prop) => (
              <article
                key={prop.title}
                className="text-center p-6 md:p-8 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon name={prop.icon as IconName} className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-primary!">{prop.title}</h3>
                <p className="mt-3 text-slate">{prop.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <h2 id="categories-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">Browse Categories</h2>
              <p className="mt-2 text-slate">Explore verified providers across physical trades and digital skills.</p>
            </div>
            <Link
              href="/categories"
              className="flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              View All Categories
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCategories.slice(0, 4).map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center text-center p-6 rounded-2xl border border-hairline bg-white transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon name={category.icon as IconName} className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-primary! group-hover:text-primary transition-colors">{category.name}</h3>
                <p className="mt-1 text-sm text-slate">{category.providerCount.toLocaleString()} verified providers</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SUMMARY */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="how-it-works-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="how-it-works-heading" className="text-center text-3xl md:text-4xl font-extrabold text-primary! mb-4">How Do It Works</h2>
          <p className="text-center text-slate mb-10 max-w-2xl mx-auto">Two simple journeys — pick the one that&apos;s you.</p>

          <div className="mb-10" role="tablist" aria-label="How it works for">
            <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 border border-hairline" role="group">
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

          <div role="tabpanel" id={activeTab === 'client' ? 'client-panel' : 'provider-panel'} aria-labelledby={activeTab === 'client' ? 'client-tab' : 'provider-tab'}>
            <div className="grid gap-6 md:grid-cols-4">
              {howItWorksSteps[activeTab].map((step) => (
                <article
                  key={step.number}
                  className="relative p-6 rounded-2xl bg-white border border-hairline"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-extrabold text-xl">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-primary! mb-2">{step.title}</h3>
                  <p className="text-slate text-sm">{step.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              See full journey
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="testimonials-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="testimonials-heading" className="text-center text-3xl md:text-4xl font-extrabold text-primary! mb-10">What People Say</h2>
          <div ref={testimonialsRef} className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6 scrollbar-hide" role="list" aria-label="Customer testimonials">
            {testimonials.map((testimonial, index) => (
              <article
                key={index}
                className="flex-none w-80 md:w-96 snap-center p-6 rounded-2xl bg-white border border-hairline shadow-sm"
                role="listitem"
              >
                <StarRating rating={testimonial.rating} className="h-5 w-5 text-amber" />
                <blockquote className="mt-4 text-slate leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                <footer className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{testimonial.author}</p>
                    <p className="text-sm text-slate">{testimonial.role}</p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* APP DOWNLOAD CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="download-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="lg:w-1/2">
              <h2 id="download-heading" className="text-3xl md:text-4xl font-extrabold text-white">Take Do It with you</h2>
              <p className="mt-4 text-white/80 text-lg">Post jobs, chat with providers, track escrow — all from your phone.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-primary font-semibold transition-colors hover:bg-white/90"
                  aria-label="Download on the App Store"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-slate">Available on the</span>
                    <span className="block text-base">App Store</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-primary font-semibold transition-colors hover:bg-white/90"
                  aria-label="Get it on Google Play"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 7.2l1.7 5.4H9.6l1.7-5.4H12.9m4.7 5.4c0 2.4-.8 4.4-2.4 5.9 1.3.2 2.7.7 4.1 1.5-1.2 1.8-3 2.9-5.2 2.9-4.5 0-7.9-3.7-7.9-8.3s3.4-8.3 7.9-8.3c2.2 0 4 .8 5.2 2.6-1.3-1.2-2.8-1.7-4.1-1.5.1-1.5.9-3.5 2.4-5.9H5.6v4.3h12z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-slate">Get it on</span>
                    <span className="block text-base">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative w-56 h-56 md:w-64 md:h-64">
                <div className="absolute inset-0 rounded-2xl bg-white/10 border border-white/20" />
                <div className="absolute inset-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="mx-auto mb-4 h-24 w-24 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
                      <Globe className="h-12 w-12 text-white/50" aria-hidden="true" />
                    </div>
                    <p className="text-white/70 text-sm">QR Code</p>
                    <p className="text-white/40 text-xs mt-1">Scan to download</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}