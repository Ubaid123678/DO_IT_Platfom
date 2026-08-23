'use client';

import { Smartphone, MessageSquare, Wallet, QrCode, Globe, ShieldCheck } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div className="bg-mist">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden" aria-labelledby="download-title">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[rgba(13,31,30,0.6)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT SIDE - CONTENT */}
            <div className="text-center lg:text-left">
              <h1 id="download-title" className="text-4xl md:text-5xl lg:text-[48px] font-extrabold leading-tight text-white">
                Do It, wherever you are.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Post jobs, chat with providers, track escrow — all from your pocket. The full Do It experience, optimized for mobile.
              </p>

              {/* STORE BADGES */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#"
                  className="flex items-center gap-3 w-full sm:w-auto rounded-xl bg-white px-5 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
                  aria-label="Download on the App Store"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-slate">Available on the</span>
                    <span className="block text-base">App Store</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 w-full sm:w-auto rounded-xl bg-white/10 border border-white/20 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
                  aria-label="Get it on Google Play"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 7.2l1.7 5.4H9.6l1.7-5.4H12.9m4.7 5.4c0 2.4-.8 4.4-2.4 5.9 1.3.2 2.7.7 4.1 1.5-1.2 1.8-3 2.9-5.2 2.9-4.5 0-7.9-3.7-7.9-8.3s3.4-8.3 7.9-8.3c2.2 0 4 .8 5.2 2.6-1.3-1.2-2.8-1.7-4.1-1.5.1-1.5.9-3.5 2.4-5.9H5.6v4.3h12z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-white/70">Get it on</span>
                    <span className="block text-base">Google Play</span>
                  </div>
                </a>
              </div>

              {/* QR CODE LABEL FOR MOBILE */}
              <div className="mt-8 lg:hidden text-center">
                <p className="text-white/70 text-sm mb-2">Or scan to download</p>
                <div className="inline-block bg-white p-3 rounded-xl shadow-lg">
                  <div className="h-32 w-32 bg-mist rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-primary" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - QR CODE CARD */}
            <div className="hidden lg:block">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-xs mx-auto lg:mx-0">
                <div className="text-center mb-6">
                  <QrCode className="h-12 w-12 text-white mx-auto mb-3" aria-hidden="true" />
                  <p className="text-white/80 text-sm">Scan to download</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-xl">
                  <div className="h-56 w-56 mx-auto bg-mist rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="h-40 w-40 text-primary" aria-hidden="true" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-ink">
                      Scan with camera
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-center text-white/70 text-sm">Point your camera at the QR code</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="features-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Everything you need, in your pocket
            </h2>
            <p className="mt-4 text-slate">
              The app gives you the full Do It experience — anywhere, anytime.
            </p>
          </header>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: 'Post jobs on the go',
                description: 'Create and publish jobs from anywhere. Add photos, set location, budget, and deadline in minutes.',
              },
              {
                icon: MessageSquare,
                title: 'Chat with your provider',
                description: 'Real-time messaging with push notifications. Share photos, update details, coordinate seamlessly.',
              },
              {
                icon: Wallet,
                title: 'Track escrow & payments',
                description: 'See escrow status, confirm completions, manage payouts — all with real-time updates.',
              },
            ].map((feature, index) => (
              <article key={index} className="text-center p-6 md:p-8 rounded-2xl bg-mist border border-hairline hover:border-primary/50 transition-colors">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <feature.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-2">{feature.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PHONE MOCKUP VISUAL */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="mockup-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="mockup-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              A glimpse of the app
            </h2>
            <p className="mt-4 text-slate">
              Clean, intuitive, and built for getting things done.
            </p>
          </header>

          <div className="relative max-w-2xl mx-auto">
            {/* PHONE FRAME */}
            <div className="relative aspect-[9/19] max-w-xs mx-auto">
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-b from-slate-800 to-slate-900 p-[8px] shadow-2xl">
                <div className="absolute inset-0 rounded-[28px] bg-white overflow-hidden">
                  {/* PHONE SCREEN CONTENT */}
                  <div className="h-full flex flex-col">
                    {/* STATUS BAR */}
                    <div className="h-10 px-4 flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-3 rounded-full bg-green-500" />
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </div>
                    </div>

                    {/* APP HEADER */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary!">Do It</p>
                          <p className="text-xs text-slate">Home</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        <Globe className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>

                    {/* SEARCH BAR */}
                    <div className="px-4 py-3">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" /></svg>
                        </div>
                        <input type="text" placeholder="Search jobs, providers, categories..." className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-sm placeholder-slate-400" readOnly />
                      </div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="px-4 py-3 grid grid-cols-4 gap-3">
                      {['Post Job', 'Browse', 'Messages', 'Wallet'].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center">
                            <Smartphone className="h-4 w-4 text-primary" aria-hidden="true" />
                          </div>
                          <span className="text-xs font-medium text-primary!">{action}</span>
                        </div>
                      ))}
                    </div>

                    {/* ACTIVE JOBS */}
                    <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
                      <h3 className="font-semibold text-primary!">Active Jobs</h3>
                      {[
                        { title: 'Kitchen Plumbing Repair', provider: 'Sarah Mitchell', status: 'In Progress', color: 'amber' },
                        { title: 'Website Redesign', provider: 'Marcus Chen', status: 'In Escrow', color: 'primary' },
                        { title: 'Living Room Painting', provider: 'Lisa Nguyen', status: 'Awaiting Confirmation', color: 'emerald' },
                      ].map((job, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-primary! truncate">{job.title}</p>
                              <p className="text-sm text-slate mt-0.5">Provider: {job.provider}</p>
                            </div>
                            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                              job.color === 'amber' ? 'bg-amber-light text-amber' :
                              job.color === 'primary' ? 'bg-primary-light text-primary' :
                              'bg-emerald-light text-emerald'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate">
                            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Message</span>
                            <span className="mx-1">·</span>
                            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Escrow</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* BOTTOM NAV */}
                    <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-around">
                      {['Home', 'Jobs', 'Messages', 'Profile'].map((nav, i) => (
                        <button key={i} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${i === 0 ? 'text-primary' : 'text-slate-400'}`}>
                          <Smartphone className={`h-5 w-5 ${i === 0 ? 'text-primary' : 'text-slate-400'}`} aria-hidden="true" />
                          <span className="text-xs font-medium">{nav}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEVICE SHADOW */}
            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/10 rounded-full blur-2xl" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION - RESTATED BADGES + QR */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="bottom-cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT - BADGES */}
            <div className="text-center lg:text-left">
              <h2 id="bottom-cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
                Ready to download?
              </h2>
              <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto lg:mx-0">
                Get the full Do It experience on your phone today.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#"
                  className="flex items-center gap-3 w-full sm:w-auto rounded-xl bg-white px-5 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
                  aria-label="Download on the App Store"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-slate">Available on the</span>
                    <span className="block text-base">App Store</span>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 w-full sm:w-auto rounded-xl border-2 border-white px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
                  aria-label="Get it on Google Play"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 7.2l1.7 5.4H9.6l1.7-5.4H12.9m4.7 5.4c0 2.4-.8 4.4-2.4 5.9 1.3.2 2.7.7 4.1 1.5-1.2 1.8-3 2.9-5.2 2.9-4.5 0-7.9-3.7-7.9-8.3s3.4-8.3 7.9-8.3c2.2 0 4 .8 5.2 2.6-1.3-1.2-2.8-1.7-4.1-1.5.1-1.5.9-3.5 2.4-5.9H5.6v4.3h12z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-white/70">Get it on</span>
                    <span className="block text-base">Google Play</span>
                  </div>
                </a>
              </div>
            </div>

            {/* RIGHT - QR CODE */}
            <div className="hidden lg:block">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-xs mx-auto lg:mx-0 lg:ml-auto">
                <div className="text-center mb-6">
                  <QrCode className="h-12 w-12 text-white mx-auto mb-3" aria-hidden="true" />
                  <p className="text-white/80 text-sm">Scan to download</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-xl">
                  <div className="h-56 w-56 mx-auto bg-mist rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="h-40 w-40 text-primary" aria-hidden="true" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-ink">
                      Scan with camera
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-center text-white/70 text-sm">Point your camera at the QR code</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}