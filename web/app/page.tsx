import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(155deg,#e8f3ff_0%,#f9fafb_46%,#eafaf1_100%)] px-6 py-16">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-black/10 bg-white/90 p-8 shadow-[0_42px_90px_-46px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Public Website</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">Do It Platform</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          This website is for public platform content, announcements, and blog-style updates. User onboarding and
          account authentication flows are handled in the mobile app only.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            href="/blog"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-[0_20px_40px_-28px_rgba(5,150,105,0.55)]"
          >
            <p className="text-lg font-semibold text-slate-900">Platform Blog</p>
            <p className="mt-2 text-sm text-slate-600">
              Read content about roadmap milestones, launches, and platform updates.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Open blog</p>
          </Link>

          <Link
            href="/admin"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-500 hover:shadow-[0_20px_40px_-28px_rgba(79,70,229,0.5)]"
          >
            <p className="text-lg font-semibold text-slate-900">Admin Portal</p>
            <p className="mt-2 text-sm text-slate-600">
              Private workspace path for internal operations, moderation, and platform administration.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Open admin portal</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
