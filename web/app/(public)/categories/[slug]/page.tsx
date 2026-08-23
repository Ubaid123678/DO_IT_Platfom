'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { allCategories, icons } from '@/lib/public';
import { categorySkills } from '@/lib/category-details';

function Icon({ name, className = 'h-6 w-6' }: { name: keyof typeof icons; className?: string }) {
  const path = icons[name];
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// Mock provider data
const mockProviders = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    avatar: 'SM',
    verified: true,
    rating: 4.9,
    reviewCount: 127,
    headline: 'Licensed master plumber with 15+ years experience. Specializing in bathroom remodels and emergency repairs.',
    responseTime: 'Usually responds within 1 hour',
  },
  {
    id: '2',
    name: 'Marcus Chen',
    avatar: 'MC',
    verified: true,
    rating: 4.8,
    reviewCount: 89,
    headline: 'Residential & commercial plumbing expert. Tankless water heater specialist. Clear pricing, no surprises.',
    responseTime: 'Usually responds within 2 hours',
  },
  {
    id: '3',
    name: 'James Rodriguez',
    avatar: 'JR',
    verified: true,
    rating: 4.9,
    reviewCount: 203,
    headline: 'Family-owned plumbing business since 1985. Drain cleaning, sewer repair, and pipe replacement.',
    responseTime: 'Usually responds within 30 min',
  },
  {
    id: '4',
    name: 'Aisha Patel',
    avatar: 'AP',
    verified: true,
    rating: 4.7,
    reviewCount: 156,
    headline: 'Eco-friendly plumbing solutions. Water filtration, low-flow fixtures, and green building certified.',
    responseTime: 'Usually responds within 1 hour',
  },
  {
    id: '5',
    name: 'David Thompson',
    avatar: 'DT',
    verified: true,
    rating: 4.8,
    reviewCount: 94,
    headline: '24/7 emergency plumber. Burst pipes, water heater failures, and sewer backups. Licensed & insured.',
    responseTime: 'Usually responds within 15 min',
  },
  {
    id: '6',
    name: 'Lisa Nguyen',
    avatar: 'LN',
    verified: true,
    rating: 4.9,
    reviewCount: 178,
    headline: 'Bathroom and kitchen remodel specialist. From concept to completion — design, permits, and installation.',
    responseTime: 'Usually responds within 2 hours',
  },
];

export default function CategoryPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  if (!slug) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-3xl font-bold text-primary! mb-4">Category Not Found</h1>
          <Link href="/categories" className="text-primary hover:underline">
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  const category = allCategories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-3xl font-bold text-primary! mb-4">Category Not Found</h1>
          <Link href="/categories" className="text-primary hover:underline">
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  const categorySubcategories = categorySkills[slug] || [];

  // Deterministic stats based on slug (avoids Math.random)
  const slugHash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const stats = {
    providers: (slugHash % 500) + 200,
    rating: (4.5 + (slugHash % 10) * 0.05).toFixed(1),
    startingPrice: (slugHash % 100) + 50,
  };

  return (
    <div className="bg-mist">
      {/* BREADCRUMB */}
      <nav className="py-4 bg-white border-b border-hairline" aria-label="Breadcrumb">
        <div className="mx-auto max-w-7xl px-6">
          <ol className="flex items-center gap-2 text-sm text-slate" role="list">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/categories" className="hover:text-primary transition-colors">Categories</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-primary! font-medium truncate max-w-xs" aria-current="page">{category.name}</li>
          </ol>
        </div>
      </nav>

      {/* HERO BAND */}
      <section className="bg-primary-light py-12 md:py-16" aria-labelledby="category-title">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="lg:w-24 flex-shrink-0">
              <div className="mx-auto lg:mx-0 h-24 w-24 rounded-2xl bg-primary flex items-center justify-center">
                <Icon name={category.icon as keyof typeof icons} className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 id="category-title" className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary!">
                {category.name}
              </h1>
              <p className="mt-4 text-lg text-slate max-w-2xl mx-auto lg:mx-0">
                {category.description}
              </p>

              {/* TRUST-SIGNAL STAT ROW */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 border border-hairline">
                  <Icon name="CheckCircle2" className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-primary!">{stats.providers}+ Verified Providers</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 border border-hairline">
                  <Star className="h-5 w-5 text-amber fill-current" aria-hidden="true" />
                  <span className="font-semibold text-primary!">★ {stats.rating} Avg Rating</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 border border-hairline">
                  <Icon name="Wallet" className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-primary!">Starting from ${stats.startingPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA ROW */}
      <section className="py-8 bg-white border-b border-hairline" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <h2 id="cta-heading" className="text-xl font-extrabold text-primary!">Ready to get started?</h2>
          <Link
            href="/register?role=client"
            className="flex-1 sm:flex-none text-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Post a Job in this Category
          </Link>
          <Link
            href={`/providers?category=${slug}`}
            className="flex-1 sm:flex-none text-center rounded-xl border-2 border-primary px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Browse All Providers
          </Link>
        </div>
      </section>

      {/* SUBCATEGORY CHIPS */}
      {categorySubcategories.length > 0 && (
        <section className="py-12 bg-mist" aria-labelledby="subcat-heading">
          <div className="mx-auto max-w-7xl px-6">
            <h2 id="subcat-heading" className="mb-6 text-center text-2xl font-extrabold text-primary!">Services and skills</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {categorySubcategories.map((subcat: string) => (
                <Link
                  key={subcat}
                  href={`/categories/${slug}?subcategory=${encodeURIComponent(subcat)}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate hover:bg-primary-light hover:text-primary border border-hairline transition-colors"
                >
                  {subcat}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SAMPLE PROVIDERS SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="providers-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="providers-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Top Providers in {category.name}
            </h2>
            <p className="mt-4 text-slate">
              Verified professionals ready to help with your {category.name.toLowerCase()} needs.
            </p>
          </header>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {mockProviders.map((provider) => (
              <article
                key={provider.id}
                className="group p-6 rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-lg hover:border-primary transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-14 w-14 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
                    {provider.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-primary! truncate">{provider.name}</h3>
                      {provider.verified && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber fill-current" aria-hidden="true" />
                      <span className="font-medium text-primary!">{provider.rating}</span>
                      <span className="text-slate text-sm">({provider.reviewCount} reviews)</span>
                    </div>
                    <p className="mt-3 text-sm text-slate line-clamp-2">{provider.headline}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-text-hint">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{provider.responseTime}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-hairline">
                  <Link
                    href={`/providers/${provider.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    View Profile
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href={`/providers?category=${slug}`}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              View All {category.name} Providers
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="bottom-cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="bottom-cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Can&apos;t find the right provider?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Post a job and get matched automatically with verified {category.name.toLowerCase()} professionals.
          </p>
          <div className="mt-10">
            <Link
              href="/register?role=client"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Post a Job Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}