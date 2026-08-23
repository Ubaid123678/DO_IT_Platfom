'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, User, Upload, AlertCircle, CheckCircle2, ChevronRight, Paperclip } from 'lucide-react';

type FormData = {
  jobId: string;
  name: string;
  email: string;
  description: string;
  botCheck: boolean;
  files: File[];
};

type FormErrors = Record<string, string | undefined>;

export default function ReportPage() {
  const [formData, setFormData] = useState<FormData>({
    jobId: '',
    name: '',
    email: '',
    description: '',
    botCheck: false,
    files: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, files: 'Only images, PDFs, and text files are allowed' }));
        return false;
      }
      if (file.size > maxSize) {
        setErrors((prev) => ({ ...prev, files: 'Files must be under 10MB each' }));
        return false;
      }
      return true;
    });
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...validFiles] }));
    if (errors.files) setErrors((prev) => ({ ...prev, files: undefined }));
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Your name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.description.trim()) newErrors.description = 'Please describe the issue';
    if (formData.description.trim().length < 50) newErrors.description = 'Description must be at least 50 characters';
    if (!formData.botCheck) newErrors.botCheck = 'Please confirm you are not a robot';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    const ref = `SFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setReferenceNumber(ref);
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="bg-mist min-h-screen flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-hairline rounded-2xl p-10 md:p-12 text-center shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-amber-light flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-amber" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary! mb-3">Report received</h1>
            <p className="text-slate mb-4">
              Thank you for reporting this issue. Your report has been submitted to our Trust & Safety team.
            </p>
            <div className="mb-6 p-4 rounded-xl bg-amber-light border border-amber/30">
              <p className="text-sm text-amber-dark font-medium">Reference Number</p>
              <p className="mt-1 text-xl font-mono font-bold text-primary!">{referenceNumber}</p>
              <p className="mt-2 text-xs text-amber">Save this number for follow-up inquiries.</p>
            </div>
            <p className="text-slate mb-8 max-w-md mx-auto">
              Our team will review your report with elevated priority and follow up by email within 24–48 hours if we need more information.
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
      <section className="py-12 md:py-16 bg-white border-b border-hairline" aria-labelledby="report-title">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-14 w-14 rounded-xl bg-amber-light flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-amber" aria-hidden="true" />
            </div>
          </div>
          <h1 id="report-title" className="text-4xl md:text-5xl font-extrabold leading-tight text-primary!">
            Report a Safety Issue
          </h1>
          <p className="mt-4 text-lg text-slate max-w-xl mx-auto">
            This report goes directly to our Trust & Safety team. You do not need an account to submit a report. All submissions are handled confidentially and reviewed with elevated priority.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-white border border-hairline rounded-2xl p-6 md:p-8 shadow-sm" noValidate>
          {/* JOB ID / PROVIDER USERNAME (OPTIONAL) */}
          <div className="mb-5">
            <label htmlFor="jobId" className="block text-sm font-medium text-primary! mb-1.5">
              Job ID or Provider Username
              <span className="text-text-hint font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              id="jobId"
              name="jobId"
              value={formData.jobId}
              onChange={handleChange}
              className="w-full h-12 px-4 text-base text-ink placeholder:text-text-hint rounded-xl border border-hairline focus:outline-none focus:ring-0 transition-colors"
              placeholder="e.g., JOB-12345 or provider_username"
              disabled={isSubmitting}
            />
            <p className="mt-1.5 text-xs text-text-hint">If you have it, this helps us locate the issue faster.</p>
          </div>

          {/* YOUR NAME */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-primary! mb-1.5">
              Your Name <span className="text-amber" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 text-text-hint -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full h-12 pl-12 pr-4 text-base text-ink placeholder:text-text-hint rounded-xl transition-colors ${
                  errors.name
                    ? 'border border-error focus:outline-none focus:ring-0'
                    : 'border border-hairline focus:outline-none focus:ring-0'
                }`}
                placeholder="Your full name"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                disabled={isSubmitting}
              />
            </div>
            {errors.name && (
              <p id="name-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.name}
              </p>
            )}
          </div>

          {/* YOUR EMAIL */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-primary! mb-1.5">
              Your Email <span className="text-amber" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 text-text-hint -translate-y-1/2" aria-hidden="true" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full h-12 pl-12 pr-4 text-base text-ink placeholder:text-text-hint rounded-xl transition-colors ${
                  errors.email
                    ? 'border border-error focus:outline-none focus:ring-0'
                    : 'border border-hairline focus:outline-none focus:ring-0'
                }`}
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
              />
            </div>
            <p className="mt-1.5 text-xs text-text-hint">We&apos;ll only use this to follow up on your report.</p>
            {errors.email && (
              <p id="email-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.email}
              </p>
            )}
          </div>

          {/* DESCRIPTION OF ISSUE */}
          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-medium text-primary! mb-1.5">
              Description of the Issue <span className="text-amber" aria-hidden="true">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              className={`w-full px-4 py-3 text-base text-ink placeholder:text-text-hint rounded-xl resize-none transition-colors ${
                errors.description
                  ? 'border border-error focus:outline-none focus:ring-0'
                  : 'border border-hairline focus:outline-none focus:ring-0'
              }`}
              placeholder="Describe the safety issue in detail. Include dates, times, what happened, who was involved, and any other relevant information."
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'description-error' : 'description-hint'}
              disabled={isSubmitting}
            />
            {errors.description ? (
              <p id="description-error" className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.description}
              </p>
            ) : (
              <p id="description-hint" className="mt-1.5 text-xs text-text-hint">Minimum 50 characters. Be as specific as possible.</p>
            )}
          </div>

          {/* EVIDENCE UPLOAD */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-primary! mb-1.5">
              Evidence Upload <span className="text-text-hint font-normal ml-1">(optional)</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
                dragActive
                  ? 'border-amber bg-amber-light'
                  : 'border border-hairline hover:border-amber hover:bg-amber-light/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="evidence"
                name="evidence"
                multiple
                accept="image/*,application/pdf,text/plain"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
                aria-label="Upload evidence files"
              />
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    dragActive ? 'bg-amber text-white' : 'bg-amber-light text-amber'
                  }`}>
                    <Upload className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <p className="font-medium text-primary! mb-1">Drag & drop files here, or click to browse</p>
                <p className="text-sm text-slate mb-3">Images, PDFs, text files (max 10MB each)</p>
                <p className="text-xs text-amber flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Files are securely uploaded and encrypted
                </p>
              </div>
            </div>
            {formData.files.length > 0 && (
              <div className="mt-4 space-y-2" role="list" aria-label="Uploaded files">
                {formData.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-mist border border-hairline"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-5 w-5 text-slate" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-primary! truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-text-hint">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-error hover:text-error/80 text-sm font-medium"
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.files && (
              <p className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.files}
              </p>
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
                    className="h-5 w-5 rounded border border-hairline text-amber focus:outline-none focus:ring-0"
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
            className="w-full h-12 rounded-xl bg-amber-dark px-6 text-base font-semibold text-white transition-colors hover:bg-amber focus:outline-none focus:ring-2 focus:ring-amber-dark focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Paperclip className="h-5 w-5" aria-hidden="true" />
                Submit Report
              </>
            )}
          </button>
        </form>

        {/* REASSURANCE FOOTNOTE */}
        <div className="mt-8 p-5 rounded-xl bg-amber-light border border-amber/30 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-amber" aria-hidden="true" />
            <span className="font-semibold text-amber-dark">Reports are reviewed with elevated priority by our Trust & Safety team.</span>
          </div>
          <p className="text-sm text-amber">
            You do not need an account to submit a report. All submissions are confidential.
          </p>
        </div>
      </div>
    </div>
  );
}