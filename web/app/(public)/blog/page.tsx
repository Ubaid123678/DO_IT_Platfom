'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { blogPosts, blogCategories } from '@/lib/public';

type BlogCategory = (typeof blogCategories)[0];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function CategoryTag({ category }: { category: BlogCategory }) {
  const colors: Record<string, string> = {
    teal: 'bg-primary-light text-primary border-primary/20',
    primary: 'bg-primary-light text-primary border-primary/20',
    amber: 'bg-amber-light text-amber border-amber/20',
    red: 'bg-error-light text-error border-error/20',
    purple: 'bg-purple-light text-purple border-purple/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${colors[category.color] || colors.teal}`}>
      {category.name}
    </span>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const postsPerPage = 6;

  const featuredPost = blogPosts.find((p) => p.featured);
  const regularPosts = blogPosts.filter((p) => !p.featured);

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return regularPosts;
    return regularPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory, regularPosts]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handleLoadMore = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setCurrentPage((p) => p + 1);
    setLoading(false);
  };

  const hasMore = currentPage < totalPages;

  return (
    <div className="bg-mist">
      {/* PAGE HEADER */}
      <section className="py-16 md:py-24 bg-white border-b border-hairline" aria-labelledby="page-title">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 id="page-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
            Do It Blog
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate max-w-2xl mx-auto">
            Tips, platform updates, and category spotlights.
          </p>
        </div>
      </section>

      {/* FEATURED ARTICLE */}
      {featuredPost && (
        <section className="py-16 md:py-20 bg-mist" aria-labelledby="featured-heading">
          <div className="mx-auto max-w-7xl px-6">
            <article className="relative rounded-2xl overflow-hidden bg-white border border-hairline shadow-sm">
              <Link href={`/blog/${featuredPost.slug}`} className="block">
                <div className="relative aspect-[16/9] lg:aspect-[21/10] overflow-hidden">
                  <img
                    src={featuredPost.coverImage}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <CategoryTag category={blogCategories.find((c) => c.slug === featuredPost.category)!} />
                    </div>
                    <h2 id="featured-heading" className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-3 line-clamp-2">
                      {featuredPost.title}
                    </h2>
                    <p className="text-white/90 text-base md:text-lg max-w-2xl line-clamp-3 mb-4">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">{featuredPost.author}</span>
                        <span>·</span>
                        <span>{featuredPost.authorRole}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        {formatDate(featuredPost.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber px-3 py-1 text-xs font-semibold text-white">
                  Featured
                </span>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* FILTER/TAG BAR */}
      <section className="py-8 bg-white border-y border-hairline sticky top-0 z-10" aria-labelledby="filter-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="filter-heading" className="sr-only">Filter articles by category</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide" role="group" aria-label="Blog categories">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeCategory === null ? 'bg-primary text-white' : 'bg-mist text-slate hover:bg-primary-light hover:text-primary border border-hairline'}`}
              aria-pressed={activeCategory === null}
            >
              All
            </button>
            {blogCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat.slug ? 'bg-primary text-white' : 'bg-mist text-slate hover:bg-primary-light hover:text-primary border border-hairline'}`}
                aria-pressed={activeCategory === cat.slug}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLE GRID */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="articles-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="articles-heading" className="sr-only">Articles</h2>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post) => {
              const category = blogCategories.find((c) => c.slug === post.category)!;
              return (
                <article key={post.id} className="group bg-white border border-hairline rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all duration-200">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 space-y-3">
                      <CategoryTag category={category} />
                      <h3 className="text-lg font-semibold text-primary! line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-slate text-sm line-clamp-2">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline">
                        <div className="flex items-center gap-1.5 text-xs text-text-hint">
                          <span className="font-medium text-slate">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-hint">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          {/* EMPTY STATE */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate">No articles found in this category.</p>
              <button
                onClick={() => setActiveCategory(null)}
                className="mt-4 text-primary font-medium hover:underline"
              >
                Show all categories
              </button>
            </div>
          )}

          {/* PAGINATION / LOAD MORE */}
          {hasMore && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Articles
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* SIMPLE PAGINATION (alternative) */}
          {totalPages > 1 && !hasMore && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-2 text-slate hover:bg-mist hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary text-white' : 'bg-white text-slate hover:bg-mist border border-hairline'}`}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-2 text-slate hover:bg-mist hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="newsletter-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="newsletter-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Get the latest tips & updates
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Subscribe to our newsletter for weekly insights, platform news, and category spotlights.
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl bg-white/10 border border-white/20 px-5 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent backdrop-blur-sm"
              aria-label="Email address"
              required
            />
            <button
              type="submit"
              className="flex-shrink-0 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-white/60 text-sm">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}