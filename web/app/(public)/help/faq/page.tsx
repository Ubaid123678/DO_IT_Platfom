'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { faqCategories, faqs } from '@/lib/public';

type FAQ = (typeof faqs)[0];

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: (id: string) => void }) {
  return (
    <details
      className="group bg-white border border-hairline rounded-xl overflow-hidden"
      open={isOpen}
      onToggle={() => onToggle(faq.id)}
    >
      <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <h3 className="font-semibold text-primary! pr-8">{faq.question}</h3>
        <svg
          className={`flex-shrink-0 h-5 w-5 text-text-hint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
        <p className="text-slate leading-relaxed">{faq.answer}</p>
      </div>
    </details>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set());

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, FAQ[]> = {};
    filteredFaqs.forEach((faq) => {
      if (!groups[faq.category]) groups[faq.category] = [];
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFaqs]);

  const toggleFaq = (id: string) => {
    const newOpen = new Set(openFaqs);
    if (newOpen.has(id)) newOpen.delete(id);
    else newOpen.add(id);
    setOpenFaqs(newOpen);
  };

  const hasResults = filteredFaqs.length > 0;

  const renderCategorySections = () => {
    return faqCategories.map((cat) => {
      const categoryFaqs = groupedFaqs[cat.slug] || [];
      if (categoryFaqs.length === 0) return null;
      return (
        <section key={cat.slug} className="mb-12" aria-labelledby={`cat-${cat.slug}`}>
          <h2 id={`cat-${cat.slug}`} className="text-xl font-bold text-primary! mb-6 flex items-center gap-2 pb-2 border-b border-hairline">
            {cat.name}
          </h2>
          <div className="space-y-2" role="list" aria-label={`${cat.name} FAQs`}>
            {categoryFaqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} isOpen={openFaqs.has(faq.id)} onToggle={toggleFaq} />
            ))}
          </div>
        </section>
      );
    });
  };

  const renderFlatList = () => {
    return (
      <div className="space-y-2" role="list" aria-label="FAQs">
        {filteredFaqs.map((faq) => (
          <FAQItem key={faq.id} faq={faq} isOpen={openFaqs.has(faq.id)} onToggle={toggleFaq} />
        ))}
      </div>
    );
  };

  const renderNoResults = () => {
    return (
      <div className="text-center py-20">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-mist flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-primary! mb-3">No results found</h2>
        <p className="text-slate mb-8 max-w-md mx-auto">
          We couldn&apos;t find any FAQs matching your search. Try different keywords or browse all categories.
        </p>
        <Link
          href="/help/contact"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Contact Support
        </Link>
      </div>
    );
  };

  return (
    <div className="bg-mist min-h-screen">
      {/* PAGE HEADER */}
      <section className="py-12 md:py-16 bg-white border-b border-hairline" aria-labelledby="faq-title">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-3xl mx-auto mb-10">
            <h1 id="faq-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-slate">
              Search or browse categories to find answers fast.
            </p>
          </header>

          {/* SEARCH BAR */}
          <div className="mx-auto max-w-3xl">
            <form className="relative" role="search" aria-label="Search FAQs">
              <svg className="absolute left-5 top-1/2 h-6 w-6 text-text-hint -translate-y-1/2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-4 text-lg text-ink placeholder:text-text-hint rounded-xl border border-hairline bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                aria-label="Search FAQs"
              />
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* CATEGORY SIDEBAR */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-primary-light text-primary'
                    : 'text-slate hover:bg-mist hover:text-primary'
                }`}
                aria-pressed={activeCategory === 'all'}
              >
                All Categories
              </button>
              {faqCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeCategory === cat.slug
                      ? 'bg-primary-light text-primary'
                      : 'text-slate hover:bg-mist hover:text-primary'
                  }`}
                  aria-pressed={activeCategory === cat.slug}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* FAQ LIST */}
          <div className="lg:col-span-3">
            {hasResults ? (
              activeCategory === 'all' ? (
                renderCategorySections()
              ) : (
                renderFlatList()
              )
            ) : (
              renderNoResults()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}