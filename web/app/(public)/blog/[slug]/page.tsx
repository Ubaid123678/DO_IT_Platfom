'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import { blogPosts, blogCategories } from '@/lib/public';

type BlogPost = (typeof blogPosts)[0] & { content?: string };
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

function AuthorAvatar({ name, role }: { name: string; role: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
        {initials}
      </div>
      <div>
        <p className="font-medium text-primary!">{name}</p>
        <p className="text-sm text-slate">{role}</p>
      </div>
    </div>
  );
}

function TwitterIcon() {
  return (
    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
  );
}

function SocialShare({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2" role="list" aria-label="Share this article">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-9 w-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center hover:bg-primary-light hover:border-primary transition-colors"
        aria-label="Share on Twitter"
      >
        <TwitterIcon />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-9 w-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center hover:bg-primary-light hover:border-primary transition-colors"
        aria-label="Share on Facebook"
      >
        <FacebookIcon />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-9 w-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center hover:bg-primary-light hover:border-primary transition-colors"
        aria-label="Share on LinkedIn"
      >
        <LinkedInIcon />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="h-9 w-9 rounded-lg border border-primary/30 text-primary flex items-center justify-center hover:bg-primary-light hover:border-primary transition-colors"
        aria-label="Share via email"
      >
        <Mail className="h-4.5 w-4.5" aria-hidden="true" />
      </a>
    </div>
  );
}

export default function BlogArticlePage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const post = blogPosts.find((p) => p.slug === slug) as BlogPost | undefined;

  if (!post) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to Blog
          </Link>
          <h1 className="text-3xl font-bold text-primary! mb-4">Article Not Found</h1>
          <Link href="/blog" className="text-primary hover:underline">
            Browse all articles
          </Link>
        </div>
      </div>
    );
  }

  const category = blogCategories.find((c) => c.slug === post.category)!;
  const relatedPosts = blogPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post.title;

  return (
    <div className="bg-mist min-h-screen">
      {/* BREADCRUMB */}
      <nav className="py-4 bg-white border-b border-hairline" aria-label="Breadcrumb">
        <div className="mx-auto max-w-4xl px-6">
          <ol className="flex items-center gap-2 text-sm text-slate flex-wrap" role="list">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-primary! font-medium truncate max-w-xs" aria-current="page">{post.title}</li>
          </ol>
        </div>
      </nav>

      <article className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          {/* ARTICLE HEADER */}
          <header className="mb-10">
            <CategoryTag category={category} />

            <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary!">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-hairline">
              <div className="flex items-center gap-4">
                <AuthorAvatar name={post.author} role={post.authorRole} />
                <div className="flex items-center gap-4 text-slate text-sm hidden md:flex">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {post.readTime}
                  </span>
                </div>
              </div>

              {/* DESKTOP SHARE - floating left */}
              <div className="hidden lg:block">
                <SocialShare title={shareTitle} url={articleUrl} />
              </div>
            </div>

            {/* MOBILE SHARE & META */}
            <div className="lg:hidden mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-4 text-slate text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {post.readTime}
                </span>
              </div>
              <div className="pt-4 border-t border-hairline">
                <SocialShare title={shareTitle} url={articleUrl} />
              </div>
            </div>
          </header>

          {/* COVER IMAGE */}
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-12">
            <img
              src={post.coverImage}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* ARTICLE BODY */}
          <div className="article-body prose prose-slate prose-lg max-w-none prose-img:rounded-xl prose-img:shadow-sm prose-headings:text-primary! prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate prose-strong:text-primary!">
            <div className="whitespace-pre-wrap leading-relaxed">
              {post.content || (
                <>
                  <p className="text-slate text-lg leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                  <h2>Getting Started</h2>
                  <p className="text-slate leading-relaxed mb-6">
                    When you&apos;re looking to hire a professional for any job, the first step is always understanding what you need. Take time to clearly define the scope of work, your budget range, and your timeline. The more specific you are upfront, the better matches you&apos;ll receive.
                  </p>
                  <h2>Verifying Credentials</h2>
                  <p className="text-slate leading-relaxed mb-6">
                    Always verify that your provider has the necessary licenses and insurance for the work. On Do It, every provider goes through identity verification (KYC) and skill verification for their specific categories. You can see verified badges directly on their profile.
                  </p>
                  <blockquote>
                    &ldquo;The verification badges gave me total confidence. I knew I was hiring someone who had been properly vetted.&rdquo;
                  </blockquote>
                  <p className="text-slate leading-relaxed mb-6">
                    &mdash; Amina, Do It Client
                  </p>
                  <h3>What to Look For</h3>
                  <p className="text-slate leading-relaxed mb-6">
                    When reviewing proposals, pay attention to: the provider&apos;s rating and review count, their response time, the detail in their proposal, and whether they&apos;ve completed similar jobs recently.
                  </p>
                  <div className="my-8">
                    <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop" alt="Professional at work" className="rounded-xl shadow-sm" />
                    <p className="text-center text-sm text-slate mt-2">Professional providers deliver quality work</p>
                  </div>
                  <h2>Using Escrow for Protection</h2>
                  <p className="text-slate leading-relaxed mb-6">
                    Do It&apos;s escrow system holds your payment safely until you confirm the work is complete. This protects both parties &mdash; you only pay when satisfied, and the provider knows funds are secured.
                  </p>
                  <h3>The Process</h3>
                  <ol className="list-decimal list-inside space-y-3 text-slate leading-relaxed mb-6">
                    <li>Accept a proposal &mdash; funds move to escrow</li>
                    <li>Provider completes the work</li>
                    <li>You review and confirm completion</li>
                    <li>Funds release to provider minus platform fee</li>
                  </ol>
                  <p className="text-slate leading-relaxed mb-6">
                    If something isn&apos;t right, you can open a dispute within the evidence window. Our admin team reviews fairly and releases funds according to the verdict.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* MOBILE SHARE AT BOTTOM TOO */}
          <div className="lg:hidden mt-12 pt-8 border-t border-hairline">
            <SocialShare title={shareTitle} url={articleUrl} />
          </div>

          {/* RELATED ARTICLES */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-hairline" aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-2xl font-bold text-primary! mb-8">You might also like</h2>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => {
                  const relatedCategory = blogCategories.find((c) => c.slug === relatedPost.category)!;
                  return (
                    <article key={relatedPost.id} className="group bg-white border border-hairline rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all duration-200">
                      <Link href={`/blog/${relatedPost.slug}`} className="block">
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={relatedPost.coverImage}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-5 space-y-3">
                          <CategoryTag category={relatedCategory} />
                          <h3 className="text-lg font-semibold text-primary! line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedPost.title}
                          </h3>
                          <p className="text-slate text-sm line-clamp-2">{relatedPost.excerpt}</p>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline">
                            <div className="flex items-center gap-1.5 text-xs text-text-hint">
                              <span className="font-medium text-slate">{relatedPost.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-hint">
                              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                              <time dateTime={relatedPost.publishedAt}>{formatDate(relatedPost.publishedAt)}</time>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </article>

      {/* BOTTOM CTA BAND */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Ready to get started with Do It?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Find verified professionals for your next project or start earning as a provider.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=client"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Post a Job
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Download App
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}