// Partner-network logo wall. Logos sit on clean light tiles so their
// brand colours read on the dark 2026 canvas. Scroll-reveal, staggered.
// Plain <img> (not next/image) to handle the mix of svg/avif/png simply.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PARTNERS: { src: string; name: string }[] = [
  { src: '/partners/mozio.svg', name: 'Mozio' },
  { src: '/partners/intui.svg', name: 'Intui' },
  { src: '/partners/mytransfers.svg', name: 'MyTransfers' },
  { src: '/partners/egride.png', name: 'EgRide' },
  { src: '/partners/airport-taxi.avif', name: 'Airport Taxi' },
  { src: '/partners/bedouin-moon.png', name: 'Bedouin Moon' },
  { src: '/partners/taxi-mecca.png', name: 'Taxi Mecca' },
  { src: '/partners/taxi-qo.png', name: 'TaxiQO' },
  { src: '/partners/tu-tours.png', name: 'TU Tours' },
  { src: '/partners/chatorai.png', name: 'Chator AI' },
];

export const Partners: React.FC = () => (
  <section className="relative isolate overflow-hidden bg-[#0B0E1A] py-24 lg:py-32">
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-[-12%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[130px]" />
    </div>

    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Our partners</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
            The network <span className="text-gradient">behind your ride.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/65">
            Vetted local fleets and trusted transfer platforms — the operators powering
            the offers you see across the marketplace.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PARTNERS.map((p, i) => (
          <Reveal key={p.name} delay={60 + (i % 5) * 60}>
            <div className="group flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/95 p-5 transition hover:-translate-y-1 hover:border-white/30 hover:shadow-glow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.name}
                loading="lazy"
                className="max-h-12 w-auto max-w-full object-contain opacity-90 transition group-hover:opacity-100"
              />
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={220}>
        <div className="mt-12 text-center">
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand-300 transition hover:text-white">
            Run a fleet? Become a partner
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
);
