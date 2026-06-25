// Final-section CTA. Large, calm, deliberately short. Drops the
// visitor back at the top of the page where the search form lives.

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CtaBanner: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <div className="relative overflow-hidden rounded-[28px] border border-ink-100 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-8 py-16 text-white sm:px-14 lg:py-24">
      {/* subtle pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '6px 6px',
        }} />
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-brand-200" />
          Ready when you are
        </span>
        <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tightest sm:text-5xl md:text-6xl">
          A chauffeur, by the hour.
          <br />
          <span className="text-white/60">Booked in under a minute.</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg text-ink-300">
          Type the address, pick the time, see real offers. The total you see is the total you pay.
        </p>
        <Link
          href="#search"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-900 transition hover:bg-brand-100">
          Search hourly options
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
);
