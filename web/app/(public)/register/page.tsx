'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Briefcase, UserCheck } from 'lucide-react';

type Role = 'client' | 'provider' | null;

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  return (
    <div className="bg-mist min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* CENTERED WHITE CARD */}
        <div className="bg-white border border-hairline rounded-2xl p-8 md:p-10 shadow-sm">
          {/* DO IT LOGO */}
          <div className="text-center mb-8">
            <span className="text-3xl font-extrabold text-primary!">Do It</span>
          </div>

          {/* HEADLINE */}
          <h1 className="text-center text-2xl md:text-3xl font-extrabold text-primary! mb-4">
            Get started with Do It.
          </h1>

          {/* EXPLANATORY TEXT */}
          <p className="text-center text-slate mb-8">
            Create your account in the app to post jobs or offer your services.
          </p>

          {/* ROLE SELECTION */}
          {!selectedRole ? (
            <div className="space-y-3 mb-8" role="radiogroup" aria-label="Choose your role">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className="group w-full flex items-center gap-4 p-5 rounded-xl border border-hairline hover:border-primary hover:bg-primary-light/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                role="radio"
                aria-checked={false}
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Briefcase className="h-6 w-6 text-primary group-hover:text-white transition-colors" aria-hidden="true" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-primary! group-hover:text-primary transition-colors">I need something done</p>
                  <p className="text-sm text-slate mt-0.5">Post jobs, hire verified pros, manage escrow</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-hint group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('provider')}
                className="group w-full flex items-center gap-4 p-5 rounded-xl border border-hairline hover:border-primary hover:bg-primary-light/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                role="radio"
                aria-checked={false}
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <UserCheck className="h-6 w-6 text-primary group-hover:text-white transition-colors" aria-hidden="true" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-primary! group-hover:text-primary transition-colors">I want to offer my services</p>
                  <p className="text-sm text-slate mt-0.5">Get verified, find jobs, build reputation</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-hint group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              {/* STORE BADGES - STACKED */}
              <div className="space-y-3 mb-8">
                <a
                  href={`#${selectedRole}`}
                  className="flex items-center gap-3 w-full rounded-xl bg-white px-5 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary-light hover:border-primary border border-hairline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label={`Download on the App Store for ${selectedRole === 'client' ? 'clients' : 'providers'}`}
                >
                  <svg className="h-6 w-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-slate">Available on the</span>
                    <span className="block text-base">App Store</span>
                  </div>
                </a>
                <a
                  href={`#${selectedRole}`}
                  className="flex items-center gap-3 w-full rounded-xl bg-white/10 border border-primary/20 px-5 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary-light hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label={`Get it on Google Play for ${selectedRole === 'client' ? 'clients' : 'providers'}`}
                >
                  <svg className="h-6 w-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 7.2l1.7 5.4H9.6l1.7-5.4H12.9m4.7 5.4c0 2.4-.8 4.4-2.4 5.9 1.3.2 2.7.7 4.1 1.5-1.2 1.8-3 2.9-5.2 2.9-4.5 0-7.9-3.7-7.9-8.3s3.4-8.3 7.9-8.3c2.2 0 4 .8 5.2 2.6-1.3-1.2-2.8-1.7-4.1-1.5.1-1.5.9-3.5 2.4-5.9H5.6v4.3h12z" /></svg>
                  <div className="text-left">
                    <span className="text-xs text-slate">Get it on</span>
                    <span className="block text-base">Google Play</span>
                  </div>
                </a>
              </div>

              {/* QR CODE SECTION */}
              <div className="text-center mb-8">
                <p className="text-sm text-slate mb-4">Or scan to open the app</p>
                <div className="inline-block bg-white p-4 rounded-xl border border-hairline shadow-sm">
                  <div className="h-40 w-40 bg-mist rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-24 w-24 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12a8 8 0 018-8 8 8 0 018 8 8 8 0 01-8 8 8 8 0 01-8-8z" />
                      </svg>
                    </div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-primary!">
                      Scan with camera
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate">QR code placeholder — replace with actual app deep-link QR</p>
              </div>

              {/* BACK TO ROLE SELECTION */}
              <div className="text-center mb-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="text-slate hover:text-primary font-medium text-sm transition-colors"
                >
                  ← Choose a different role
                </button>
              </div>
            </>
          )}

          {/* SECONDARY LINK */}
          <div className="text-center pt-6 border-t border-hairline">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate hover:text-primary transition-colors font-medium text-sm"
            >
              Already have an account? Log in
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* FOOTER NOTE */}
        <p className="mt-6 text-center text-xs text-slate">
          By continuing, you agree to our{' '}
          <Link href="/legal/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/legal/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
          .
        </p>
      </div>
    </div>
  );
}