// Editorial hero. Full-bleed dark photograph anchored by a large
// display headline and a floating search card. The search card
// overlaps into the section below — a deliberate visual hook that
// makes the funnel feel like a single fluid motion from "landing"
// to "browsing".
//
// Photography is referenced from Unsplash CDN for now; production
// should swap in licensed photography commissioned for the brand.

import Image from 'next/image';
import Link from 'next/link';
import { Shield, Globe2, Clock, Sparkles } from 'lucide-react';
import { HourlySearchForm } from '@/components/sections/HourlySearchForm';

export const Hero: React.FC = () => (
  <section className="relative isolate overflow-hidden bg-brand-900 text-white">
    {/* Background photograph — coastal road, twilight. */}
    <div className="absolute inset-0 -z-10">
      <Image
        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2400&q=80"
        alt=""
        priority
        fill
        className="object-cover opacity-40"
        sizes="100vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-900/85 via-brand-900/70 to-brand-900" />
      {/* subtle grid noise for "editorial" texture */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
      }} />
    </div>

    <div className="mx-auto max-w-6xl px-6 pt-28 pb-44 sm:pt-36 sm:pb-56 lg:pt-44 lg:pb-64">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-brand-300" />
          Hourly chauffeur · vetted partner network
        </span>
        <h1 className="mt-7 text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl md:text-7xl lg:text-[88px]">
          A chauffeur,<br />
          <span className="bg-gradient-to-r from-brand-200 via-white to-brand-300 bg-clip-text text-transparent">by the hour.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-300 sm:text-xl">
          Book a vetted partner driver in moments. Half a day, a full day, or
          weeks in a row — across hundreds of cities. One Sinai Taxi account.
          One transparent price.
        </p>

        {/* Trust pebbles */}
        <ul className="mt-8 flex flex-wrap gap-2.5 text-sm">
          {[
            { icon: Shield,  label: 'Vetted partners' },
            { icon: Clock,   label: 'Instant confirmation' },
            { icon: Globe2,  label: '60+ countries' },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-white/80 backdrop-blur">
              <Icon className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Floating search card overlapping into the section below. */}
    <div className="absolute inset-x-0 bottom-0 z-10 translate-y-1/2 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[28px] border border-ink-100 bg-white p-2 shadow-[0_24px_80px_-20px_rgba(11,15,30,0.45)]">
          <HourlySearchForm />
        </div>
        <p className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-white/60">
          Search · compare · book in under 60 seconds
        </p>
      </div>
    </div>
  </section>
);

// Spacer to give the overlapping search card room to breathe before
// the next section begins. Placed by the parent page right after <Hero>.
export const HeroSpacer: React.FC = () => <div className="h-72 sm:h-80 lg:h-96 bg-ink-50" />;
