// Editorial hero. Full-bleed dark photograph behind a left-rail
// headline and a roomy search card that lives INSIDE the hero
// — no floating overlap into the next section (that pattern was
// elegant on a fixed-height form but the form's resolution panel
// grew the card past the spacer and chopped off the bottom).
//
// The hero now sizes naturally to fit whatever the search form
// currently shows; the spacing below the form scales with viewport
// height so the visual breathing room stays consistent.

import Image from 'next/image';
import { Shield, Globe2, Clock, Sparkles } from 'lucide-react';
import { HourlySearchForm } from '@/components/sections/HourlySearchForm';

export const Hero: React.FC = () => (
  <section className="relative isolate overflow-hidden bg-brand-900 text-white">
    {/* Background photograph — twilight coastal road. */}
    <div className="absolute inset-0 -z-10">
      <Image
        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2400&q=80"
        alt=""
        priority
        fill
        className="object-cover opacity-35"
        sizes="100vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-900/85 via-brand-900/70 to-brand-900" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}
      />
    </div>

    <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-24 lg:pb-28">
      {/* LEFT — headline + trust pebbles */}
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-brand-300" />
          Hourly chauffeur · vetted network
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-[0.95] tracking-tightest sm:text-5xl md:text-6xl lg:text-[64px]">
          A chauffeur,
          <br />
          <span className="bg-gradient-to-r from-brand-200 via-white to-brand-300 bg-clip-text text-transparent">
            by the hour.
          </span>
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-300 sm:text-lg">
          Book a vetted partner driver in moments. Half a day, a full day, or weeks in
          a row — across hundreds of cities. One transparent price.
        </p>

        <ul className="mt-7 flex flex-wrap gap-2 text-sm">
          {[
            { icon: Shield,  label: 'Vetted partners' },
            { icon: Clock,   label: 'Instant confirmation' },
            { icon: Globe2,  label: '60+ countries' },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/85 backdrop-blur">
              <Icon className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT — search card. Sits inside the hero, never cut. The
          card's height grows freely as the form's resolution panel
          and per-day schedule expand. */}
      <div className="lg:pt-1">
        <div className="rounded-[24px] border border-white/15 bg-white/95 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] sm:p-2.5">
          <HourlySearchForm />
        </div>
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.18em] text-white/55 lg:text-left">
          Search · compare · book in under 60 seconds
        </p>
      </div>
    </div>
  </section>
);

// The spacer used to give the old floating-card composition room
// to breathe. Now the card lives inside the hero, so the spacer
// is a no-op. Kept as an export so page.tsx imports stay valid.
export const HeroSpacer: React.FC = () => null;
