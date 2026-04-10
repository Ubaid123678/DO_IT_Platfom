export default function AdminPortalPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(150deg,#eef2ff_0%,#f8fafc_52%,#e0f2fe_100%)] px-6 py-14">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-indigo-200 bg-white/90 p-8 shadow-[0_36px_84px_-42px_rgba(15,23,42,0.35)] md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Private Website</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Admin Portal</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This route is reserved for internal operations. Public website users should not use this path.
          Authentication and authorization strategy for production deployment is managed as private-admin access control.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Planned Admin Modules</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>KYC reviews and provider approvals</li>
              <li>Dispute oversight and moderation actions</li>
              <li>Risk monitoring and suspicious activity review</li>
              <li>Platform health dashboards and operational reports</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Current State</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Separate private path established at /admin</li>
              <li>Public website content separated from admin scope</li>
              <li>Mobile app retains all end-user auth and onboarding flows</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
