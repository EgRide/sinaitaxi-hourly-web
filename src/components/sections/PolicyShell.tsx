// Editorial layout shell for static info pages: terms, privacy,
// refunds, support. Long-form typography, sticky table-of-contents
// on lg, and a tinted hero so the four pages feel like a set.

import type React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';

export interface PolicySection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;            // ISO date e.g. "2026-06-28"
  sections: PolicySection[];
  cta?: { label: string; href: string };
}

export const PolicyShell: React.FC<Props> = ({ eyebrow, title, subtitle, lastUpdated, sections, cta }) => (
  <>
    <SiteHeader />
    <main>
      {/* Hero */}
      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-36">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">{eyebrow}</span>
          <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
            {subtitle}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/40">
            Last updated · {new Date(lastUpdated).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">On this page</h3>
              <ul className="mt-4 space-y-2">
                {sections.map(s => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-sm text-ink-600 hover:text-brand-600">{s.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Sections */}
          <div className="max-w-2xl space-y-12">
            {sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-2xl font-extrabold tracking-tighter text-ink-900 md:text-3xl">{s.title}</h2>
                <div className="prose prose-ink mt-3 max-w-none text-base leading-relaxed text-ink-700 [&>p]:mt-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-1.5 [&>strong]:font-semibold">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {cta ? (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-[28px] bg-ink-50 px-8 py-12 text-center sm:px-14">
            <h2 className="text-3xl font-extrabold tracking-tightest text-ink-900 sm:text-4xl">Still need help?</h2>
            <Link href={cta.href} className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700">
              {cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}
    </main>
    <SiteFooter />
    <WhatsAppFab />
  </>
);
