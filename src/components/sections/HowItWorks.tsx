// Editorial three-step layout. Wide horizontal cards with a
// numeric marker, headline, and a paragraph of considered copy.
// Subtle hover lift to signal interactivity even though there's
// no click target — communicates "this is the funnel, follow it".

import { MapPin, GitCompareArrows, KeyRound } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const STEPS = [
  {
    n: '01',
    icon: MapPin,
    title: 'Tell us where you are',
    body: 'Type an address — a hotel, the airport, a meeting venue. We resolve it to a service area instantly and pull in every partner covering it.',
  },
  {
    n: '02',
    icon: GitCompareArrows,
    title: 'Compare real offers',
    body: 'See every partner’s price for every vehicle class, side by side. No bidding, no surprise add-ons. The total you see is the total you pay.',
  },
  {
    n: '03',
    icon: KeyRound,
    title: 'Book in under a minute',
    body: 'Pay in full with Stripe. Your driver is confirmed instantly — no accept-or-decline lag. Contact details land in your inbox before pickup.',
  },
];

export const HowItWorks: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <Reveal>
      <div className="max-w-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">How it works</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
          Three steps. <span className="text-gradient">No surprises.</span>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/65">
          We built the marketplace around what we wanted ourselves — fast, transparent,
          and short on theatre.
        </p>
      </div>
    </Reveal>

    <ol className="mt-14 space-y-4">
      {STEPS.map((s, i) => (
        <li key={s.n}>
          <Reveal delay={80 + i * 80}>
            <div className="group relative overflow-hidden rounded-3xl glass transition hover:-translate-y-1 hover:border-white/20">
            <div className="grid items-stretch gap-0 md:grid-cols-[160px_1fr_auto]">
              <div className="hidden items-center justify-center border-r border-white/10 bg-white/[0.03] p-8 md:flex">
                <span className="font-mono text-5xl font-extrabold tracking-tighter text-gradient">
                  {s.n}
                </span>
              </div>
              <div className="px-8 py-7 md:py-10">
                <div className="flex items-center gap-3 md:hidden">
                  <span className="font-mono text-2xl font-extrabold text-gradient">{s.n}</span>
                  <h3 className="text-xl font-bold tracking-tight text-white">{s.title}</h3>
                </div>
                <h3 className="hidden text-2xl font-bold tracking-tight text-white md:block">{s.title}</h3>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-white/65">
                  {s.body}
                </p>
              </div>
              <div className="hidden items-center pr-10 md:flex">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-brand-300 ring-1 ring-white/10 transition group-hover:bg-white/10">
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  </section>
);
