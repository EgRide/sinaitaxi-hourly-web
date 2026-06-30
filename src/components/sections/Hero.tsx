// 2026 hero — dark, vivid gradient + glass, oversized type, subtle
// motion. No stock photography: the visual is a near-black canvas with
// drifting gradient orbs behind a frosted search card. The search card
// itself stays light so its inputs remain high-contrast (the app forces
// `color-scheme: light` on form controls).

import { Shield, Globe2, Clock } from 'lucide-react';
import { HourlySearchForm } from '@/components/sections/HourlySearchForm';

export const Hero: React.FC = () => (
  <section className="relative isolate overflow-hidden bg-[#070912] text-white">
    {/* Vivid gradient orbs + texture */}
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute -left-32 top-[-12%] h-[42rem] w-[42rem] rounded-full bg-brand-500/30 blur-[120px] animate-drift" />
      <div className="absolute right-[-14%] top-[6%] h-[40rem] w-[40rem] rounded-full bg-violet-600/30 blur-[130px] animate-drift" style={{ animationDelay: '-5s' }} />
      <div className="absolute bottom-[-22%] left-1/3 h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/20 blur-[130px] animate-drift" style={{ animationDelay: '-9s' }} />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '5px 5px' }}
      />
      {/* Vignette + fade into the next (light) section. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent,rgba(7,9,18,0.6))]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
    </div>

    <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-20 pb-24 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-28 lg:pb-32">
      {/* LEFT — statement */}
      <div className="max-w-xl">
        <span className="animate-fadeup inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-400 to-fuchsia-400" />
          Hourly chauffeur · 60+ countries
        </span>

        <h1 className="animate-fadeup mt-6 text-6xl font-extrabold leading-[0.92] tracking-tightest sm:text-7xl lg:text-[88px]" style={{ animationDelay: '0.05s' }}>
          Your day,
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            driven.
          </span>
        </h1>

        <p className="animate-fadeup mt-6 max-w-md text-lg leading-relaxed text-white/65" style={{ animationDelay: '0.12s' }}>
          Hire a car and chauffeur by the hour or by the day. Tell us where to pick you up,
          compare live prices from vetted partners, and pay one clear total.
        </p>

        <ul className="animate-fadeup mt-8 flex flex-wrap gap-2.5 text-sm" style={{ animationDelay: '0.18s' }}>
          {[
            { icon: Shield, label: 'Vetted partners' },
            { icon: Clock, label: 'Instant confirmation' },
            { icon: Globe2, label: '60+ countries' },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-white/80 backdrop-blur">
              <Icon className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT — frosted search card */}
      <div className="animate-fadeup lg:pt-1" style={{ animationDelay: '0.1s' }}>
        <div className="relative">
          {/* Gradient ring glow behind the card */}
          <div aria-hidden className="absolute -inset-px rounded-[30px] bg-gradient-to-br from-brand-500/40 via-violet-500/30 to-fuchsia-500/40 blur-md" />
          <div className="relative rounded-[28px] border border-white/50 bg-white/95 p-2.5 shadow-[0_40px_120px_-24px_rgba(30,94,255,0.55)] backdrop-blur-2xl sm:p-3">
            <HourlySearchForm />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/45 lg:text-left">
          Search · compare · book in under 60 seconds
        </p>
      </div>
    </div>
  </section>
);

// The card now lives inside the hero, sized naturally — the spacer is a
// no-op, kept so page.tsx imports stay valid.
export const HeroSpacer: React.FC = () => null;
