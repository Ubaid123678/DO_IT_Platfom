import Link from 'next/link';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
};

const posts: Post[] = [
  {
    slug: 'building-a-trust-first-marketplace',
    title: 'Building a Trust-First Global Marketplace',
    excerpt:
      'How Do It platform design decisions improve reliability for clients and providers across borders.',
    date: '2026-04-10',
  },
  {
    slug: 'phase-one-auth-complete',
    title: 'Phase 1 Complete: Auth Foundation in Mobile App',
    excerpt:
      'A quick overview of completed auth APIs and app integration milestones for identity and account safety.',
    date: '2026-04-09',
  },
  {
    slug: 'what-comes-next-kyc-and-provider-activation',
    title: 'What Comes Next: KYC and Provider Activation',
    excerpt:
      'Roadmap for secure provider onboarding, verification workflows, and compliance gates in Phase 2.',
    date: '2026-04-10',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#eff6ff_0%,#f8fafc_50%,#ecfeff_100%)] px-6 py-14">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-black/10 bg-white/90 p-8 shadow-[0_34px_80px_-40px_rgba(15,23,42,0.35)] md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Public Content</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Do It Blog</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Product stories, roadmap updates, platform policies, and community announcements.
        </p>

        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{post.date}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Preview</p>
            </article>
          ))}
        </div>

        <div className="mt-8 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:underline">
            Back to website home
          </Link>
        </div>
      </section>
    </main>
  );
}
