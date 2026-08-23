'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { faqs, faqCategories } from '@/lib/public';

export default function FAQArticlePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const faq = faqs.find((f) => f.id === id);

  const [helpful, setHelpful] = useState<'up' | 'down' | null>(null);
  const helpfulCount = 127; // mock count

  if (!faq) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Link href="/help/faq" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to FAQ
          </Link>
          <h1 className="text-3xl font-bold text-primary! mb-4">FAQ Not Found</h1>
          <Link href="/help/faq" className="text-primary hover:underline">
            Browse all FAQs
          </Link>
        </div>
      </div>
    );
  }

  const category = faqCategories.find((c) => c.slug === faq.category)!;
  const relatedFaqs = faqs
    .filter((f) => f.category === faq.category && f.id !== faq.id)
    .slice(0, 4);

  const handleHelpful = (vote: 'up' | 'down') => {
    setHelpful(vote);
    // In real app: call API to record vote
  };

  return (
    <div className="bg-mist min-h-screen">
      {/* BREADCRUMB */}
      <nav className="py-4 bg-white border-b border-hairline" aria-label="Breadcrumb">
        <div className="mx-auto max-w-3xl px-6">
          <ol className="flex items-center gap-2 text-sm text-slate flex-wrap" role="list">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/help/faq" className="hover:text-primary transition-colors">FAQ</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-primary! font-medium truncate max-w-xs" aria-current="page">{faq.question}</li>
          </ol>
        </div>
      </nav>

      <main className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-3xl px-6">
          {/* ARTICLE CARD */}
          <article className="bg-white border border-hairline rounded-2xl p-8 md:p-12 shadow-sm">
            {/* CATEGORY TAG */}
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-primary-light text-primary border border-primary/20 mb-6">
              {category.name}
            </span>

            {/* QUESTION AS H1 */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight text-primary! mb-8">
              {faq.question}
            </h1>

            {/* ANSWER BODY */}
            <div className="prose prose-slate max-w-none prose-lg text-slate leading-relaxed">
              <div className="whitespace-pre-wrap">{faq.answer}</div>
            </div>

            {/* "WAS THIS HELPFUL?" WIDGET */}
            <div className="mt-12 pt-8 border-t border-hairline">
              <p className="font-medium text-primary! mb-4">Was this helpful?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleHelpful('up')}
                  disabled={helpful !== null}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-colors ${
                    helpful === 'up'
                      ? 'bg-primary border-primary text-white'
                      : 'border-primary/30 text-primary hover:bg-primary-light'
                  } ${helpful !== null && helpful !== 'up' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-pressed={helpful === 'up'}
                  aria-label={helpful === 'up' ? 'Marked as helpful' : 'Mark as helpful'}
                >
                  <ThumbsUp className="h-5 w-5" aria-hidden="true" />
                  <span>Yes</span>
                  <span className="text-sm font-medium">({helpfulCount})</span>
                </button>
                <button
                  onClick={() => handleHelpful('down')}
                  disabled={helpful !== null}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-colors ${
                    helpful === 'down'
                      ? 'bg-error border-error text-white'
                      : 'border-error/30 text-error hover:bg-error-light'
                  } ${helpful !== null && helpful !== 'down' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-pressed={helpful === 'down'}
                  aria-label={helpful === 'down' ? 'Marked as not helpful' : 'Mark as not helpful'}
                >
                  <ThumbsDown className="h-5 w-5" aria-hidden="true" />
                  <span>No</span>
                </button>
                {helpful !== null && (
                  <span className="text-sm text-slate ml-2">Thanks for your feedback!</span>
                )}
              </div>
            </div>

            {/* RELATED FAQ SECTION */}
            {relatedFaqs.length > 0 && (
              <section className="mt-12 pt-8 border-t border-hairline" aria-labelledby="related-heading">
                <h2 id="related-heading" className="text-lg font-semibold text-primary! mb-6">Related questions</h2>
                <ul className="space-y-3" role="list">
                  {relatedFaqs.map((related) => (
                    <li key={related.id}>
                      <Link
                        href={`/help/faq/${related.id}`}
                        className="group flex items-center justify-between gap-4 p-4 rounded-xl bg-mist border border-hairline hover:bg-primary-light hover:border-primary transition-colors"
                      >
                        <span className="text-slate group-hover:text-primary transition-colors">{related.question}</span>
                        <ChevronRight className="flex-shrink-0 h-5 w-5 text-text-hint group-hover:text-primary transition-colors" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* BOTTOM CTA */}
            <div className="mt-12 pt-8 border-t border-hairline text-center">
              <p className="text-slate mb-4">Still need help?</p>
              <Link
                href="/help/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Contact Us
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* BACK TO FAQ LINK */}
          <div className="mt-8 text-center">
            <Link href="/help/faq" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back to all FAQs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}