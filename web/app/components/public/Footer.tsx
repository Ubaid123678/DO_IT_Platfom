'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';

const footerColumns = [
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
      { href: '/press', label: 'Press' },
    ],
  },
  {
    title: 'For Clients / Providers',
    links: [
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/categories', label: 'Categories' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/trust-and-safety', label: 'Trust & Safety' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/help', label: 'Help Center' },
      { href: '/help/contact', label: 'Contact Us' },
      { href: '/help/report', label: 'Report a Safety Issue' },
      { href: '/help/faq', label: 'FAQ' },
    ],
  },
];

const legalLinks = [
  { href: '/legal/privacy-policy', label: 'Privacy Policy' },
  { href: '/legal/terms-of-service', label: 'Terms of Service' },
  { href: '/legal/cookie-policy', label: 'Cookie Policy' },
];

const languages = [
  { code: 'en', label: 'English', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { code: 'es', label: 'Español', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'fr', label: 'Français', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\uD83C\uDDE6\uD83C\uDDF8' },
  { code: 'zh', label: '中文', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
];

const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook', icon: <FacebookIcon /> },
  { href: 'https://twitter.com', label: 'Twitter', icon: <TwitterIcon /> },
  { href: 'https://instagram.com', label: 'Instagram', icon: <InstagramIcon /> },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: <LinkedInIcon /> },
];

export default function Footer() {
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const [bottomLangOpen, setBottomLangOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', () => setIsMobile(window.innerWidth < 1024));
    return () => window.removeEventListener('resize', () => setIsMobile(window.innerWidth < 1024));
  }, []);

  return (
    <footer className="bg-[#0D1F1E] text-[#E8F8F6]" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      {/* MAIN COLUMNS */}
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-4">
          {/* COLUMN 1: BRAND */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6" aria-label="Do It Home">
              <span className="text-2xl font-extrabold text-white">Do It</span>
            </Link>
            <p className="text-sm text-[#E8F8F6]/70 max-w-xs mb-8 leading-relaxed">
              Connecting people who need it done with people who can do it. Verified, safe, and fair.
            </p>
            <div className="flex gap-4" role="list" aria-label="Social links">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="text-[#E8F8F6]/60 hover:text-white transition-colors"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="h-10 w-10 rounded-lg bg-[#E8F8F6]/80 flex items-center justify-center text-[#0D1F1E]">
                    {social.icon}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* COLUMNS 2-4: NAVIGATION */}
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              {/* MOBILE ACCORDION HEADER */}
              <button
                type="button"
                onClick={() => setOpenColumn(openColumn === column.title ? null : column.title)}
                className="md:hidden flex items-center justify-between w-full py-3 font-semibold text-white hover:text-[#E8F8F6] transition-colors"
                aria-expanded={openColumn === column.title}
                aria-controls={`footer-${column.title}`}
              >
                <span>{column.title}</span>
                {openColumn === column.title ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              <div
                id={`footer-${column.title}`}
                className={`${openColumn === column.title || !isMobile ? 'block' : 'hidden'} mt-4 space-y-3`}
                role="list"
                aria-label={column.title}
              >
                <h3 className="md:hidden sr-only">{column.title}</h3>
                <h3 className="hidden md:block text-sm font-semibold text-white mb-4">{column.title}</h3>
                <ul className="space-y-3" role="list">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#E8F8F6]/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          ))}

          {/* COLUMN 4: DOWNLOAD APP */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Download the App</h3>
            <div className="flex flex-col gap-2 mb-6">
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                aria-label="Download on the App Store"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
                <span>App Store</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                aria-label="Get it on Google Play"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 7.2l1.7 5.4H9.6l1.7-5.4H12.9m4.7 5.4c0 2.4-.8 4.4-2.4 5.9 1.3.2 2.7.7 4.1 1.5-1.2 1.8-3 2.9-5.2 2.9-4.5 0-7.9-3.7-7.9-8.3s3.4-8.3 7.9-8.3c2.2 0 4 .8 5.2 2.6-1.3-1.2-2.8-1.7-4.1-1.5.1-1.5.9-3.5 2.4-5.9H5.6v4.3h12z" /></svg>
                <span>Google Play</span>
              </a>
            </div>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#E8F8F6]/70 hover:text-white transition-colors"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>{currentLang.code.toUpperCase()}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {langOpen && (
                <ul
                  className="absolute bottom-full left-0 mb-2 w-40 rounded-xl border border-white/20 bg-[#0D1F1E]/95 backdrop-blur-sm py-2 shadow-lg"
                  role="listbox"
                  aria-label="Languages"
                >
                  {languages.map((lang) => (
                    <li key={lang.code} role="option" aria-selected={lang === currentLang}>
                      <button
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#E8F8F6]/70 hover:text-white"
                        onClick={() => {
                          setCurrentLang(lang);
                          setLangOpen(false);
                        }}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* APP STORE BADGES ROW */}
        <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-white/10">
          <a
            href="#"
            className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            aria-label="Download on the App Store"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>
            <span>App Store</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            aria-label="Get it on Google Play"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 7.2l1.7 5.4H9.6l1.7-5.4H12.9m4.7 5.4c0 2.4-.8 4.4-2.4 5.9 1.3.2 2.7.7 4.1 1.5-1.2 1.8-3 2.9-5.2 2.9-4.5 0-7.9-3.7-7.9-8.3s3.4-8.3 7.9-8.3c2.2 0 4 .8 5.2 2.6-1.3-1.2-2.8-1.7-4.1-1.5.1-1.5.9-3.5 2.4-5.9H5.6v4.3h12z" /></svg>
            <span>Google Play</span>
          </a>
        </div>

        {/* BOTTOM ROW */}
        <div className="mt-8 md:mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-[#E8F8F6]/40">
              © {new Date().getFullYear()} Do It. All rights reserved.
            </p>
            <nav className="flex flex-wrap items-center gap-4" aria-label="Legal links">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#E8F8F6]/40 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {/* LANGUAGE SWITCHER */}
              <div className="relative">
                <button
                  onClick={() => setBottomLangOpen(!bottomLangOpen)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#E8F8F6]/50 hover:text-white transition-colors"
                  aria-expanded={bottomLangOpen}
                  aria-haspopup="listbox"
                  aria-label="Select language"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span>{languages[0].code.toUpperCase()}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${bottomLangOpen ? 'rotate-180' : ''}`} />
                </button>
                {bottomLangOpen && (
                  <ul
                    className="absolute bottom-full left-0 mb-2 w-40 rounded-xl border border-white/20 bg-[#0D1F1E]/95 backdrop-blur-sm py-2 shadow-lg"
                    role="listbox"
                    aria-label="Languages"
                  >
                    {languages.map((lang) => (
                      <li key={lang.code} role="option" aria-selected={lang === languages[0]}>
                        <button
                          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#E8F8F6]/70 hover:text-white"
                          onClick={() => setBottomLangOpen(false)}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}