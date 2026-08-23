'use client';

import { useState } from 'react';
import { Wallet, ArrowRight, Globe, HelpCircle, ChevronDown, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

const faqItems = [
  {
    question: 'Are there any hidden fees?',
    answer: 'No. The platform fee percentage is shown upfront before you post a job or accept a proposal. Payment processing fees (typically 2.9% + $0.30) are passed through from our payment partner and shown separately.',
  },
  {
    question: 'When is the platform fee charged?',
    answer: 'For clients, the platform fee is included in the escrow amount when you fund the job. For providers, the fee is deducted automatically when funds are released after job completion.',
  },
  {
    question: 'What happens if a dispute is opened?',
    answer: 'Escrow funds remain locked until the dispute is resolved. Our admin team reviews evidence from both parties and releases funds according to the verdict. No additional platform fees apply for dispute resolution.',
  },
  {
    question: 'Can I get a refund if I cancel a job?',
    answer: 'Yes. If you cancel before a provider is accepted, you receive a full refund including any fees. After acceptance, cancellation terms depend on the job stage — see our Help Center for details.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-mist">
      {/* PAGE HEADER */}
      <section className="py-16 md:py-24 bg-white border-b border-hairline" aria-labelledby="page-title">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 id="page-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate max-w-2xl mx-auto">
            No hidden fees. No surprises. You always know exactly what you&apos;re paying for.
          </p>
        </div>
      </section>

      {/* FEE EXPLAINER SECTION */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="fees-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="fees-heading" className="sr-only">Fee Structure</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* FOR CLIENTS CARD */}
            <article className="bg-white border border-hairline rounded-2xl overflow-hidden">
              <div className="bg-primary-light px-6 py-4 border-b border-hairline">
                <h3 className="text-xl font-bold text-primary! flex items-center gap-2">
                  <Wallet className="h-6 w-6" aria-hidden="true" />
                  For Clients
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-primary! mb-2">Platform Fee</h4>
                  <p className="text-3xl font-extrabold text-primary!">5–15%</p>
                  <p className="mt-1 text-sm text-slate">of job total (varies by category)</p>
                </div>
                <div className="border-t border-hairline pt-4 space-y-3">
                  <h4 className="font-semibold text-primary!">What it covers</h4>
                  <ul className="space-y-2 text-slate" role="list">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Matching & notifications</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Escrow protection</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />In-app messaging</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Dispute resolution</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Platform maintenance</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-amber-light p-4 border border-amber/30 flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-primary!">Payment processing</p>
                    <p className="mt-1 text-sm text-slate">~2.9% + $0.30 per transaction (passed through from payment partner)</p>
                  </div>
                </div>
              </div>
            </article>

            {/* FOR PROVIDERS CARD */}
            <article className="bg-white border border-hairline rounded-2xl overflow-hidden">
              <div className="bg-primary-light px-6 py-4 border-b border-hairline">
                <h3 className="text-xl font-bold text-primary! flex items-center gap-2">
                  <CreditCard className="h-6 w-6" aria-hidden="true" />
                  For Providers
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-primary! mb-2">Platform Fee</h4>
                  <p className="text-3xl font-extrabold text-primary!">10–20%</p>
                  <p className="mt-1 text-sm text-slate">of earnings (varies by category)</p>
                </div>
                <div className="border-t border-hairline pt-4 space-y-3">
                  <h4 className="font-semibold text-primary!">What it covers</h4>
                  <ul className="space-y-2 text-slate" role="list">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Job matching & leads</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Escrow & guaranteed payment</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Profile visibility & badges</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Payout processing</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />Support & verification</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-amber-light p-4 border border-amber/30 flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-primary!">Payment processing</p>
                    <p className="mt-1 text-sm text-slate">Deducted from payout (varies by country & method)</p>
                  </div>
                </div>
                <div className="rounded-xl bg-primary-light p-4 border border-primary/20 flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-primary!">Local currency payout</p>
                    <p className="mt-1 text-sm text-primary!">Converted at withdrawal using mid-market rate + small margin</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* HOW ESCROW WORKS SECTION */}
      <section className="py-16 md:py-24 bg-white border-y border-hairline" aria-labelledby="escrow-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="escrow-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              How Escrow Works
            </h2>
            <p className="mt-4 text-slate">
              Your money is safe. Funds are held by Do It until the job is done and you confirm.
            </p>
          </header>

          <div className="relative">
            {/* CONNECTING LINE */}
            <div className="hidden lg:block absolute top-10 left-[16.66%] right-[16.66%] h-0.5 border-t-2 border-dashed border-primary/30" aria-hidden="true" />

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
              {/* STEP 1 */}
              <article className="relative z-10 flex flex-col items-center text-center lg:w-1/3 px-4">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                  <Lock className="h-10 w-10" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-2">1. Funds Locked</h3>
                <p className="text-slate text-sm max-w-xs">
                  When you accept a proposal, the job amount (+ platform fee) is locked in escrow from your wallet.
                </p>
              </article>

              {/* STEP 2 */}
              <article className="relative z-10 flex flex-col items-center text-center lg:w-1/3 px-4 mt-12 lg:mt-0">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                  <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-2">2. Work Completed</h3>
                <p className="text-slate text-sm max-w-xs">
                  The provider completes the work and marks the job as done. You&apos;re notified to review.
                </p>
              </article>

              {/* STEP 3 */}
              <article className="relative z-10 flex flex-col items-center text-center lg:w-1/3 px-4 mt-12 lg:mt-0">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                  <ArrowRight className="h-10 w-10" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-primary! mb-2">3. Funds Released</h3>
                <p className="text-slate text-sm max-w-xs">
                  Once you confirm satisfaction, funds release to the provider minus the platform fee.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* CURRENCY CONVERSION EXPLAINER */}
      <section className="py-16 md:py-24 bg-mist" aria-labelledby="currency-heading">
        <div className="mx-auto max-w-7xl px-6">
          <h2 id="currency-heading" className="sr-only">Currency Conversion</h2>
          <div className="mx-auto max-w-2xl">
            <div className="bg-white border border-hairline rounded-2xl p-6 md:p-8 flex gap-4">
              <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-primary-light flex items-center justify-center">
                <Globe className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary!">Local currency payouts</h3>
                <p className="mt-3 text-slate leading-relaxed">
                  Providers withdraw earnings in their local currency. Conversion happens at the time of withdrawal using the mid-market exchange rate plus a small margin (typically 0.5–1.5%). No hidden markup — you&apos;ll see the exact amount before confirming.
                </p>
                <p className="mt-3 text-slate leading-relaxed">
                  Supported payout methods: bank transfer, mobile money, and digital wallets depending on your country.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ MINI-SECTION */}
      <section className="py-16 md:py-24 bg-white" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-7xl px-6">
          <header className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="faq-heading" className="text-3xl md:text-4xl font-extrabold text-primary!">
              Common Questions
            </h2>
            <p className="mt-4 text-slate">
              Quick answers about fees, escrow, and payouts.
            </p>
          </header>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group bg-white border border-hairline rounded-xl overflow-hidden"
                open={openFaq === index}
              >
                <summary
                  className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                >
                  <h3 className="font-semibold text-primary! pr-8">{item.question}</h3>
                  <ChevronDown
                    className={`flex-shrink-0 h-5 w-5 text-slate transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </summary>
                <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-slate leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}

            <div className="mt-8 text-center">
              <a
                href="/help/faq"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                View all FAQs in Help Center
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-20 bg-primary relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white">
            Questions about fees?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Our support team is happy to walk you through the details.
          </p>
          <div className="mt-10">
            <a
              href="/help/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}