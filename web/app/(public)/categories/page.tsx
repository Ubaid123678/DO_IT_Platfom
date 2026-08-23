'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { allCategories, icons } from '@/lib/public';

type CategoryType = 'all' | 'physical' | 'digital';

function Icon({ name, className = 'h-6 w-6' }: { name: keyof typeof icons; className?: string }) {
  const path = icons[name];
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryType>('all');

  const filteredCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || cat.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const filterOptions: { value: CategoryType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'physical', label: 'Physical Trades' },
    { value: 'digital', label: 'Digital Skills' },
  ];

  return (
    <div className="bg-mist">
      {/* PAGE HEADER */}
      <section className="py-16 md:py-20 bg-white border-b border-hairline" aria-labelledby="page-title">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-3xl mx-auto mb-10">
            <h1 id="page-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
              Explore Categories
            </h1>
            <p className="mt-4 text-lg text-slate">
              From home repairs to web development — find a verified pro for any job.
            </p>
          </header>

          {/* SEARCH BAR */}
          <div className="mx-auto max-w-xl mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 text-text-hint -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-hairline bg-white text-base text-ink placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                aria-label="Search categories"
              />
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter categories by type">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  activeFilter === option.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-slate hover:bg-mist hover:text-ink border border-hairline'
                }`}
                aria-pressed={activeFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY GRID */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="grid-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="grid-heading" className="sr-only">
            Category Grid
          </h2>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-hairline shadow-sm transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon name={category.icon as keyof typeof icons} className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary! group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate">
                    {category.subcategoryCount} subcategories
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate">No categories match your search.</p>
              </div>
            )}
          </div>

          {/* SIDE NOTE SECTION */}
          <div className="mt-16 text-center">
            <p className="text-slate">
              Don&apos;t see your category?{' '}
              <Link
                href="/help/contact"
                className="text-primary font-medium hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}