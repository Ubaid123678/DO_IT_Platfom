'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Globe, Menu, X, Download } from 'lucide-react';

const navItems = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/categories', label: 'Categories' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/trust-and-safety', label: 'Trust & Safety' },
  { href: '/blog', label: 'Blog' },
  { href: '/help', label: 'Help' },
];

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang] = useState(languages[0]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-hairline">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Do It Home">
          <span className="text-2xl font-extrabold text-ink">Do It</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate hover:bg-mist transition-colors"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label="Select language"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{currentLang.flag}</span>
              <span>{currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <ul
                className="absolute right-0 mt-2 w-40 rounded-xl border border-hairline bg-paper py-2 shadow-lg"
                role="listbox"
                aria-label="Languages"
              >
                {languages.map((lang) => (
                  <li key={lang.code} role="option" aria-selected={lang === currentLang}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate hover:bg-mist"
                      onClick={() => setLangOpen(false)}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/login"
            className="hidden md:block text-sm font-medium text-slate transition-colors hover:text-primary"
          >
            Log In
          </Link>

          <Link
            href="/download"
            className="hidden md:flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            aria-label="Download the app"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download App
          </Link>

          <button
            className="md:hidden p-2 rounded-lg text-slate hover:bg-mist transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-hairline bg-paper px-6 py-4">
          <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-medium text-slate transition-colors hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-hairline">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-slate" aria-hidden="true" />
                <select
                  className="flex-1 rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue={currentLang.code}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <Link
                href="/login"
                className="text-base font-medium text-slate transition-colors hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/download"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                Download App
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}