// Editorial three-step layout. Wide horizontal cards with a
// numeric marker, headline, and a paragraph of considered copy.
// Subtle hover lift to signal interactivity even though there's
// no click target — communicates "this is the funnel, follow it".

import { MapPin, GitCompareArrows, KeyRound } from 'lucide-react';

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
    <div className="max-w-2xl">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">How it works</span>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tightest md:text-5xl">
        Three steps. <span className="text-ink-400">No surprises.</span>
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        We built the marketplace around what we wanted ourselves — fast, transparent,
        and short on theatre.
      </p>
    </div>

    <ol className="mt-14 space-y-4">
      {STEPS.map((s) => (
        <li key={s.n} className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition hover:border-brand-200 hover:shadow-glow">
          <div className="grid items-stretch gap-0 md:grid-cols-[160px_1fr_auto]">
            <div className="hidden items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 p-8 md:flex">
              <span className="font-mono text-5xl font-extrabold tracking-tighter text-white/70">
                {s.n}
              </span>
            </div>
            <div className="px-8 py-7 md:py-10">
              <div className="flex items-center gap-3 md:hidden">
                <span className="font-mono text-2xl font-extrabold text-brand-600">{s.n}</span>
                <h3 className="text-xl font-bold tracking-tight">{s.title}</h3>
              </div>
              <h3 className="hidden text-2xl font-bold tracking-tight md:block">{s.title}</h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-600">
                {s.body}
              </p>
            </div>
            <div className="hidden items-center pr-10 md:flex">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                <s.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  </section>
);
