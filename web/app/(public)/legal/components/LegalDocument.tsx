'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, FileText, ChevronRight } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  level: 1 | 2;
  content: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  sections: Section[];
  description?: string;
}

export default function LegalDocument({ title, lastUpdated, sections, description }: LegalDocumentProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Build flat list of H2 sections for TOC
  const tocSections = sections.filter((s) => s.level === 2);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      Object.values(sectionRefs.current).forEach((el) => {
        if (el) observerRef.current?.unobserve(el);
      });
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (tocOpen) setTocOpen(false);
  };

  return (
    <div className="legal-document bg-mist min-h-screen">
      {/* PAGE HEADER */}
      <section className="py-12 md:py-16 bg-white border-b border-hairline" aria-labelledby="doc-title">
        <div className="mx-auto max-w-7xl px-6">
          <header className="max-w-3xl mx-auto text-center">
            <h1 id="doc-title" className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary!">
              {title}
            </h1>
            <p className="mt-4 text-lg text-slate">
              Last updated: {lastUpdated}
            </p>
            {description && (
              <p className="mt-4 text-slate max-w-2xl mx-auto">{description}</p>
            )}
          </header>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* LEFT SIDEBAR - TABLE OF CONTENTS */}
          <aside className="hidden lg:block" aria-label="Table of contents">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <nav className="space-y-1" aria-label="Document sections">
                {tocSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-primary-light text-primary'
                        : 'text-slate hover:bg-mist hover:text-primary'
                    }`}
                    aria-current={activeSection === section.id ? 'page' : undefined}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* MOBILE TOC DROPDOWN */}
          <div className="lg:hidden mb-8">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-hairline shadow-sm"
              aria-expanded={tocOpen}
              aria-controls="mobile-toc"
              aria-label="Table of contents"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate" aria-hidden="true" />
                <span className="font-medium text-primary!">Table of Contents</span>
              </div>
              {tocOpen ? <ChevronUp className="h-5 w-5 text-slate" /> : <ChevronDown className="h-5 w-5 text-slate" />}
            </button>
            {tocOpen && (
              <nav id="mobile-toc" className="mt-3 rounded-xl bg-white border border-hairline p-3 shadow-sm animate-in slide-in-from-top-2 duration-200" aria-label="Table of contents">
                {tocSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-light text-primary'
                        : 'text-slate hover:bg-mist hover:text-primary'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-1 max-w-2xl mx-auto lg:mx-0">
            <article className="prose prose-slate prose-lg max-w-none prose-headings:text-primary! prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:pb-4 prose-h2:border-b prose-h2:border-hairline prose-p:text-slate prose-p:leading-relaxed prose-ol:pl-6 prose-ol:list-decimal prose-li:leading-relaxed prose-li:mb-4">
              {sections.map((section) => (
                <div key={section.id} ref={(el) => { if (el) sectionRefs.current[section.id] = el; }} id={section.id}>
                  {section.level === 1 ? (
                    <h1 className="text-3xl font-extrabold text-primary! mb-6">{section.title}</h1>
                  ) : (
                    <h2 className="text-2xl font-bold text-primary! mt-12 mb-4 pb-3 border-b border-hairline">{section.title}</h2>
                  )}
                  <div className="prose prose-slate max-w-none">{section.content}</div>
                </div>
              ))}
            </article>

            {/* FOOTER NOTE */}
            <div className="mt-16 pt-8 border-t border-hairline text-center">
              <p className="text-slate">
                Questions? <Link href="/help/contact" className="text-primary font-medium hover:underline">Contact us</Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}