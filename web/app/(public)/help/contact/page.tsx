'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, ShieldCheck, Download, LifeBuoy, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  botCheck: boolean;
};

type FormErrors = Record<string, string | undefined>;

const categories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'press', label: 'Press & Media' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    botCheck: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.message.trim().length < 20) newErrors.message = 'Message must be at least 20 characters';
    if (!formData.botCheck) newErrors.botCheck = 'Please confirm you are not a robot';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleDemoError = () => {
    setErrors({
      email: 'Please enter a valid email address',
    });
    setTimeout(() => {
      setErrors({});
    }, 5000);
  };

  if (showSuccess) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-hairline rounded-2xl p-10 md:p-12 text-center shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary! mb-3">Message sent!</h1>
            <p className="text-slate mb-8 max-w-md mx-auto">
              Thanks for reaching out. We&apos;ve received your message and will get back to you within 24–48 hours.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to Help Center
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mist min-h-screen">
      {/* PAGE HEADER */}
      <section className="py-12 md:py-16 bg-white border-b border-hairline" aria-labelledby="contact-title">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 id="contact-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-slate max-w-2xl mx-auto">
            Have a question, suggestion, or need support? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT COLUMN - FORM */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white border border-hairline rounded-2xl p-6 md:p-8 shadow-sm" noValidate>
              {/* NAME */}
              <div className="mb-5">
                <label htmlFor="name" className="block text-sm font-medium text-primary! mb-1.5">
                  Name <span className="text-error" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full h-12 px-4 text-base text-ink placeholder:text-text-hint rounded-xl border transition-colors ${
                    errors.name
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-hairline focus:ring-2 focus:ring-primary focus:border-transparent'
                  }`}
                  placeholder="Your full name"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* EMAIL - with error demo */}
              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-medium text-primary! mb-1.5">
                  Email <span className="text-error" aria-hidden="true">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full h-12 px-4 text-base text-ink placeholder:text-text-hint rounded-xl transition-colors ${
                    errors.email
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-hairline focus:ring-2 focus:ring-primary focus:border-transparent'
                  }`}
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* SUBJECT */}
              <div className="mb-5">
                <label htmlFor="subject" className="block text-sm font-medium text-primary! mb-1.5">
                  Subject <span className="text-error" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full h-12 px-4 text-base text-ink placeholder:text-text-hint rounded-xl transition-colors ${
                    errors.subject
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-hairline focus:ring-2 focus:ring-primary focus:border-transparent'
                  }`}
                  placeholder="Brief summary of your inquiry"
                  aria-invalid={errors.subject ? 'true' : 'false'}
                  aria-describedby={errors.subject ? 'subject-error' : undefined}
                  disabled={isSubmitting}
                />
                {errors.subject && (
                  <p id="subject-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* CATEGORY DROPDOWN */}
              <div className="mb-5">
                <label htmlFor="category" className="block text-sm font-medium text-primary! mb-1.5">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-12 px-4 text-base text-ink rounded-xl border-hairline focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white"
                  disabled={isSubmitting}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* MESSAGE */}
              <div className="mb-5">
                <label htmlFor="message" className="block text-sm font-medium text-primary! mb-1.5">
                  Message <span className="text-error" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full px-4 py-3 text-base text-ink placeholder:text-text-hint rounded-xl resize-none transition-colors ${
                    errors.message
                      ? 'border-error focus:ring-2 focus:ring-error/20'
                      : 'border-hairline focus:ring-2 focus:ring-primary focus:border-transparent'
                  }`}
                  placeholder="Describe your question or issue in detail..."
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'message-error' : 'message-hint'}
                  disabled={isSubmitting}
                />
                {errors.message ? (
                  <p id="message-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {errors.message}
                  </p>
                ) : (
                  <p id="message-hint" className="mt-1.5 text-xs text-text-hint">Minimum 20 characters</p>
                )}
              </div>

              {/* BOT PROTECTION */}
              <div className="mb-6">
                <div className="relative p-4 rounded-xl border border-hairline bg-mist">
                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        id="botCheck"
                        name="botCheck"
                        checked={formData.botCheck}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-hairline text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="text-sm text-slate">
                      <p className="font-medium text-primary!">I&apos;m not a robot</p>
                      <p>This helps protect our forms from automated submissions.</p>
                    </div>
                  </div>
                  {errors.botCheck && (
                    <p className="mt-2 text-sm text-error flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {errors.botCheck}
                    </p>
                  )}
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" aria-hidden="true" />
                    Send Message
                  </>
                )}
              </button>

              {/* DEMO ERROR BUTTON */}
              <button
                type="button"
                onClick={handleDemoError}
                className="mt-4 w-full h-10 rounded-xl border border-hairline px-4 text-sm font-medium text-slate hover:bg-mist transition-colors"
              >
                Show validation error demo
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN - REASSURANCE CONTENT */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* RESPONSE TIME */}
              <div className="bg-white border border-hairline rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary!">We typically respond within 24–48 hours</h2>
                    <p className="mt-1 text-slate">Our support team reviews every message personally. Urgent safety issues are prioritized.</p>
                  </div>
                </div>

                {/* ALTERNATIVE HELP PATHS */}
                <div className="space-y-4" role="list" aria-label="Alternative help paths">
                  <Link
                    href="/help/faq"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-mist border border-hairline hover:bg-primary-light hover:border-primary transition-colors"
                    role="listitem"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary! group-hover:text-primary transition-colors">Browse the FAQ</p>
                      <p className="text-sm text-slate">Find instant answers to common questions</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-hint group-hover:text-primary transition-colors" aria-hidden="true" />
                  </Link>

                  <Link
                    href="/help/report"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-mist border border-hairline hover:bg-error-light hover:border-error transition-colors"
                    role="listitem"
                  >
                    <div className="h-10 w-10 rounded-lg bg-error-light flex items-center justify-center flex-shrink-0">
                      <LifeBuoy className="h-5 w-5 text-error" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary! group-hover:text-error transition-colors">Report a Safety Issue</p>
                      <p className="text-sm text-slate">Confidential reporting for urgent concerns</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-hint group-hover:text-error transition-colors" aria-hidden="true" />
                  </Link>

                  <Link
                    href="/download"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-mist border border-hairline hover:bg-primary-light hover:border-primary transition-colors"
                    role="listitem"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                      <Download className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary! group-hover:text-primary transition-colors">Download the App</p>
                      <p className="text-sm text-slate">Get live chat support and ticket history in-app</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-hint group-hover:text-primary transition-colors" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* ADDITIONAL REASSURANCE */}
              <div className="bg-primary-light border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold text-primary-dark">Your privacy matters</h3>
                </div>
                <p className="text-sm text-primary">
                  We only use your contact information to respond to your inquiry. We never share your data with third parties for marketing. See our <Link href="/legal/privacy-policy" className="underline hover:text-primary-dark">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}