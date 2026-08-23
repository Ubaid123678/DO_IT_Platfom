'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MapPin, Search, Star } from 'lucide-react';
import { allCategories, mockProviders } from '@/lib/public';

type Provider = (typeof mockProviders)[string];
const providers = Object.values(mockProviders);
const categoryOptions = allCategories.filter((category) =>
  providers.some((provider) => provider.verifiedCategories.some((item) => item.slug === category.slug))
);

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-hairline bg-white p-6 shadow-sm transition-shadow hover:border-primary hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-light text-xl font-extrabold text-primary">
          {provider.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/providers/${provider.id}`} className="group">
            <h2 className="truncate text-xl font-extrabold text-primary! group-hover:underline">{provider.fullName}</h2>
          </Link>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-current text-amber" aria-hidden="true" />
            <span className="font-semibold text-ink">{provider.rating.toFixed(1)}</span>
            <span className="text-slate">({provider.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-slate">{provider.headline}</p>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate">
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {provider.location}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {provider.verifiedCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {category.name}
          </Link>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <Link href={`/providers/${provider.id}`} className="inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
          View Profile
        </Link>
      </div>
    </article>
  );
}

function ProvidersPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(
    requestedCategory && categoryOptions.some((category) => category.slug === requestedCategory)
      ? requestedCategory
      : 'all'
  );

  const filteredProviders = providers.filter((provider) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [provider.fullName, provider.headline, provider.location]
      .concat(provider.verifiedCategories.flatMap((category) => [category.name, ...category.skills]))
      .some((value) => value.toLowerCase().includes(query));
    const matchesCategory = activeCategory === 'all' || provider.verifiedCategories.some((category) => category.slug === activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-mist">
      <section className="border-b border-hairline bg-white py-16 md:py-20" aria-labelledby="providers-title">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Verified professionals</p>
          <h1 id="providers-title" className="mt-3 text-4xl font-extrabold leading-tight text-primary! md:text-5xl">Find a Provider</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate">Browse trusted providers by skill, category, and location.</p>
          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-hint" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search providers or skills..."
              aria-label="Search providers or skills"
              className="h-12 w-full rounded-xl border border-hairline bg-white pl-12 pr-4 text-base text-ink placeholder:text-text-hint focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16" aria-labelledby="provider-results-heading">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2 id="provider-results-heading" className="text-2xl font-extrabold text-primary! md:text-3xl">Available Providers</h2>
            <p className="text-sm text-slate">{filteredProviders.length} provider{filteredProviders.length === 1 ? '' : 's'} found</p>
          </div>
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter providers by category">
            <button onClick={() => setActiveCategory('all')} className={`rounded-full border px-4 py-2 text-sm font-semibold ${activeCategory === 'all' ? 'border-primary bg-primary text-white' : 'border-hairline bg-white text-slate hover:border-primary hover:text-primary'}`}>
              All Categories
            </button>
            {categoryOptions.map((category) => (
              <button key={category.slug} onClick={() => setActiveCategory(category.slug)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${activeCategory === category.slug ? 'border-primary bg-primary text-white' : 'border-hairline bg-white text-slate hover:border-primary hover:text-primary'}`}>
                {category.name}
              </button>
            ))}
          </div>
          {filteredProviders.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProviders.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-hairline bg-white px-6 py-16 text-center">
              <h3 className="text-xl font-bold text-primary!">No providers found</h3>
              <p className="mt-2 text-slate">Try another name, skill, or category.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mist" />}>
      <ProvidersPageContent />
    </Suspense>
  );
}
