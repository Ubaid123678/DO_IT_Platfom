import Link from 'next/link';
import { Globe } from 'lucide-react';

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
    title: 'For Clients',
    links: [
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/categories', label: 'Categories' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/trust-and-safety', label: 'Trust & Safety' },
    ],
  },
  {
    title: 'For Providers',
    links: [
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/categories', label: 'Categories' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/help', label: 'Help Center' },
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

const socialLinks = [
  {
    href: 'https://facebook.com',
    label: 'Facebook',
    svg: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 5.2c-1.1-1.1-2.5-1.7-4.1-1.7-1.6 0-3 .6-4.1 1.7-1.1 1.1-1.7 2.5-1.7 4.1 0 1.6.6 3 1.7 4.1l7.1 7.1c.3.3.7.5 1.1.5.4 0 .8-.2 1.1-.5l7.9-7.9c1.1-1.1 1.7-2.5 1.7-4.1 0-1.6-.6-3-1.7-4.1L18.7 5.2zM12 17.3c-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7 2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7z" /></svg>,
  },
  {
    href: 'https://twitter.com',
    label: 'Twitter',
    svg: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>,
  },
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    svg: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>,
  },
  {
    href: 'https://linkedin.com',
    label: 'LinkedIn',
    svg: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
  },
];

const legalLinks = [
  { href: '/legal/privacy-policy', label: 'Privacy Policy' },
  { href: '/legal/terms-of-service', label: 'Terms of Service' },
  { href: '/legal/cookie-policy', label: 'Cookie Policy' },
];

export default function Footer() {
  return (
    <footer className="bg-footer-bg text-mint" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6" aria-label="Do It Home">
              <span className="text-2xl font-extrabold text-white">Do It</span>
            </Link>
            <p className="text-sm text-mint/70 max-w-xs mb-6">
              Connecting people who need it done with people who can do it. Verified, safe, and fair.
            </p>
            <div className="flex gap-4" role="list" aria-label="Social links">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="text-mint/60 hover:text-white transition-colors"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.svg}
                </Link>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-semibold text-white mb-4">{column.title}</h3>
              <ul className="space-y-3" role="list">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-mint/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

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
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-mint/70 hover:text-white transition-colors" aria-expanded="false" aria-haspopup="listbox" aria-label="Select language">
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>EN</span>
              </button>
              <ul className="absolute bottom-full left-0 mb-2 w-40 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all" role="listbox" aria-label="Languages">
                <li role="option"><button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-mint hover:bg-white/10">🇺🇸 English</button></li>
                <li role="option"><button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-mint hover:bg-white/10">🇪🇸 Español</button></li>
                <li role="option"><button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-mint hover:bg-white/10">🇫🇷 Français</button></li>
                <li role="option"><button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-mint hover:bg-white/10">🇸🇦 العربية</button></li>
                <li role="option"><button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-mint hover:bg-white/10">🇨🇳 中文</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-white/10 pt-8">
          <p className="text-sm text-mint/50">
            © {new Date().getFullYear()} Do It. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-4" aria-label="Legal links">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-mint/50 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-1.5 text-sm text-mint/50">
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>EN</span>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}