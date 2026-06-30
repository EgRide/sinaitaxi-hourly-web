// A concrete, honest pricing example — the survey flagged that "one
// transparent price" is asserted but never shown before checkout. These
// are REAL numbers from a live partner (Tirana, Economy Sedan): €48 for
// 4 hours, 200 km included, €0.25/km after. Your actual search shows the
// exact total before you book.

import { Check } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const ROWS: { label: string; value: string }[] = [
  { label: 'Duration', value: '4 hours' },
  { label: 'Vehicle', value: 'Economy Sedan' },
  { label: 'Distance included', value: '200 km' },
  { label: 'Beyond that', value: '€0.25 / km' },
];

export const ExamplePrice: React.FC = () => (
  <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <Reveal>
        <div className="max-w-xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Transparent pricing</span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tightest text-white md:text-5xl">
            One total. <span className="text-gradient">No maths at the door.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/65">
            The price you see at search is the price you pay — kilometre allowance included. No surge,
            no per-stop charge, no “airport fee” surprise. Here’s a real example from a live partner.
          </p>
          <ul className="mt-6 space-y-2.5">
            {[
              'The total is locked the moment you pick an offer',
              'Only the booked hours are charged — waiting time is included',
              'Extra kilometres, if any, are billed at the rate shown up front',
            ].map(point => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="glass-strong rounded-4xl p-7 lg:p-9">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/45">Example trip</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">Tirana 🇦🇱</span>
          </div>
          <dl className="mt-6 divide-y divide-white/10">
            {ROWS.map(r => (
              <div key={r.label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-white/65">{r.label}</dt>
                <dd className="text-sm font-semibold text-white">{r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-end justify-between rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 px-5 py-4 text-white shadow-glow">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Total</div>
              <div className="text-xs text-white/70">paid once, at checkout</div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">€48</div>
          </div>
          <p className="mt-3 text-center text-[11px] text-white/45">
            Live example · your search shows the exact total before you book
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);
