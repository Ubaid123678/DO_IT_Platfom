'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Menu, X, Download, ChevronDown } from 'lucide-react';

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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="relative bg-white border-b border-hairline">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          {/* LEFT: LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Do It Home">
            <span className="text-2xl font-extrabold text-primary">Do It</span>
          </Link>

          {/* CENTER: DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation" role="menubar">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-ink hover:text-primary'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-200 ${
                      active ? 'w-full' : 'hover:w-full'
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: ACTIONS */}
          <div className="flex items-center gap-4 shrink-0">
            {/* LANGUAGE SWITCHER */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate hover:bg-mist hover:text-ink transition-colors"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>{currentLang.flag}</span>
                <span>{currentLang.code.toUpperCase()}</span>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {langOpen && (
                <ul
                  className="absolute right-0 mt-2 w-44 rounded-xl border border-hairline bg-white py-2 shadow-lg"
                  role="listbox"
                  aria-label="Languages"
                >
                  {languages.map((lang) => (
                    <li key={lang.code} role="option" aria-selected={lang === currentLang}>
                      <button
                        onClick={() => {
                          setCurrentLang(lang);
                          setLangOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate hover:bg-mist hover:text-ink"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* LOG IN LINK */}
            <Link
              href="/login"
              className="hidden lg:block text-sm font-medium text-slate hover:text-primary transition-colors"
            >
              Log In
            </Link>

            {/* DOWNLOAD APP BUTTON */}
            <Link
              href="/download"
              className="hidden lg:flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Download the app"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download App
            </Link>

            {/* MOBILE MENU TOGGLE */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate hover:bg-mist transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SLIDE-IN MENU */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* MOBILE MENU HEADER */}
          <div className="flex h-[72px] items-center justify-between px-6 border-b border-hairline">
            <Link href="/" className="flex items-center gap-2" aria-label="Do It Home">
              <span className="text-2xl font-extrabold text-primary">Do It</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-slate hover:bg-mist transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* MOBILE NAV LINKS */}
          <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-1" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? 'bg-primary-light text-primary'
                      : 'text-ink hover:bg-mist'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* LANGUAGE SWITCHER IN MOBILE MENU */}
            <div className="pt-4 border-t border-hairline">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-medium text-slate hover:bg-mist transition-colors"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-slate" aria-hidden="true" />
                  <div className="flex items-center gap-2">
                    <span>{currentLang.flag}</span>
                    <span>{currentLang.label}</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate transition-transform ${langOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {langOpen && (
                <ul className="mt-2 space-y-1 rounded-xl bg-mist p-2" role="listbox" aria-label="Languages">
                  {languages.map((lang) => (
                    <li key={lang.code} role="option" aria-selected={lang === currentLang}>
                      <button
                        onClick={() => {
                          setCurrentLang(lang);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          lang === currentLang ? 'bg-primary-light text-primary' : 'text-slate hover:bg-white hover:text-ink'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* MOBILE ACTIONS */}
            <div className="pt-4 border-t border-hairline space-y-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-base font-medium text-slate hover:bg-mist transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                Download App
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}