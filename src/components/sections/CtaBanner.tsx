// Final-section CTA. Large, calm, deliberately short. Drops the
// visitor back at the top of the page where the search form lives.

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

export const CtaBanner: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <Reveal>
      <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 px-8 py-16 text-white shadow-glow sm:px-14 lg:py-24">
        {/* soft sheen + dot texture */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-white/20 blur-[120px]" />
          <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-[120px]" />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
          }} />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            Ready when you are
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tightest sm:text-5xl md:text-6xl">
            A chauffeur, by the hour.
            <br />
            <span className="text-white/75">Booked in under a minute.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Type the address, pick the time, see real offers. The total you see is the total you pay.
          </p>
          <Link
            href="#search"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-lg transition hover:bg-white/90">
            Search hourly options
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Reveal>
  </section>
);
