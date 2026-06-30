// Editorial layout shell for static info pages: terms, privacy,
// refunds, support. Long-form typography, sticky table-of-contents
// on lg, and a tinted hero so the four pages feel like a set.

import type React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { Reveal } from '@/components/Reveal';

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
    <main className="bg-[#070912] text-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#070912] text-white">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-[-14%] h-[38rem] w-[38rem] rounded-full bg-brand-500/20 blur-[130px]" />
          <div className="absolute right-[-12%] top-0 h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[130px]" />
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-36">
          <Reveal>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">{eyebrow}</span>
            <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tightest text-white sm:text-6xl md:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              {subtitle}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/40">
              Last updated · {new Date(lastUpdated).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">On this page</h3>
              <ul className="mt-4 space-y-2">
                {sections.map(s => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-sm text-white/55 transition hover:text-brand-300">{s.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Sections */}
          <div className="max-w-2xl space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <Reveal delay={Math.min(i, 4) * 60}>
                  <h2 className="text-2xl font-extrabold tracking-tighter text-white md:text-3xl">{s.title}</h2>
                  <div className="mt-3 max-w-none text-base leading-relaxed text-white/70 [&>p]:mt-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-1.5 [&>strong]:font-semibold [&_strong]:text-white/90">
                    {s.body}
                  </div>
                </Reveal>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {cta ? (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0E1A] px-8 py-12 text-center sm:px-14">
              <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-[110px]" />
              <h2 className="text-3xl font-extrabold tracking-tightest text-white sm:text-4xl">Still need help?</h2>
              <Link href={cta.href} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90">
                {cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      ) : null}
    </main>
    <SiteFooter />
    <WhatsAppFab />
  </>
);
