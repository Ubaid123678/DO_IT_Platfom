'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, CheckCircle2, MapPin, ShieldCheck, Download, Image as ImageIcon } from 'lucide-react';
import { mockProviders } from '@/lib/public';

type Provider = (typeof mockProviders)[string];

function StarRating({ rating = 5, className = 'h-4 w-4', count = 0 }: { rating?: number; className?: string; count?: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${rating} out of 5 stars, ${count} reviews`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`${className} text-amber`}
            fill={i < rating ? 'currentColor' : 'none'}
            stroke="currentColor"
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      <span className="text-slate text-sm">({count} reviews)</span>
    </div>
  );
}

export default function ProviderProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-3xl font-bold text-primary! mb-4">Provider Not Found</h1>
          <Link href="/categories" className="text-primary hover:underline">
            Browse providers
          </Link>
        </div>
      </div>
    );
  }

  const provider = mockProviders[id] as Provider | undefined;

  if (!provider) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-3xl font-bold text-primary! mb-4">Provider Not Found</h1>
          <Link href="/categories" className="text-primary hover:underline">
            Browse providers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mist min-h-screen">
      {/* PROFILE HEADER BAND */}
      <section className="bg-mist border-b border-hairline" aria-labelledby="provider-name">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* LEFT: PROFILE PHOTO */}
            <div className="flex-shrink-0 lg:w-40">
              <div className="mx-auto lg:mx-0 h-40 w-40 lg:h-48 lg:w-48 rounded-full bg-primary-light flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-5xl lg:text-6xl font-bold text-primary">
                  {provider.avatarInitials}
                </span>
              </div>
            </div>

            {/* RIGHT: INFO & BADGES */}
            <div className="flex-1 text-center lg:text-left pt-4 lg:pt-0">
              <h1 id="provider-name" className="text-3xl lg:text-4xl font-extrabold text-primary!">
                {provider.fullName}
              </h1>

              <p className="mt-3 text-lg text-slate max-w-2xl mx-auto lg:mx-0">
                {provider.headline}
              </p>

              {/* BADGES ROW */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {/* IDENTITY VERIFIED BADGE */}
                {provider.verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Identity Verified
                  </span>
                )}

                {/* VERIFIED CATEGORY BADGES */}
                {provider.verifiedCategories.map((cat: Provider['verifiedCategories'][0]) => (
                  <span key={cat.slug} className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary border border-primary/20">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {cat.name}
                  </span>
                ))}
              </div>

              {/* RATING */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <StarRating rating={provider.rating} className="h-5 w-5" count={provider.reviewCount} />
              </div>

              {/* LOCATION */}
              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-slate">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>{provider.location}</span>
                </span>
              </div>

              {/* CONTACT VIA APP BUTTON */}
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  href="/download"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Contact via app"
                >
                  <span className="hidden sm:inline">Contact via App</span>
                  <span className="sm:hidden">Contact</span>
                </Link>
                <Link
                  href="/download"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Download App</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-10">
            {/* ABOUT SECTION */}
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-2xl font-bold text-primary! mb-4">About</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate leading-relaxed whitespace-pre-wrap">{provider.bio}</p>
              </div>
            </section>

            {/* SKILLS & CATEGORIES SECTION */}
            <section aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="text-2xl font-bold text-primary! mb-4">Verified Skills & Categories</h2>
              <div className="flex flex-wrap gap-3">
                {provider.verifiedCategories.flatMap((cat: Provider['verifiedCategories'][0]) =>
                  cat.skills.map((skill: string) => (
                    <span
                      key={`${cat.slug}-${skill}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate border border-hairline shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </section>

            {/* PORTFOLIO SECTION */}
            {provider.publicProfile && provider.portfolio.length > 0 && (
              <section aria-labelledby="portfolio-heading">
                <h2 id="portfolio-heading" className="text-2xl font-bold text-primary! mb-4">Portfolio</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {provider.portfolio.map((item: Provider['portfolio'][0], index: number) => (
                    <article key={index} className="group rounded-xl overflow-hidden bg-white border border-hairline shadow-sm hover:shadow-lg transition-shadow">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-slate line-clamp-2">{item.caption}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* REVIEWS SECTION */}
            <section aria-labelledby="reviews-heading">
              <div className="flex items-center justify-between mb-6">
                <h2 id="reviews-heading" className="text-2xl font-bold text-primary!">
                  Reviews ({provider.reviewCount})
                </h2>
              </div>
              <div className="space-y-6">
                {provider.reviews.map((review: Provider['reviews'][0], index: number) => (
                  <article
                    key={index}
                    className="p-6 rounded-2xl bg-white border border-hairline shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                        {review.author[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-ink">{review.author}</span>
                          <StarRating rating={review.rating} className="h-4 w-4" />
                        </div>
                        <p className="text-slate leading-relaxed">{review.text}</p>
                        <div className="mt-3 text-xs text-text-hint">{review.date}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR - DESKTOP ONLY */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* RATING SUMMARY CARD */}
              <div className="p-6 rounded-2xl bg-white border border-hairline shadow-sm">
                <h3 className="font-semibold text-primary! mb-4">Rating Summary</h3>
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-primary!">{provider.rating.toFixed(1)}</div>
                  <StarRating rating={provider.rating} className="h-6 w-6 mx-auto my-2 text-amber" count={provider.reviewCount} />
                  <p className="text-slate text-sm">Based on {provider.reviewCount} reviews</p>
                </div>

                {/* RATING BREAKDOWN */}
                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-8 font-semibold text-amber">{star}★</span>
                      <div className="flex-1 h-2 bg-mist rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.max(0, (provider.rating - (star - 1)) * 20)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-text-hint">
                        {Math.round(provider.reviewCount * Math.max(0, (provider.rating - (star - 1)) * 0.2))}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VERIFIED BADGE CARD */}
              <div className="p-6 rounded-2xl bg-primary-light border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-primary-dark">Verified Provider</span>
                </div>
                <p className="text-sm text-primary-dark">
                  Identity verified • {provider.verifiedCategories.length} category{provider.verifiedCategories.length !== 1 ? 's' : ''} verified
                </p>
              </div>

              {/* DOWNLOAD APP CTA */}
              <div className="p-6 rounded-2xl bg-primary text-white text-center">
                <h3 className="text-lg font-bold text-white! mb-2">Ready to hire?</h3>
                <p className="text-white/80 text-sm mb-4">Download the app to message providers and post jobs.</p>
                <Link
                  href="/download"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-white/90"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                  Download the App
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}